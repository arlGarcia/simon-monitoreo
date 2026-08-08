package domain_test

import (
	"testing"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

func TestFuelAutonomyEstimate_CalculatesCorrectly(t *testing.T) {
	reading := domain.SensorReading{
		FuelLevel: 30.0,
	}

	autonomy := reading.FuelAutonomyEstimate(0.5)

	if autonomy != 60.0 {
		t.Fatalf("expected 60.0 minutes autonomy, got: %f", autonomy)
	}
}

func TestFuelAutonomyEstimate_ZeroConsumptionReturnsZero(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 50.0}
	autonomy := reading.FuelAutonomyEstimate(0)
	if autonomy != 0 {
		t.Fatalf("expected 0 autonomy for zero consumption rate, got: %f", autonomy)
	}
}

func TestFuelAutonomyEstimate_NegativeConsumptionReturnsZero(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 50.0}
	autonomy := reading.FuelAutonomyEstimate(-1.0)
	if autonomy != 0 {
		t.Fatalf("expected 0 for negative consumption rate, got: %f", autonomy)
	}
}

func TestIsLowAutonomy_ReturnsTrueWhenLessThan60Minutes(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 20.0}
	if !reading.IsLowAutonomy(0.5) {
		t.Fatal("expected IsLowAutonomy=true for 40 minutes autonomy")
	}
}

func TestIsLowAutonomy_ReturnsFalseWhenExactly60Minutes(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 30.0}
	if reading.IsLowAutonomy(0.5) {
		t.Fatal("expected IsLowAutonomy=false for exactly 60 minutes")
	}
}

func TestIsLowAutonomy_ReturnsFalseWhenMoreThan60Minutes(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 100.0}
	if reading.IsLowAutonomy(0.5) {
		t.Fatal("expected IsLowAutonomy=false for 200 minutes autonomy")
	}
}

func TestIsLowAutonomy_ZeroFuelIsAlwaysLow(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 0.0}
	if !reading.IsLowAutonomy(0.5) {
		t.Fatal("expected IsLowAutonomy=true for zero fuel")
	}
}

func TestFuelAutonomyEstimate_HighFuelHighConsumption(t *testing.T) {
	reading := domain.SensorReading{FuelLevel: 6.0}
	autonomy := reading.FuelAutonomyEstimate(0.1)
	expected := domain.FuelAutonomyMinutes(60.0)
	if autonomy != expected {
		t.Fatalf("expected %f, got %f", expected, autonomy)
	}
}
