package controllers

import (
	"context"           // İşlemlere süre sınırı (timeout) koymak için.
	"gymbuddy/database" // MongoDB'ye bağlanmak için database paketini kullanırız.
	"gymbuddy/models"   // Kullanıcı (User) yapısının (struct) neye benzediğini (isim, yaş, vb.) bilmek için.
	"net/http"          // İnternet kodları (200 OK, 400 Bad Request) için.
	"time"              // Token'ın geçerlilik süresini ayarlamak için.

	"github.com/gin-gonic/gin"         // Kuryemiz. Gelen istekleri alıp, cevap döndürmek için.
	"github.com/golang-jwt/jwt/v5"     // VIP Bilet (Token) basma makinesi.
	"go.mongodb.org/mongo-driver/bson" // MongoDB ile konuşma dili.
	"golang.org/x/crypto/bcrypt"       // Şifreleri "kırmak imkansız" hale getiren öğütücü (şifreleme aracı).
)

var jwtKey = []byte("nisakey") //Bu VIP biletlerin (Token) imzalandığı gizli kaşedir. Eğer biri sahte bir bilet yapıp sisteme girmeye çalışırsa, sistem bu kaşeye bakar. "Bunda nisakey damgası yok, bu sahte!" deyip kapıdan kovar.

func RegisterUser(c *gin.Context) {
	//Kayıt fonksiyonu. Telefon (React Native) bize bir isim, e-posta ve şifre gönderir. Biz de bu bilgileri alır, şifreyi güvenli hale getirir ve MongoDB'ye kaydederiz.
	var user models.User
	//Bu yapı (struct), telefondan gelen JSON verisini Go dilinde temsil eder. "name", "email" ve "password" alanları, kullanıcı tarafından gönderilen bilgileri tutar. JSON etiketlerini kullanarak, JSON'daki "name", "email" ve "password" alanlarının bu struct'taki Name, Email ve Password değişkenlerine karşılık geldiğini belirtiriz.

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı!"})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	//bcrypt.GenerateFromPassword fonksiyonu, kullanıcının şifresini alır ve onu "kırmak imkansız" hale getiren bir şekilde öğütür (hashler). Bu sayede, eğer bir gün kötü niyetli biri veritabanımıza sızarsa, kullanıcıların gerçek şifrelerini göremez. Sadece o şifrelerin öğütülmüş (hashed) hallerini görür, ki bu da onları kırmayı çok zorlaştırır.

	userCollection := database.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := userCollection.InsertOne(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kullanıcı kaydedilemedi!"})
		return
	}
	//
	c.JSON(http.StatusCreated, gin.H{
		"message": "Hoş geldin " + user.Name + "! Şifren güvenle saklandı. 💪",
		"id":      result.InsertedID,
	})
}

func LoginUser(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	//Bu yapı (struct), telefondan gelen JSON verisini Go dilinde temsil eder. "email" ve "password" alanları, kullanıcı tarafından gönderilen e-posta ve şifre bilgilerini tutar. JSON etiketlerini kullanarak, JSON'daki "email" ve "password" alanlarının bu struct'taki Email ve Password değişkenlerine karşılık geldiğini belirtiriz. Ayrıca "binding:"required"" etiketi, bu alanların zorunlu olduğunu belirtir. Eğer telefondan bu alanlardan biri gelmezse, sistem otomatik olarak 400 (Bad Request) hatası fırlatır.

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lütfen e-posta ve şifrenizi girin!"})
		return
	}

	userCollection := database.GetCollection("users")
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	//Bu komut, MongoDB'deki "users" koleksiyonunda, "email" alanı input.Email'e eşit olan bir kullanıcıyı bulmaya çalışır. Eğer böyle bir kullanıcı bulunamazsa veya başka bir hata oluşursa, 401 (Unauthorized) hatası döneriz. Bu durum genellikle kullanıcının yanlış e-posta girdiği anlamına gelir.

	err := userCollection.FindOne(ctx, bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-posta veya şifre hatalı!"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-posta veya şifre hatalı!"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Hour * 168).Unix(), // (168 saat = 7 gün)
	})
	//Bu komut, VIP bilet (Token) basma makinesini çalıştırır. jwt.NewWithClaims fonksiyonu, yeni bir token oluşturur. jwt.SigningMethodHS256, token'ın HMAC SHA256 algoritmasıyla imzalanacağını belirtir. jwt.MapClaims ise token'ın içine koyacağımız bilgileri (claims) temsil eder. Burada "user_id" claim'i, kullanıcının benzersiz kimliğini içerir ve "exp" claim'i, token'ın ne zaman geçersiz olacağını belirtir

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token üretilemedi!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Giriş başarılı! 🏋️‍♀️",
		"token":   tokenString,
	})
}
