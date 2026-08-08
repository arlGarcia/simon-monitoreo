package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

type VehiclePostgresRepository struct {
	db *sql.DB
}

func NewVehicleRepository(db *sql.DB) *VehiclePostgresRepository {
	return &VehiclePostgresRepository{db: db}
}

func (r *VehiclePostgresRepository) FindAll(ctx context.Context) ([]domain.Vehicle, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, display_id, name, license_plate, owner_id, created_at FROM vehicles ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vehicles []domain.Vehicle
	for rows.Next() {
		v, err := scanVehicle(rows)
		if err != nil {
			return nil, err
		}
		vehicles = append(vehicles, v)
	}
	return vehicles, rows.Err()
}

func (r *VehiclePostgresRepository) FindByID(ctx context.Context, id string) (*domain.Vehicle, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, display_id, name, license_plate, owner_id, created_at FROM vehicles WHERE id = $1`,
		id,
	)
	var v domain.Vehicle
	var createdAt time.Time
	err := row.Scan(&v.ID, &v.DisplayID, &v.Name, &v.LicensePlate, &v.OwnerID, &createdAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrVehicleNotFound
	}
	if err != nil {
		return nil, err
	}
	v.CreatedAt = createdAt
	return &v, nil
}

func (r *VehiclePostgresRepository) Save(ctx context.Context, vehicle domain.Vehicle) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO vehicles (id, display_id, name, license_plate, owner_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (id) DO UPDATE SET name = $3, license_plate = $4`,
		vehicle.ID, vehicle.DisplayID, vehicle.Name, vehicle.LicensePlate, vehicle.OwnerID, vehicle.CreatedAt,
	)
	return err
}

type vehicleScanner interface {
	Scan(dest ...any) error
}

func scanVehicle(scanner vehicleScanner) (domain.Vehicle, error) {
	var v domain.Vehicle
	var createdAt time.Time
	err := scanner.Scan(&v.ID, &v.DisplayID, &v.Name, &v.LicensePlate, &v.OwnerID, &createdAt)
	if err != nil {
		return domain.Vehicle{}, err
	}
	v.CreatedAt = createdAt
	return v, nil
}
