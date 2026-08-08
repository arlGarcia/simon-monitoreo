package ports

import "github.com/argar/sistema_monitoreo/internal/domain"

type EventBroadcaster interface {
	BroadcastSensorReading(vehicleID string, reading domain.SensorReading)
	BroadcastAlert(alert domain.Alert)
}
