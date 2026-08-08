package domain

import (
	"time"
)

type Vehicle struct {
	ID           string    `json:"id"`
	DisplayID    string    `json:"display_id"`
	Name         string    `json:"name"`
	LicensePlate string    `json:"license_plate"`
	OwnerID      string    `json:"owner_id"`
	CreatedAt    time.Time `json:"created_at"`
}

type SensorReading struct {
	ID          string    `json:"id"`
	VehicleID   string    `json:"vehicle_id"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Speed       float64   `json:"speed"`
	FuelLevel   float64   `json:"fuel_level"`
	Temperature float64   `json:"temperature"`
	RecordedAt  time.Time `json:"recorded_at"`
}

type Alert struct {
	ID        string    `json:"id"`
	VehicleID string    `json:"vehicle_id"`
	Type      AlertType `json:"type"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
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
