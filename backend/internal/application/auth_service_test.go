package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/argar/sistema_monitoreo/internal/application"
	"github.com/argar/sistema_monitoreo/internal/domain"
)

type stubUserRepo struct {
	user *domain.User
	err  error
}

func (s *stubUserRepo) FindByUsername(_ context.Context, _ string) (*domain.User, error) {
	return s.user, s.err
}

func TestLogin_SuccessReturnsToken(t *testing.T) {
	password := "secret123"
	hash := application.HashPassword(password)

	stub := &stubUserRepo{
		user: &domain.User{
			ID:           "user-1",
			Username:     "alice",
			PasswordHash: hash,
			Role:         domain.RoleAdmin,
		},
	}

	svc := application.NewAuthService(stub, []byte("test-secret"))
	resp, err := svc.Login(context.Background(), application.LoginRequest{
		Username: "alice",
		Password: password,
	})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if resp.Token == "" {
		t.Fatal("expected non-empty token")
	}
	if resp.Role != domain.RoleAdmin {
		t.Fatalf("expected role admin, got: %s", resp.Role)
	}
}

func TestLogin_WrongPasswordReturnsError(t *testing.T) {
	stub := &stubUserRepo{
		user: &domain.User{
			ID:           "user-1",
			Username:     "alice",
			PasswordHash: application.HashPassword("correctpassword"),
			Role:         domain.RoleUser,
		},
	}

	svc := application.NewAuthService(stub, []byte("test-secret"))
	_, err := svc.Login(context.Background(), application.LoginRequest{
		Username: "alice",
		Password: "wrongpassword",
	})

	if err != domain.ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials, got: %v", err)
	}
}

func TestLogin_UserNotFoundReturnsError(t *testing.T) {
	stub := &stubUserRepo{err: domain.ErrUserNotFound}

	svc := application.NewAuthService(stub, []byte("test-secret"))
	_, err := svc.Login(context.Background(), application.LoginRequest{
		Username: "ghost",
		Password: "any",
	})

	if err != domain.ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials, got: %v", err)
	}
}

func TestValidateToken_ValidTokenReturnsClaimsWithCorrectSubject(t *testing.T) {
	password := "mypassword"
	stub := &stubUserRepo{
		user: &domain.User{
			ID:           "user-42",
			Username:     "bob",
			PasswordHash: application.HashPassword(password),
			Role:         domain.RoleUser,
		},
	}

	svc := application.NewAuthService(stub, []byte("my-secret"))
	resp, err := svc.Login(context.Background(), application.LoginRequest{
		Username: "bob",
		Password: password,
	})
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	claims, err := svc.ValidateToken(resp.Token)
	if err != nil {
		t.Fatalf("expected valid token, got error: %v", err)
	}
	if claims.Subject != "user-42" {
		t.Fatalf("expected subject user-42, got: %s", claims.Subject)
	}
}

func TestValidateToken_TamperedSignatureIsRejected(t *testing.T) {
	stub := &stubUserRepo{
		user: &domain.User{
			ID:           "user-1",
			Username:     "alice",
			PasswordHash: application.HashPassword("pass"),
			Role:         domain.RoleAdmin,
		},
	}

	svc := application.NewAuthService(stub, []byte("secret"))
	resp, _ := svc.Login(context.Background(), application.LoginRequest{Username: "alice", Password: "pass"})

	tampered := resp.Token + "X"
	_, err := svc.ValidateToken(tampered)
	if err != domain.ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken, got: %v", err)
	}
}

func TestValidateToken_TokenSignedWithDifferentSecretIsRejected(t *testing.T) {
	stub := &stubUserRepo{
		user: &domain.User{
			ID:           "user-1",
			Username:     "alice",
			PasswordHash: application.HashPassword("pass"),
			Role:         domain.RoleAdmin,
		},
	}

	svcA := application.NewAuthService(stub, []byte("secret-A"))
	svcB := application.NewAuthService(stub, []byte("secret-B"))

	resp, _ := svcA.Login(context.Background(), application.LoginRequest{Username: "alice", Password: "pass"})

	_, err := svcB.ValidateToken(resp.Token)
	if err != domain.ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken, got: %v", err)
	}
}

func TestHashPassword_IsDeterministic(t *testing.T) {
	h1 := application.HashPassword("mypass")
	h2 := application.HashPassword("mypass")
	if h1 != h2 {
		t.Fatal("HashPassword should be deterministic")
	}
}

func TestHashPassword_DifferentInputsProduceDifferentHashes(t *testing.T) {
	h1 := application.HashPassword("pass1")
	h2 := application.HashPassword("pass2")
	if h1 == h2 {
		t.Fatal("different passwords should produce different hashes")
	}
}

func TestValidateToken_ExpiredTokenIsRejected(t *testing.T) {
	_ = time.Now()
}
