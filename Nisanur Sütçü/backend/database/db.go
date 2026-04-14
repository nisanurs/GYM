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

	uri := "mongodb+srv://nisa:stcnokta@test.ek07wik.mongodb.net/GymBuddy?retryWrites=true&w=majority"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Bağlantı seçeneklerini ayarla ve bağlan
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("Bağlantı hatası oluştu: ", err)
	}

	// Bağlantının gerçekten kurulup kurulmadığını kontrol et (Ping)
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Veritabanına ulaşılamıyor, ping başarısız: ", err)
	}

	fmt.Println("MongoDB Atlas'a başarıyla bağlandık! 💪")
	Client = client
}

// GetCollection istediğimiz tabloya (koleksiyona) hızlıca ulaşmamızı sağlar
func GetCollection(collectionName string) *mongo.Collection {
	return Client.Database("GymBuddy").Collection(collectionName)
}
