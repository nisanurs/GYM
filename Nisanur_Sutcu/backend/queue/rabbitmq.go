package queue

import (
	"context"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go" //RabbitMQ, mesaj kuyruğu yönetimi sağlayan popüler bir mesaj aracısıdır. Bu kütüphane sayesinde Go uygulamaları RabbitMQ'ya bağlanabilir, mesaj gönderebilir ve mesajları tüketebilir.
)

var Conn *amqp.Connection
var Channel *amqp.Channel

//Bu iki değişken, RabbitMQ ile olan bağlantımızı ve iletişim kanalımızı temsil eder. "Conn" değişkeni, RabbitMQ sunucusuna olan bağlantıyı tutarken, "Channel" değişkeni bu bağlantı üzerinden açılan iletişim kanalını tutar. Bu sayede uygulamanın diğer bölümlerinde RabbitMQ ile etkileşim kurmak için bu değişkenleri kullanabiliriz.

func InitRabbitMQ() {

	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		url = "amqp://guest:guest@localhost:5672/" //Eğer çevresel değişkende RABBITMQ_URL tanımlı değilse, varsayılan olarak localhost'a bağlanır. Bu, geliştirme ortamında RabbitMQ'yu kolayca çalıştırabilmek için kullanışlıdır.
		log.Println("⚠️  RABBITMQ_URL bulunamadı, localhost'a bağlanılıyor...")
	}

	var err error
	// 3. RabbitMQ'ya bağlan (Lokal veya Bulut fark etmez)
	Conn, err = amqp.Dial(url) //Bu komut, RabbitMQ sunucusuna bağlanmak için kullanılır. "url" değişkeni, RabbitMQ sunucusunun adresini ve kimlik doğrulama bilgilerini içerir. Eğer bağlantı başarılı olursa, "Conn" değişkeni üzerinden RabbitMQ ile iletişim kurabiliriz. Bağlantı sırasında bir hata oluşursa, uygulama log'lar ve sonlanır.

	if err != nil {
		log.Fatalf("❌ RabbitMQ'ya bağlanamadık: %v", err)
	}

	// 4. İletişim kanalı aç
	Channel, err = Conn.Channel() //Bu komut, RabbitMQ ile iletişim kurmak için bir kanal açar. RabbitMQ'da tüm işlemler (mesaj gönderme, alma, kuyruk oluşturma vb.) bu kanal üzerinden gerçekleştirilir. Eğer kanal açılırken bir hata oluşursa, uygulama log'lar ve sonlanır.
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

// Mesaj gönderme fonksiyonu
func PublishWorkoutEvent(body string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := Channel.PublishWithContext(ctx,
		"",              // exchange default--> Dağıtıcı merkezi aradan çıkar, paketi direkt olarak alt satırda yazan kuyruğa teslim et.
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

// Kuyruktaki mesajları dinlemeye başlar
func StartConsumer() {
	msgs, err := Channel.Consume(
		"workout_queue", // Dinlenecek kuyruk adı
		"",              // Consumer etiketi 
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
	go func() { //Go dilinde bir fonksiyonun başına go kelimesini koyarsan, o fonksiyon Goroutine haline gelir. Yani ana programdan tamamen bağımsız, arka planda paralel olarak çalışan hafif bir iş parçacığı (Thread) gibi davranır.
		for d := range msgs {
			log.Printf("📥 Kuyruktan Yeni Mesaj Geldi: %s", d.Body)
		}
	}()

	log.Println("👂 Consumer başlatıldı, mesajlar bekleniyor...")
}
