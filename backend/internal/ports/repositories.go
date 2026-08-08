package ports

import (
	"context"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

type UserRepository interface {
	FindByUsername(ctx context.Context, username string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	Save(ctx context.Context, user domain.User) error
}

type VehicleRepository interface {
	FindAll(ctx context.Context) ([]domain.Vehicle, error)
	FindByID(ctx context.Context, id string) (*domain.Vehicle, error)
	Save(ctx context.Context, vehicle domain.Vehicle) error
}

type SensorReadingRepository interface {
	Save(ctx context.Context, reading domain.SensorReading) error
	FindLatestByVehicleID(ctx context.Context, vehicleID string) (*domain.SensorReading, error)
	FindHistoricalByVehicleID(ctx context.Context, vehicleID string, limit int) ([]domain.SensorReading, error)
}

type AlertRepository interface {
	Save(ctx context.Context, alert domain.Alert) error
	FindByVehicleID(ctx context.Context, vehicleID string) ([]domain.Alert, error)
}
