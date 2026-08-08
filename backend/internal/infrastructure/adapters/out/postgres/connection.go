package postgres

import (
	"database/sql"
	"fmt"
)

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func Connect(cfg Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	return db, nil
}

func Migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id           TEXT PRIMARY KEY,
			username     TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role         TEXT NOT NULL DEFAULT 'user',
			created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS vehicles (
			id            TEXT PRIMARY KEY,
			display_id    TEXT UNIQUE NOT NULL,
			name          TEXT NOT NULL,
			license_plate TEXT NOT NULL,
			owner_id      TEXT NOT NULL,
			created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS sensor_readings (
			id          TEXT PRIMARY KEY,
			vehicle_id  TEXT NOT NULL REFERENCES vehicles(id),
			latitude    DOUBLE PRECISION NOT NULL,
			longitude   DOUBLE PRECISION NOT NULL,
			speed       DOUBLE PRECISION NOT NULL,
			fuel_level  DOUBLE PRECISION NOT NULL,
			temperature DOUBLE PRECISION NOT NULL,
			recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_sensor_readings_vehicle_recorded
			ON sensor_readings(vehicle_id, recorded_at DESC);

		CREATE TABLE IF NOT EXISTS alerts (
			id          TEXT PRIMARY KEY,
			vehicle_id  TEXT NOT NULL REFERENCES vehicles(id),
			type        TEXT NOT NULL,
			message     TEXT NOT NULL,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_alerts_vehicle ON alerts(vehicle_id);
	`)
	return err
}
