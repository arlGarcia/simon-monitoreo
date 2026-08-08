package web

import (
	"encoding/json"
	"net/http"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/gorilla/mux"
)

type sensorHandler struct {
	sensorService *application.SensorService
}

func NewSensorHandler(sensorService *application.SensorService) *sensorHandler {
	return &sensorHandler{sensorService: sensorService}
}

func (h *sensorHandler) IngestReading(w http.ResponseWriter, r *http.Request) {
	vehicleID := mux.Vars(r)["vehicleId"]

	var body struct {
		Latitude    float64 `json:"latitude"`
		Longitude   float64 `json:"longitude"`
		Speed       float64 `json:"speed"`
		FuelLevel   float64 `json:"fuel_level"`
		Temperature float64 `json:"temperature"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err := h.sensorService.IngestReading(r.Context(), application.IngestSensorDataRequest{
		VehicleID:   vehicleID,
		Latitude:    body.Latitude,
		Longitude:   body.Longitude,
		Speed:       body.Speed,
		FuelLevel:   body.FuelLevel,
		Temperature: body.Temperature,
	})
	if err != nil {
		status := domainErrorToHTTPStatus(err)
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

func (h *sensorHandler) GetLatestReading(w http.ResponseWriter, r *http.Request) {
	vehicleID := mux.Vars(r)["vehicleId"]

	reading, err := h.sensorService.GetLatestReading(r.Context(), vehicleID)
	if err != nil {
		status := domainErrorToHTTPStatus(err)
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, reading)
}
