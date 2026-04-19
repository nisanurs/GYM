package queue

import (
	"context"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Global değişkenlerimizi tanımlıyoruz ki diğer dosyalardan erişebilelim
var Conn *amqp.Connection
var Channel *amqp.Channel

func InitRabbitMQ() {
	// 1. Önce Render üzerindeki Environment Variable'ı kontrol et
	// Eğer Render'a RABBITMQ_URL eklediysen onu alacak
	url := os.Getenv("RABBITMQ_URL")

	// 2. Eğer URL boşsa (yani bilgisayarında çalıştırıyorsan), local adresi kullan
	if url == "" {
		url = "amqp://guest:guest@localhost:5672/"
		log.Println("⚠️  RABBITMQ_URL bulunamadı, localhost'a bağlanılıyor...")
	}

	var err error
	// 3. RabbitMQ'ya bağlan (Lokal veya Bulut fark etmez)
	Conn, err = amqp.Dial(url)
	if err != nil {
		log.Fatalf("❌ RabbitMQ'ya bağlanamadık: %v", err)
	}

	// 4. İletişim kanalı aç
	Channel, err = Conn.Channel()
	if err != nil {
		log.Fatalf("❌ RabbitMQ kanalı açılamadı: %v", err)
	}

	// 5. Kuyruğu tanımla (Varsa bağlanır, yoksa oluşturur)
	_, err = Channel.QueueDeclare(
		"workout_queue", // Kuyruk adı
		true,            // Durable: RabbitMQ kapansa da kuyruk silinmez
		false,           // Auto-delete
		false,           // Exclusive
		false,           // No-wait
		nil,             // Arguments
	)

	if err != nil {
		log.Fatalf("❌ Kuyruk tanımlama hatası: %v", err)
	}

	log.Println("🐇 RabbitMQ başarıyla bağlandı ve kuyruk hazır!")
}

// PublishWorkoutEvent - Mesaj gönderme fonksiyonun da burada kalsın
func PublishWorkoutEvent(body string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := Channel.PublishWithContext(ctx,
		"",              // exchange
		"workout_queue", // routing key
		false,           // mandatory
		false,           // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(body),
		})

	if err != nil {
		log.Printf("❌ Mesaj gönderilemedi: %v", err)
		return err
	}

	log.Println("🚀 RabbitMQ: Mesaj başarıyla fırlatıldı!")
	return nil
}
