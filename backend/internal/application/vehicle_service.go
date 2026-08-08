package application

import (
	"context"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
	"github.com/argar/sistema_monitoreo/internal/ports"
	"github.com/google/uuid"
)

type VehicleService struct {
	vehicles ports.VehicleRepository
	alerts   ports.AlertRepository
}

func NewVehicleService(vehicles ports.VehicleRepository, alerts ports.AlertRepository) *VehicleService {
	return &VehicleService{vehicles: vehicles, alerts: alerts}
}

func (s *VehicleService) ListVehicles(ctx context.Context) ([]domain.Vehicle, error) {
	return s.vehicles.FindAll(ctx)
}

func (s *VehicleService) GetVehicle(ctx context.Context, id string) (*domain.Vehicle, error) {
	return s.vehicles.FindByID(ctx, id)
}

func (s *VehicleService) RegisterVehicle(ctx context.Context, name, licensePlate, ownerID string) (*domain.Vehicle, error) {
	vehicle := domain.Vehicle{
		ID:           uuid.NewString(),
		DisplayID:    generateDisplayID(),
		Name:         name,
		LicensePlate: licensePlate,
		OwnerID:      ownerID,
		CreatedAt:    time.Now(),
	}
	if err := s.vehicles.Save(ctx, vehicle); err != nil {
		return nil, err
	}
	return &vehicle, nil
}

func (s *VehicleService) GetAlerts(ctx context.Context, vehicleID string) ([]domain.Alert, error) {
	return s.alerts.FindByVehicleID(ctx, vehicleID)
}

func generateDisplayID() string {
	id := generateID()
	if len(id) < 4 {
		return "DEV-0000-0000"
	}
	suffix := id[len(id)-4:]
	prefix := id[:4]
	return "DEV-" + prefix + "-" + suffix
}
