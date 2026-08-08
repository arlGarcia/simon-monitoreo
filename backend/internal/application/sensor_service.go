package application

import (
	"context"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
	"github.com/argar/sistema_monitoreo/internal/ports"
	"github.com/google/uuid"
)

const defaultFuelConsumptionRatePerMinute = 0.5

type IngestSensorDataRequest struct {
	VehicleID   string
	Latitude    float64
	Longitude   float64
	Speed       float64
	FuelLevel   float64
	Temperature float64
}

type SensorService struct {
	readings    ports.SensorReadingRepository
	alerts      ports.AlertRepository
	broadcaster ports.EventBroadcaster
}

func NewSensorService(
	readings ports.SensorReadingRepository,
	alerts ports.AlertRepository,
	broadcaster ports.EventBroadcaster,
) *SensorService {
	return &SensorService{
		readings:    readings,
		alerts:      alerts,
		broadcaster: broadcaster,
	}
}

func (s *SensorService) IngestReading(ctx context.Context, req IngestSensorDataRequest) error {
	if req.VehicleID == "" {
		return domain.ErrInvalidSensorData
	}

	reading := domain.SensorReading{
		ID:          uuid.NewString(),
		VehicleID:   req.VehicleID,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Speed:       req.Speed,
		FuelLevel:   req.FuelLevel,
		Temperature: req.Temperature,
		RecordedAt:  time.Now(),
	}

	if err := s.readings.Save(ctx, reading); err != nil {
		return err
	}

	s.broadcaster.BroadcastSensorReading(req.VehicleID, reading)

	if reading.IsLowAutonomy(defaultFuelConsumptionRatePerMinute) {
		alert := s.buildLowFuelAlert(reading)
		if err := s.alerts.Save(ctx, alert); err != nil {
			return err
		}
		s.broadcaster.BroadcastAlert(alert)
	}

	return nil
}

func (s *SensorService) GetLatestReading(ctx context.Context, vehicleID string) (*domain.SensorReading, error) {
	return s.readings.FindLatestByVehicleID(ctx, vehicleID)
}

func (s *SensorService) GetHistoricalReadings(ctx context.Context, vehicleID string, limit int) ([]domain.SensorReading, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.readings.FindHistoricalByVehicleID(ctx, vehicleID, limit)
}

func (s *SensorService) buildLowFuelAlert(reading domain.SensorReading) domain.Alert {
	autonomy := reading.FuelAutonomyEstimate(defaultFuelConsumptionRatePerMinute)
	return domain.Alert{
		ID:        uuid.NewString(),
		VehicleID: reading.VehicleID,
		Type:      domain.AlertTypeLowFuel,
		Message:   buildLowFuelMessage(float64(autonomy)),
		CreatedAt: time.Now(),
	}
}

func buildLowFuelMessage(autonomyMinutes float64) string {
	if autonomyMinutes <= 0 {
		return "Fuel critically low: estimated autonomy is 0 minutes"
	}
	return "Low fuel alert: estimated less than 1 hour of autonomy remaining"
}
