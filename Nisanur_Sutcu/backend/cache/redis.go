package cache

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func InitRedis() {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		log.Println("⚠️  REDIS_URL bulunamadı.")
		return
	}

	// URL'yi manuel parçalamak yerine ParseURL ile alıp TLS'yi zorlayalım
	opt, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("❌ Redis URL ayrıştırma hatası: %v", err)
		return
	}

	// EOF HATASINI BİTİRECEK OLAN AYARLAR:
	opt.TLSConfig = &tls.Config{
		InsecureSkipVerify: true,
		MinVersion:         tls.VersionTLS12, // Güvenliği bir tık zorlayalım
	}
	opt.PoolSize = 10              // Bağlantı havuzu oluştur
	opt.MaxRetries = 3             // Koparsa 3 kere dene
	opt.ReadTimeout = 5 * time.Second

	RedisClient = redis.NewClient(opt)

	// Bağlantıyı test et
	ctx, cancel := context.WithTimeout(Ctx, 5*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️  Redis bağlantı hatası (EOF): %v", err)
		RedisClient = nil
		return
	}

	log.Println("⚡ SONUNDA! Redis bağlantısı başarılı.")
}
