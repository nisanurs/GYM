package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Client'ı diğer dosyalardan (models, controllers) çağırabilmek için büyük harfle (Client) tanımlıyoruz
var Client *mongo.Client

// DBConnect veritabanı bağlantısını başlatan fonksiyondur
func DBConnect() {

	uri := "mongodb+srv://nisa:stcnokta@test.ek07wik.mongodb.net/GYMBUDDY?retryWrites=true&w=majority"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Bağlantı seçeneklerini ayarla ve bağlan
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	//Bu komut, MongoDB Atlas'a bağlanmak için gerekli ayarları yapar ve bağlantıyı başlatır. "uri" değişkeni, MongoDB Atlas'taki veritabanımıza nasıl bağlanacağımızı gösteren bir bağlantı dizesidir. Bu dize içinde kullanıcı adı, şifre, sunucu adresi ve veritabanı adı gibi bilgiler bulunur.
	if err != nil {
		log.Fatal("Bağlantı hatası oluştu: ", err)
	}

	// Bağlantının gerçekten kurulup kurulmadığını kontrol et (Ping)
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Veritabanına ulaşılamıyor, ping başarısız: ", err)
	}

	fmt.Println("MongoDB Atlas'a başarıyla bağlandık! ")
	Client = client
}

func GetCollection(collectionName string) *mongo.Collection {
	return Client.Database("GYMBUDDY").Collection(collectionName)
	//Bu komut, MongoDB Atlas'taki "GYMBUDDY" adlı veritabanından istediğimiz koleksiyonu (örneğin "users", "workouts", "measures") hızlıca almamızı sağlar. Böylece diğer dosyalarda bu fonksiyonu kullanarak kolayca koleksiyonlara erişebiliriz.
}
