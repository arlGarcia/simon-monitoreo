package web

import (
	"encoding/json"
	"net/http"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/argar/sistema_monitoreo/internal/domain"
)

type authHandler struct {
	authService *application.AuthService
}

func NewAuthHandler(authService *application.AuthService) *authHandler {
	return &authHandler{authService: authService}
}

func (h *authHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.authService.Login(r.Context(), application.LoginRequest{
		Username: body.Username,
		Password: body.Password,
	})
	if err == domain.ErrInvalidCredentials {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"token": resp.Token,
		"role":  resp.Role,
	})
}
