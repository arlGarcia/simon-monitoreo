package web

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/argar/sistema_monitoreo/internal/domain"
)

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func extractBearerToken(r *http.Request) (string, bool) {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return "", false
	}
	return strings.TrimPrefix(header, "Bearer "), true
}

func domainErrorToHTTPStatus(err error) int {
	switch err {
	case domain.ErrInvalidCredentials, domain.ErrInvalidToken, domain.ErrUnauthorized:
		return http.StatusUnauthorized
	case domain.ErrUserNotFound, domain.ErrVehicleNotFound:
		return http.StatusNotFound
	case domain.ErrInvalidSensorData:
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}

func maskVehicleID(displayID string) string {
	parts := strings.Split(displayID, "-")
	if len(parts) != 3 {
		return "DEV-****-" + displayID[len(displayID)-4:]
	}
	return parts[0] + "-****-" + parts[2]
}

func applyVehicleMasking(vehicles []domain.Vehicle, claims *application.ClaimsContext) []domain.Vehicle {
	if claims != nil && claims.Role == string(domain.RoleAdmin) {
		return vehicles
	}
	masked := make([]domain.Vehicle, len(vehicles))
	for i, v := range vehicles {
		v.DisplayID = maskVehicleID(v.DisplayID)
		masked[i] = v
	}
	return masked
}
