package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

type UserPostgresRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserPostgresRepository {
	return &UserPostgresRepository{db: db}
}

func (r *UserPostgresRepository) FindByUsername(ctx context.Context, username string) (*domain.User, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, username, password_hash, role, created_at FROM users WHERE username = $1`,
		username,
	)
	return scanUser(row)
}

func (r *UserPostgresRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, username, password_hash, role, created_at FROM users WHERE id = $1`,
		id,
	)
	return scanUser(row)
}

func (r *UserPostgresRepository) Save(ctx context.Context, user domain.User) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO users (id, username, password_hash, role, created_at)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (id) DO UPDATE SET username = $2, password_hash = $3, role = $4`,
		user.ID, user.Username, user.PasswordHash, string(user.Role), user.CreatedAt,
	)
	return err
}

func scanUser(row *sql.Row) (*domain.User, error) {
	var u domain.User
	var createdAt time.Time
	var role string
	err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &role, &createdAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Role = domain.Role(role)
	u.CreatedAt = createdAt
	return &u, nil
}
