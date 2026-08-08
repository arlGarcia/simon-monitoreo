package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

type AlertPostgresRepository struct {
	db *sql.DB
}

func NewAlertRepository(db *sql.DB) *AlertPostgresRepository {
	return &AlertPostgresRepository{db: db}
}

func (r *AlertPostgresRepository) Save(ctx context.Context, alert domain.Alert) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO alerts (id, vehicle_id, type, message, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		alert.ID, alert.VehicleID, string(alert.Type), alert.Message, alert.CreatedAt,
	)
	return err
}

func (r *AlertPostgresRepository) FindByVehicleID(ctx context.Context, vehicleID string) ([]domain.Alert, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, vehicle_id, type, message, created_at FROM alerts
		 WHERE vehicle_id = $1 ORDER BY created_at DESC`,
		vehicleID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []domain.Alert
	for rows.Next() {
		var a domain.Alert
		var alertType string
		var createdAt time.Time
		if err := rows.Scan(&a.ID, &a.VehicleID, &alertType, &a.Message, &createdAt); err != nil {
			return nil, err
		}
		a.Type = domain.AlertType(alertType)
		a.CreatedAt = createdAt
		alerts = append(alerts, a)
	}
	return alerts, rows.Err()
}

func (r *AlertPostgresRepository) FindAllActive(ctx context.Context) ([]domain.Alert, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, vehicle_id, type, message, created_at FROM alerts ORDER BY created_at DESC LIMIT 100`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []domain.Alert
	for rows.Next() {
		var a domain.Alert
		var alertType string
		var createdAt time.Time
		if err := rows.Scan(&a.ID, &a.VehicleID, &alertType, &a.Message, &createdAt); err != nil {
			return nil, err
		}
		a.Type = domain.AlertType(alertType)
		a.CreatedAt = createdAt
		alerts = append(alerts, a)
	}
	return alerts, rows.Err()
}

type alertRowScanner interface {
	Scan(dest ...any) error
}

func scanAlert(scanner alertRowScanner) (domain.Alert, error) {
	var a domain.Alert
	var alertType string
	var createdAt time.Time
	err := scanner.Scan(&a.ID, &a.VehicleID, &alertType, &a.Message, &createdAt)
	if err != nil {
		return domain.Alert{}, err
	}
	a.Type = domain.AlertType(alertType)
	a.CreatedAt = createdAt
	return a, nil
}
