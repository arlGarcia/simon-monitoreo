package web

import (
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter(
	authHandler *authHandler,
	vehicleHandler *vehicleHandler,
	sensorHandler *sensorHandler,
	wsHub *WebSocketHub,
	authMiddleware func(http.Handler) http.Handler,
) *mux.Router {
	r := mux.NewRouter()

	r.Use(corsMiddleware)

	r.HandleFunc("/health", healthCheck).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/api/v1/auth/login", authHandler.Login).Methods(http.MethodPost, http.MethodOptions)
	r.HandleFunc("/ws", wsHub.ServeWS)

	protected := r.PathPrefix("/api/v1").Subrouter()
	protected.Use(authMiddleware)

	protected.HandleFunc("/vehicles", vehicleHandler.ListVehicles).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/vehicles/{id}", vehicleHandler.GetVehicle).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/vehicles/{id}/alerts", vehicleHandler.GetAlerts).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/vehicles/{id}/readings", vehicleHandler.GetHistoricalReadings).Methods(http.MethodGet, http.MethodOptions)

	admin := protected.PathPrefix("").Subrouter()
	admin.Use(AdminOnlyMiddleware)
	admin.HandleFunc("/vehicles", vehicleHandler.RegisterVehicle).Methods(http.MethodPost, http.MethodOptions)

	protected.HandleFunc("/vehicles/{vehicleId}/sensor", sensorHandler.IngestReading).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/vehicles/{vehicleId}/sensor/latest", sensorHandler.GetLatestReading).Methods(http.MethodGet, http.MethodOptions)

	return r
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
