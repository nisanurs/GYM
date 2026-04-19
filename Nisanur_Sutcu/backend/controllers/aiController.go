package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"gymbuddy/database"
	"gymbuddy/models"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Anthropic API yapıları
type muscleEntry struct {
	Name     string
	Count    int
	LastDate string
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicRequest struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	Messages  []anthropicMessage `json:"messages"`
	System    string             `json:"system"`
}

type anthropicContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type anthropicResponse struct {
	Content []anthropicContent `json:"content"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func GetAIRecommendation(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkisiz erişim!"})
		return
	}

	uid := userID.(primitive.ObjectID)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 1. Kullanıcı bilgilerini çek
	var user models.User
	database.GetCollection("users").FindOne(ctx, bson.M{"_id": uid}).Decode(&user)

	// 2. Son 10 antrenmanı çek
	wOpts := options.Find().
		SetSort(bson.D{{Key: "date", Value: -1}}).
		SetLimit(10)
	wCursor, _ := database.GetCollection("workouts").Find(ctx, bson.M{"user_id": uid}, wOpts)
	var workouts []models.Workout
	wCursor.All(ctx, &workouts)

	// 3. Son ölçümü çek
	var lastMeasure models.BodyMeasure
	mOpts := options.FindOne().SetSort(bson.D{{Key: "date", Value: -1}})
	database.GetCollection("measures").FindOne(ctx, bson.M{"user_id": uid}, mOpts).Decode(&lastMeasure)

	// 4. Antrenman verisini özetle — hangi kaslar ne sıklıkta çalışıldı
	muscleCount := map[string]int{}
	lastDatePerMuscle := map[string]string{}
	for _, w := range workouts {
		muscle := classifyMuscle(w.Exercise)
		muscleCount[muscle]++
		if lastDatePerMuscle[muscle] == "" || w.Date > lastDatePerMuscle[muscle] {
			lastDatePerMuscle[muscle] = w.Date
		}
	}

	// En son çalışılan kasları bul
	var muscleList []muscleEntry
	for k, v := range muscleCount {
		muscleList = append(muscleList, muscleEntry{k, v, lastDatePerMuscle[k]})
	}
	sort.Slice(muscleList, func(i, j int) bool {
		return muscleList[i].LastDate > muscleList[j].LastDate
	})

	// 5. Prompt oluştur
	prompt := buildPrompt(user, workouts, lastMeasure, muscleList)

	// 6. Anthropic API'ye gönder
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		// API key yoksa akıllı mock dön
		c.JSON(http.StatusOK, gin.H{
			"recommendation": buildMockRecommendation(user, muscleList),
			"source":         "mock",
		})
		return
	}

	recommendation, err := callAnthropicAPI(apiKey, prompt)
	if err != nil {
		// API hatasında mock'a düş
		c.JSON(http.StatusOK, gin.H{
			"recommendation": buildMockRecommendation(user, muscleList),
			"source":         "mock_fallback",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"recommendation": recommendation,
		"source":         "ai",
	})
}

func callAnthropicAPI(apiKey, prompt string) (string, error) {
	reqBody := anthropicRequest{
		Model:     "claude-haiku-4-5-20251001",
		MaxTokens: 400,
		System: `Sen GymBuddy uygulamasının yapay zeka antrenman koçusun. 
Türkçe yanıt ver. Kısa, net ve motive edici ol.
Yanıtın 3-5 cümle olsun. Teknik jargon kullanma, samimi konuş.
Sadece öneriyi yaz, giriş cümlesi ekleme.`,
		Messages: []anthropicMessage{
			{Role: "user", Content: prompt},
		},
	}

	bodyBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)

	var anthropicResp anthropicResponse
	if err := json.Unmarshal(respBytes, &anthropicResp); err != nil {
		return "", err
	}

	if anthropicResp.Error != nil {
		return "", nil
	}

	if len(anthropicResp.Content) > 0 {
		return anthropicResp.Content[0].Text, nil
	}

	return "", nil
}

func buildPrompt(user models.User, workouts []models.Workout, measure models.BodyMeasure, muscles []muscleEntry) string {
	today := time.Now().Format("2006-01-02")

	prompt := "Bugün: " + today + "\n"
	prompt += "Sporcu: " + user.Name + "\n"

	if user.TargetWeight > 0 {
		prompt += "Hedef kilo: " + floatToStr(user.TargetWeight) + " kg\n"
	}
	if user.Goal != "" {
		goalMap := map[string]string{
			"fat_loss":    "Yağ yakma",
			"muscle_gain": "Kas kazanma",
			"maintenance": "Formu koruma",
		}
		if g, ok := goalMap[user.Goal]; ok {
			prompt += "Hedef: " + g + "\n"
		}
	}

	if measure.Weight > 0 {
		prompt += "Güncel kilo: " + floatToStr(measure.Weight) + " kg\n"
	}

	if len(workouts) == 0 {
		prompt += "\nHenüz hiç antrenman kaydı yok.\n"
	} else {
		prompt += "\nSon antrenmanlar:\n"
		for i, w := range workouts {
			if i >= 5 {
				break
			}
			prompt += "- " + w.Date + ": " + w.Exercise +
				" (" + intToStr(w.Sets) + "x" + intToStr(w.Reps) + " @ " + floatToStr(w.Weight) + "kg)\n"
		}
	}

	if len(muscles) > 0 {
		prompt += "\nÇalışılan kas grupları (son→eski):\n"
		for _, m := range muscles {
			prompt += "- " + m.Name + ": " + intToStr(m.Count) + " kez, son: " + m.LastDate + "\n"
		}
	}

	prompt += "\nBu verilere bakarak yarın hangi kas grubunu çalışmalı ve neden? Ne tür egzersizler önerirsin?"
	return prompt
}

// Egzersiz adından kas grubu tahmin et
func classifyMuscle(exercise string) string {
	lower := toLower(exercise)
	switch {
	case contains(lower, "bench", "göğüs", "chest", "pres", "fly"):
		return "Göğüs"
	case contains(lower, "squat", "leg press", "bacak", "lunge", "quad"):
		return "Bacak"
	case contains(lower, "deadlift", "sırt", "row", "pull", "lat", "back"):
		return "Sırt"
	case contains(lower, "shoulder", "omuz", "military", "lateral", "overhead"):
		return "Omuz"
	case contains(lower, "curl", "bicep", "pazı"):
		return "Bicep"
	case contains(lower, "tricep", "dip", "extension"):
		return "Tricep"
	case contains(lower, "abs", "karın", "crunch", "plank"):
		return "Karın"
	case contains(lower, "calf", "baldır"):
		return "Baldır"
	default:
		return exercise
	}
}

// API yokken akıllı mock — son çalışılan kasa göre öneri
func buildMockRecommendation(user models.User, muscles []muscleEntry) string {
	name := user.Name
	if name == "" {
		name = "Sporcu"
	}

	if len(muscles) == 0 {
		return name + ", henüz antrenman kaydın yok! İlk antrenmana başlamak için göğüs veya sırt grubuyla başlamanı öneririm. Hadi ilk adımı at! 💪"
	}

	// En uzun süredir çalışılmayan kası bul
	oldest := muscles[len(muscles)-1]

	suggestions := map[string]string{
		"Göğüs":  "Bench Press, Dambıl Fly ve Push-up kombinasyonu yapabilirsin.",
		"Sırt":   "Deadlift, Barbell Row ve Lat Pulldown ile harika bir sırt antrenmanı yapabilirsin.",
		"Bacak":  "Squat, Leg Press ve Lunge ile bacaklarını çalıştır. Bacak günü atlamak yok! 🦵",
		"Omuz":   "Military Press, Lateral Raise ve Front Raise ile omuzlarını geliştir.",
		"Bicep":  "Barbell Curl, Dambıl Curl ve Hammer Curl ile pazılarını çalıştır.",
		"Tricep": "Tricep Dips, Skull Crusher ve Cable Pushdown dene.",
		"Karın":  "Plank, Crunch ve Leg Raise ile core bölgeni güçlendir.",
	}

	suggestion, ok := suggestions[oldest.Name]
	if !ok {
		suggestion = oldest.Name + " grubuna odaklan."
	}

	return name + ", " + oldest.Name + " grubunu en uzun süre önce çalıştırdın. Bugün bu gruba odaklanma zamanı! " + suggestion + " 🔥"
}

// Yardımcı fonksiyonlar
func floatToStr(f float64) string {
	return strconv.FormatFloat(f, 'f', 1, 64)
}

func intToStr(i int) string {
	return strconv.Itoa(i)
}

func toLower(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

func contains(s string, subs ...string) bool {
	for _, sub := range subs {
		if len(sub) <= len(s) {
			for i := 0; i <= len(s)-len(sub); i++ {
				if s[i:i+len(sub)] == sub {
					return true
				}
			}
		}
	}
	return false
}
