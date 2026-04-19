package queue

import (
	"context"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// RabbitMQ bağlantısını tutacak değişken
var Conn *amqp.Connection
var Channel *amqp.Channel

func InitRabbitMQ() {
	var err error
	// Tavşana bağlanıyoruz (guest:guest@localhost:5672)
	Conn, err = amqp.Dial("amqps://frxuubvy:IxGbYGqdAHr48i77wS-_8skEfKIrwbrk@chameleon.lmq.cloudamqp.com/frxuubvy")
	if err != nil {
		log.Fatalf("RabbitMQ'ya bağlanamadık: %v", err)
	}

	Channel, err = Conn.Channel()
	if err != nil {
		log.Fatalf("Kanal açılamadı: %v", err)
	}

	// İlk kuyruğumuzu tanımlayalım: Adı "workout_queue" olsun
	_, err = Channel.QueueDeclare(
		"workout_queue", // Kuyruk adı
		true,            // Dayanıklı mı? (RabbitMQ kapanırsa silinmesin)
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Kuyruk tanımlanamadı: %v", err)
	}

	log.Println("🐇 RabbitMQ Bağlantısı Başarılı ve 'workout_queue' Hazır!")
}

// PublishWorkoutEvent - Kuyruğa antrenman verisi gönderir
func PublishWorkoutEvent(body string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := Channel.PublishWithContext(ctx,
		"",              // exchange
		"workout_queue", // routing key (kuyruk adı)
		false,           // mandatory
		false,           // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(body),
		})

	if err != nil {
		log.Printf("Mesaj gönderilemedi: %v", err)
		return err
	}

	log.Println("🚀 RabbitMQ: Antrenman verisi kuyruğa fırlatıldı!")
	return nil
}
