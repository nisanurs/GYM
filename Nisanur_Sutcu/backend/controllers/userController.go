package controllers

import (
	"context"
	"gymbuddy/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// (c *gin.Context) Ne Demek? Parantez içi her zaman "Dışarıdan bana ne verilecek?" sorusunun cevabıdır. Burada c adında bir kurye istiyoruz. *gin.Context ise bu kuryenin şirketidir (Gin framework'ü). Telefondan gelen her şey (token, JSON verisi) ve telefona göndereceğimiz her şey (200 OK, hata mesajları) bu c kuryesinin çantasındadır. Bütün işlemlerimizi bu c üzerinden yapacağız.
func UpdateTargetWeight(c *gin.Context) {
	userID, exists := c.Get("userId")
	//Bu komut, Gin'in Context'inden "userId" anahtarına sahip bir değerin olup olmadığını kontrol eder. Eğer yoksa, kullanıcı kimliği bulunamadığı için 401 (Unauthorized) hatası döneriz. Bu durum genellikle kullanıcının giriş yapmadığı veya geçersiz bir token kullandığı anlamına gelir.

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kullanıcı kimliği bulunamadı, lütfen tekrar giriş yap!"})
		return
	}

	var input struct {
		TargetWeight float64 `json:"target_weight"`
		//Bu yapı (struct), telefondan gelen JSON verisini Go dilinde temsil eder. "target_weight" alanı, kullanıcı tarafından belirlenen hedef kiloyu tutar. JSON etiketini kullanarak, JSON'daki "target_weight" alanının bu struct'taki TargetWeight değişkenine karşılık geldiğini belirtiriz.
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veri formatı hatalı!"})
		return
	}
	//Eğer telefondan rakam yerine harf ("elli beş") gelirse sistem çökmesin diye 400 (Bad Request) hatası fırlatır.

	collection := database.GetCollection("users")
	//MongoDB'deki "users" (kullanıcılar) dolabını açar. Çünkü hedef kiloyu kullanıcının kendi profiline yazacağız.

	//bson.M Nedir? MongoDB Go dilinden anlamaz. Onun kendi dili BSON'dur (M = Map anlamına gelir). Veritabanına dilekçe yazarken her zaman bson.M{} kullanırız.
	filter := bson.M{"_id": userID}
	update := bson.M{"$set": bson.M{"target_weight": input.TargetWeight}}
	//MongoDB'de güncelleme yaparken önce hangi kullanıcıyı güncelleyeceğimizi belirtmemiz gerekir (filter). Bu örnekte, "_id" alanı userID'ye eşit olan kullanıcıyı bulacağız. Sonra da o kullanıcının "target_weight" alanını input.TargetWeight ile güncelleyeceğiz (update).

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	//Diyelim ki o an internet koptu veya veritabanı çöktü. Go sonsuza kadar bekleyip sunucuyu kilitlemesin diye "Bu işlem 10 saniyeden uzun sürerse fişi çek (iptal et)" diyoruz.

	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veritabanı güncelleme hatası!"})
		return
	}
	//MongoDB'de güncelleme yaparken hata çıkabilir (örneğin veritabanı kapalıysa). Eğer bir hata olursa, 500 (Internal Server Error) hatası fırlatırız.
	c.JSON(http.StatusOK, gin.H{"message": "Hedef kilonuz başarıyla güncellendi! 🎯"})
	//Eğer her şey yolunda giderse, 200 (OK) durum kodu ve bir başarı mesajı göndeririz.
}
