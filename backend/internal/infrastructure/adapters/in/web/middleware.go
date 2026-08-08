package web

import (
	"context"
	"net/http"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/argar/sistema_monitoreo/internal/domain"
)

type contextKey string

const claimsContextKey contextKey = "claims"

type tokenValidator interface {
	ValidateToken(tokenString string) (*application.ClaimsFromToken, error)
}

func AuthMiddleware(validator tokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodOptions {
				next.ServeHTTP(w, r)
				return
			}

			token, ok := extractBearerToken(r)
			if !ok {
				writeError(w, http.StatusUnauthorized, domain.ErrUnauthorized.Error())
				return
			}

			claims, err := validator.ValidateToken(token)
			if err != nil {
				writeError(w, http.StatusUnauthorized, domain.ErrInvalidToken.Error())
				return
			}

			ctx := context.WithValue(r.Context(), claimsContextKey, &application.ClaimsContext{
				UserID: claims.Subject,
				Role:   claims.Role,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AdminOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		claims := claimsFromContext(r.Context())
		if claims == nil || claims.Role != string(domain.RoleAdmin) {
			writeError(w, http.StatusForbidden, domain.ErrUnauthorized.Error())
			return
		}
		next.ServeHTTP(w, r)
	})
}

func claimsFromContext(ctx context.Context) *application.ClaimsContext {
	claims, _ := ctx.Value(claimsContextKey).(*application.ClaimsContext)
	return claims
}
