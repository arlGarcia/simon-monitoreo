package web

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/gorilla/mux"
)

type vehicleHandler struct {
	vehicleService *application.VehicleService
	sensorService  *application.SensorService
}

func NewVehicleHandler(vehicleService *application.VehicleService, sensorService *application.SensorService) *vehicleHandler {
	return &vehicleHandler{
		vehicleService: vehicleService,
		sensorService:  sensorService,
	}
}

func (h *vehicleHandler) ListVehicles(w http.ResponseWriter, r *http.Request) {
	vehicles, err := h.vehicleService.ListVehicles(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list vehicles")
		return
	}

	claims := claimsFromContext(r.Context())
	masked := applyVehicleMasking(vehicles, claims)
	writeJSON(w, http.StatusOK, masked)
}

func (h *vehicleHandler) GetVehicle(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	vehicle, err := h.vehicleService.GetVehicle(r.Context(), id)
	if err != nil {
		status := domainErrorToHTTPStatus(err)
		writeError(w, status, err.Error())
		return
	}

	claims := claimsFromContext(r.Context())
	if claims == nil || claims.Role != "admin" {
		vehicle.DisplayID = maskVehicleID(vehicle.DisplayID)
	}

	writeJSON(w, http.StatusOK, vehicle)
}

func (h *vehicleHandler) RegisterVehicle(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name         string `json:"name"`
		LicensePlate string `json:"license_plate"`
		OwnerID      string `json:"owner_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	vehicle, err := h.vehicleService.RegisterVehicle(r.Context(), body.Name, body.LicensePlate, body.OwnerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to register vehicle")
		return
	}

	writeJSON(w, http.StatusCreated, vehicle)
}

func (h *vehicleHandler) GetAlerts(w http.ResponseWriter, r *http.Request) {
	vehicleID := mux.Vars(r)["id"]

	alerts, err := h.vehicleService.GetAlerts(r.Context(), vehicleID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get alerts")
		return
	}

	writeJSON(w, http.StatusOK, alerts)
}

func (h *vehicleHandler) GetHistoricalReadings(w http.ResponseWriter, r *http.Request) {
	vehicleID := mux.Vars(r)["id"]
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	readings, err := h.sensorService.GetHistoricalReadings(r.Context(), vehicleID, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get historical readings")
		return
	}

	writeJSON(w, http.StatusOK, readings)
}
