package domain

import (
	"time"
)

type Vehicle struct {
	ID          string
	DisplayID   string
	Name        string
	LicensePlate string
	OwnerID     string
	CreatedAt   time.Time
}

type SensorReading struct {
	ID          string
	VehicleID   string
	Latitude    float64
	Longitude   float64
	Speed       float64
	FuelLevel   float64
	Temperature float64
	RecordedAt  time.Time
}

type Alert struct {
	ID        string
	VehicleID string
	Type      AlertType
	Message   string
	CreatedAt time.Time
}

type AlertType string

const (
	AlertTypeLowFuel AlertType = "LOW_FUEL"
)

type FuelAutonomyMinutes float64

func (r SensorReading) FuelAutonomyEstimate(consumptionRatePerMinute float64) FuelAutonomyMinutes {
	if consumptionRatePerMinute <= 0 {
		return FuelAutonomyMinutes(0)
	}
	return FuelAutonomyMinutes(r.FuelLevel / consumptionRatePerMinute)
}

func (r SensorReading) IsLowAutonomy(consumptionRatePerMinute float64) bool {
	return r.FuelAutonomyEstimate(consumptionRatePerMinute) < 60
}
