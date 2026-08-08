package domain

import "errors"

var (
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrVehicleNotFound     = errors.New("vehicle not found")
	ErrInvalidToken        = errors.New("invalid or expired token")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrInvalidSensorData   = errors.New("invalid sensor data")
)
