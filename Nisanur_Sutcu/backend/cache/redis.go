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
		log.Println("⚠️  REDIS_URL bulunamadı, cache devre dışı bırakılıyor.")
		return
	}

	opt, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("❌ Redis URL hatası: %v", err)
		return
	}

	// Render ve Upstash için kritik TLS ayarı
	opt.TLSConfig = &tls.Config{
		InsecureSkipVerify: true,
	}

	RedisClient = redis.NewClient(opt)

	// Bağlantı testi
	ctx, cancel := context.WithTimeout(Ctx, 5*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️  Redis bağlantı hatası: %v", err)
		RedisClient = nil
		return
	}

	log.Println("⚡ Redis bağlantısı başarılı!")
}
