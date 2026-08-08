package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/lib/pq"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/argar/sistema_monitoreo/internal/domain"
	"github.com/argar/sistema_monitoreo/internal/infrastructure/adapters/in/web"
	"github.com/argar/sistema_monitoreo/internal/infrastructure/adapters/out/postgres"
	"github.com/google/uuid"
)

func main() {
	cfg := loadConfig()

	db, err := postgres.Connect(cfg.DB)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer db.Close()

	if err := postgres.Migrate(db); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	userRepo := postgres.NewUserRepository(db)
	vehicleRepo := postgres.NewVehicleRepository(db)
	sensorRepo := postgres.NewSensorReadingRepository(db)
	alertRepo := postgres.NewAlertRepository(db)

	wsHub := web.NewWebSocketHub()

	authService := application.NewAuthService(userRepo, []byte(cfg.JWTSecret))
	sensorService := application.NewSensorService(sensorRepo, alertRepo, wsHub)
	vehicleService := application.NewVehicleService(vehicleRepo, alertRepo)

	seedAdminUser(context.Background(), userRepo)

	authHandler := web.NewAuthHandler(authService)
	vehicleHandler := web.NewVehicleHandler(vehicleService)
	sensorHandler := web.NewSensorHandler(sensorService)

	authMiddleware := web.AuthMiddleware(authService)
	router := web.NewRouter(authHandler, vehicleHandler, sensorHandler, wsHub, authMiddleware)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("server starting on :%s", cfg.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

type config struct {
	Port      string
	JWTSecret string
	DB        postgres.Config
}

func loadConfig() config {
	port := envOrDefault("PORT", "8080")
	jwtSecret := envOrDefault("JWT_SECRET", "change-me-in-production-please")

	dbPort, _ := strconv.Atoi(envOrDefault("DB_PORT", "5432"))

	return config{
		Port:      port,
		JWTSecret: jwtSecret,
		DB: postgres.Config{
			Host:     envOrDefault("DB_HOST", "localhost"),
			Port:     dbPort,
			User:     envOrDefault("DB_USER", "postgres"),
			Password: envOrDefault("DB_PASSWORD", "postgres"),
			DBName:   envOrDefault("DB_NAME", "sistema_monitoreo"),
			SSLMode:  envOrDefault("DB_SSLMODE", "disable"),
		},
	}
}

func envOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func seedAdminUser(ctx context.Context, userRepo *postgres.UserPostgresRepository) {
	_, err := userRepo.FindByUsername(ctx, "admin")
	if err == domain.ErrUserNotFound {
		admin := domain.User{
			ID:           uuid.NewString(),
			Username:     "admin",
			PasswordHash: application.HashPassword("admin123"),
			Role:         domain.RoleAdmin,
			CreatedAt:    time.Now(),
		}
		if saveErr := userRepo.Save(ctx, admin); saveErr != nil {
			log.Printf("warning: failed to seed admin user: %v", saveErr)
		} else {
			log.Println("admin user seeded (username: admin, password: admin123)")
		}
	}
}
