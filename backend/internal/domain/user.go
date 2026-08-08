package domain

import "time"

type User struct {
	ID           string
	Username     string
	PasswordHash string
	Role         Role
	CreatedAt    time.Time
}

type Role string

const (
	RoleAdmin Role = "admin"
	RoleUser  Role = "user"
)

func (u User) IsAdmin() bool {
	return u.Role == RoleAdmin
}
