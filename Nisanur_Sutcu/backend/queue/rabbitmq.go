package queue

import (
	"context"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Global değişkenlerimizi tanımlıyoruz ki diğer dosyalardan erişebilelim
var Conn *amqp.Connection 
var Channel *amqp.Channel

func InitRabbitMQ() {
	url := "amqps://frxuubvy:IxGbYGqdAHr48i77wS-_8skEfKIrwbrk@chameleon.lmq.cloudamqp.com/frxuubvy" 

	if url == "" {
		url = "amqp://guest:guest@localhost:5672/"//Eğer çevresel değişkende RABBITMQ_URL tanımlı değilse, varsayılan olarak localhost'a bağlanır. Bu, geliştirme ortamında RabbitMQ'yu kolayca çalıştırabilmek için kullanışlıdır.
		log.Println("⚠️  RABBITMQ_URL bulunamadı, localhost'a bağlanılıyor...")
	}

	var err error
	// 3. RabbitMQ'ya bağlan (Lokal veya Bulut fark etmez)
	Conn, err = amqp.Dial(url)//Bu komut, RabbitMQ sunucusuna bağlanmak için kullanılır. "url" değişkeni, RabbitMQ sunucusunun adresini ve kimlik doğrulama bilgilerini içerir. Eğer bağlantı başarılı olursa, "Conn" değişkeni üzerinden RabbitMQ ile iletişim kurabiliriz. Bağlantı sırasında bir hata oluşursa, uygulama log'lar ve sonlanır.

	if err != nil {
		log.Fatalf("❌ RabbitMQ'ya bağlanamadık: %v", err)
	}

	// 4. İletişim kanalı aç
	Channel, err = Conn.Channel()//Bu komut, RabbitMQ ile iletişim kurmak için bir kanal açar. RabbitMQ'da tüm işlemler (mesaj gönderme, alma, kuyruk oluşturma vb.) bu kanal üzerinden gerçekleştirilir. Eğer kanal açılırken bir hata oluşursa, uygulama log'lar ve sonlanır.
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
			Body:        []byte(body), //Göndermek istediğimiz mesajı (örneğin kullanıcının antrenman bilgilerini içeren bir JSON metnini) byte dizisine çevirip kargo paketinin içine koyuyoruz.
		})

	if err != nil {
		log.Printf("❌ Mesaj gönderilemedi: %v", err)
		return err
	}

	log.Println("🚀 RabbitMQ: Mesaj başarıyla fırlatıldı!")
	return nil
}

// StartConsumer - Kuyruktaki mesajları dinlemeye başlar
func StartConsumer() {
	msgs, err := Channel.Consume(
		"workout_queue", // Dinlenecek kuyruk adı
		"",              // Consumer etiketi (boş kalabilir)
		true,            // Auto-ack: Mesajı alınca "okundu" bilgisini otomatik gönderir
		false,           // Exclusive
		false,           // No-local
		false,           // No-wait
		nil,             // Args
	)
	if err != nil {
		log.Fatalf("❌ Mesajlar alınamadı: %v", err)
	}

	// Mesajları sonsuza kadar dinlemek için bir kanal (goroutine) açıyoruz
	go func() {
		for d := range msgs {
			log.Printf("📥 Kuyruktan Yeni Mesaj Geldi: %s", d.Body)
			// Burada gelen veriyi (antrenman bilgisini) parse edip DB'ye yazabiliriz. Şimdilik sadece log'luyoruz.
		}
	}()

	log.Println("👂 Consumer başlatıldı, mesajlar bekleniyor...")
}


