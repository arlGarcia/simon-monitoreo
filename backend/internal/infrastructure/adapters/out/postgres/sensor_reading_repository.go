package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

type SensorReadingPostgresRepository struct {
	db *sql.DB
}

func NewSensorReadingRepository(db *sql.DB) *SensorReadingPostgresRepository {
	return &SensorReadingPostgresRepository{db: db}
}

func (r *SensorReadingPostgresRepository) Save(ctx context.Context, reading domain.SensorReading) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO sensor_readings (id, vehicle_id, latitude, longitude, speed, fuel_level, temperature, recorded_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		reading.ID, reading.VehicleID, reading.Latitude, reading.Longitude,
		reading.Speed, reading.FuelLevel, reading.Temperature, reading.RecordedAt,
	)
	return err
}

func (r *SensorReadingPostgresRepository) FindLatestByVehicleID(ctx context.Context, vehicleID string) (*domain.SensorReading, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, vehicle_id, latitude, longitude, speed, fuel_level, temperature, recorded_at
		 FROM sensor_readings WHERE vehicle_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
		vehicleID,
	)
	return scanReading(row)
}

func (r *SensorReadingPostgresRepository) FindHistoricalByVehicleID(ctx context.Context, vehicleID string, limit int) ([]domain.SensorReading, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, vehicle_id, latitude, longitude, speed, fuel_level, temperature, recorded_at
		 FROM sensor_readings WHERE vehicle_id = $1 ORDER BY recorded_at DESC LIMIT $2`,
		vehicleID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var readings []domain.SensorReading
	for rows.Next() {
		var sr domain.SensorReading
		var recordedAt time.Time
		if err := rows.Scan(&sr.ID, &sr.VehicleID, &sr.Latitude, &sr.Longitude, &sr.Speed, &sr.FuelLevel, &sr.Temperature, &recordedAt); err != nil {
			return nil, err
		}
		sr.RecordedAt = recordedAt
		readings = append(readings, sr)
	}
	return readings, rows.Err()
}

type sensorRowScanner interface {
	Scan(dest ...any) error
}

func scanReading(row sensorRowScanner) (*domain.SensorReading, error) {
	var sr domain.SensorReading
	var recordedAt time.Time
	err := row.Scan(&sr.ID, &sr.VehicleID, &sr.Latitude, &sr.Longitude, &sr.Speed, &sr.FuelLevel, &sr.Temperature, &recordedAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrVehicleNotFound
	}
	if err != nil {
		return nil, err
	}
	sr.RecordedAt = recordedAt
	return &sr, nil
}
