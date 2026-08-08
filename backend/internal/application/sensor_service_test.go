package application_test

import (
	"context"
	"testing"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/argar/sistema_monitoreo/internal/domain"
)

type stubSensorRepo struct {
	savedReadings []domain.SensorReading
}

func (s *stubSensorRepo) Save(_ context.Context, r domain.SensorReading) error {
	s.savedReadings = append(s.savedReadings, r)
	return nil
}

func (s *stubSensorRepo) FindLatestByVehicleID(_ context.Context, _ string) (*domain.SensorReading, error) {
	if len(s.savedReadings) == 0 {
		return nil, domain.ErrVehicleNotFound
	}
	r := s.savedReadings[len(s.savedReadings)-1]
	return &r, nil
}

func (s *stubSensorRepo) FindHistoricalByVehicleID(_ context.Context, _ string, limit int) ([]domain.SensorReading, error) {
	return s.savedReadings, nil
}

type stubAlertRepo struct {
	savedAlerts []domain.Alert
}

func (s *stubAlertRepo) Save(_ context.Context, a domain.Alert) error {
	s.savedAlerts = append(s.savedAlerts, a)
	return nil
}

func (s *stubAlertRepo) FindByVehicleID(_ context.Context, _ string) ([]domain.Alert, error) {
	return s.savedAlerts, nil
}

type stubBroadcaster struct {
	readings []domain.SensorReading
	alerts   []domain.Alert
}

func (b *stubBroadcaster) BroadcastSensorReading(_ string, r domain.SensorReading) {
	b.readings = append(b.readings, r)
}

func (b *stubBroadcaster) BroadcastAlert(a domain.Alert) {
	b.alerts = append(b.alerts, a)
}

func TestIngestReading_SavesReadingAndBroadcasts(t *testing.T) {
	sensorRepo := &stubSensorRepo{}
	alertRepo := &stubAlertRepo{}
	broadcaster := &stubBroadcaster{}

	svc := application.NewSensorService(sensorRepo, alertRepo, broadcaster)

	err := svc.IngestReading(context.Background(), application.IngestSensorDataRequest{
		VehicleID: "vehicle-1",
		FuelLevel: 100.0,
		Latitude:  4.7,
		Longitude: -74.1,
		Speed:     60.0,
	})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(sensorRepo.savedReadings) != 1 {
		t.Fatalf("expected 1 saved reading, got: %d", len(sensorRepo.savedReadings))
	}
	if len(broadcaster.readings) != 1 {
		t.Fatalf("expected 1 broadcasted reading, got: %d", len(broadcaster.readings))
	}
	if len(alertRepo.savedAlerts) != 0 {
		t.Fatalf("expected no alerts for high fuel, got: %d", len(alertRepo.savedAlerts))
	}
}

func TestIngestReading_LowFuelTriggersAlert(t *testing.T) {
	sensorRepo := &stubSensorRepo{}
	alertRepo := &stubAlertRepo{}
	broadcaster := &stubBroadcaster{}

	svc := application.NewSensorService(sensorRepo, alertRepo, broadcaster)

	err := svc.IngestReading(context.Background(), application.IngestSensorDataRequest{
		VehicleID: "vehicle-1",
		FuelLevel: 5.0,
	})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(alertRepo.savedAlerts) != 1 {
		t.Fatalf("expected 1 alert for low fuel, got: %d", len(alertRepo.savedAlerts))
	}
	if alertRepo.savedAlerts[0].Type != domain.AlertTypeLowFuel {
		t.Fatalf("expected LOW_FUEL alert, got: %s", alertRepo.savedAlerts[0].Type)
	}
	if len(broadcaster.alerts) != 1 {
		t.Fatalf("expected 1 broadcasted alert, got: %d", len(broadcaster.alerts))
	}
}

func TestIngestReading_EmptyVehicleIDReturnsError(t *testing.T) {
	svc := application.NewSensorService(&stubSensorRepo{}, &stubAlertRepo{}, &stubBroadcaster{})

	err := svc.IngestReading(context.Background(), application.IngestSensorDataRequest{
		VehicleID: "",
		FuelLevel: 50.0,
	})

	if err != domain.ErrInvalidSensorData {
		t.Fatalf("expected ErrInvalidSensorData, got: %v", err)
	}
}
