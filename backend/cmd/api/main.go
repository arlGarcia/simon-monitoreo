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

	seedAdminUser(context.Background(), userRepo, vehicleRepo, sensorService)

	authHandler := web.NewAuthHandler(authService)
	vehicleHandler := web.NewVehicleHandler(vehicleService, sensorService)
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

func seedAdminUser(ctx context.Context, userRepo *postgres.UserPostgresRepository, vehicleRepo *postgres.VehiclePostgresRepository, sensorService *application.SensorService) {
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

	_, errUser := userRepo.FindByUsername(ctx, "user")
	if errUser == domain.ErrUserNotFound {
		standardUser := domain.User{
			ID:           uuid.NewString(),
			Username:     "user",
			PasswordHash: application.HashPassword("user123"),
			Role:         domain.RoleUser,
			CreatedAt:    time.Now(),
		}
		if saveErr := userRepo.Save(ctx, standardUser); saveErr != nil {
			log.Printf("warning: failed to seed standard user: %v", saveErr)
		} else {
			log.Println("standard user seeded (username: user, password: user123)")
		}
	}


	vehicles, err := vehicleRepo.FindAll(ctx)
	if err == nil && len(vehicles) == 0 {
		initialVehicles := []struct {
			name  string
			plate string
			lat   float64
			lng   float64
			points []struct {
				speed float64
				fuel  float64
				temp  float64
			}
		}{
			{
				name:  "Camión de Carga 01",
				plate: "ABC-123",
				lat:   4.6097,
				lng:   -74.0817,
				points: []struct {
					speed float64
					fuel  float64
					temp  float64
				}{
					{40.0, 95.0, 80.0},
					{55.0, 90.0, 83.0},
					{70.0, 85.0, 85.0},
					{85.0, 78.5, 88.0},
				},
			},
			{
				name:  "Furgón Reparto 02",
				plate: "XYZ-789",
				lat:   4.6500,
				lng:   -74.0500,
				points: []struct {
					speed float64
					fuel  float64
					temp  float64
				}{
					{60.0, 45.0, 85.0},
					{80.0, 30.0, 89.0},
					{95.0, 20.0, 92.0},
					{105.0, 14.0, 95.0},
				},
			},
			{
				name:  "Camioneta Logística 03",
				plate: "KLO-456",
				lat:   4.7110,
				lng:   -74.0720,
				points: []struct {
					speed float64
					fuel  float64
					temp  float64
				}{
					{30.0, 70.0, 78.0},
					{45.0, 62.0, 80.0},
					{50.0, 55.0, 81.0},
					{60.0, 50.0, 82.0},
				},
			},
		}

		for _, item := range initialVehicles {
			v := domain.Vehicle{
				ID:           uuid.NewString(),
				DisplayID:    "VEH-" + item.plate,
				Name:         item.name,
				LicensePlate: item.plate,
				OwnerID:      "flota-principal",
				CreatedAt:    time.Now(),
			}
			if err := vehicleRepo.Save(ctx, v); err == nil {
				for i, pt := range item.points {
					// Distribuir el tiempo simulado en intervalos pasados
					reading := domain.SensorReading{
						ID:          uuid.NewString(),
						VehicleID:   v.ID,
						Latitude:    item.lat + (float64(i) * 0.001),
						Longitude:   item.lng + (float64(i) * 0.001),
						Speed:       pt.speed,
						FuelLevel:   pt.fuel,
						Temperature: pt.temp,
						RecordedAt:  time.Now().Add(-time.Duration(len(item.points)-i) * 5 * time.Minute),
					}
					_ = sensorService.IngestReading(ctx, application.IngestSensorDataRequest{
						VehicleID:   reading.VehicleID,
						Latitude:    reading.Latitude,
						Longitude:   reading.Longitude,
						Speed:       reading.Speed,
						FuelLevel:   reading.FuelLevel,
						Temperature: reading.Temperature,
					})
				}
			}
		}
		log.Println("initial vehicles and rich historical telemetry data seeded automatically")
	}
}
