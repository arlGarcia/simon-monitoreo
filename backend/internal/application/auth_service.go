package application

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"strings"
	"time"

	"github.com/argar/sistema_monitoreo/internal/domain"
)

type jwtHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
}

type jwtClaims struct {
	Subject   string `json:"sub"`
	Role      string `json:"role"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
}

type ClaimsFromToken struct {
	Subject string
	Role    string
}

type LoginRequest struct {
	Username string
	Password string
}

type LoginResponse struct {
	Token string
	Role  domain.Role
}

type AuthService struct {
	users     userFinder
	secretKey []byte
}

type userFinder interface {
	FindByUsername(ctx context.Context, username string) (*domain.User, error)
}

func NewAuthService(users userFinder, secretKey []byte) *AuthService {
	return &AuthService{users: users, secretKey: secretKey}
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (LoginResponse, error) {
	user, err := s.users.FindByUsername(ctx, req.Username)
	if err != nil {
		return LoginResponse{}, domain.ErrInvalidCredentials
	}

	if !verifyPassword(req.Password, user.PasswordHash) {
		return LoginResponse{}, domain.ErrInvalidCredentials
	}

	token, err := s.generateToken(user)
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{Token: token, Role: user.Role}, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*ClaimsFromToken, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, domain.ErrInvalidToken
	}

	if !s.signatureIsValid(parts[0], parts[1], parts[2]) {
		return nil, domain.ErrInvalidToken
	}

	claims, err := decodeClaims(parts[1])
	if err != nil {
		return nil, domain.ErrInvalidToken
	}

	if time.Now().Unix() > claims.ExpiresAt {
		return nil, domain.ErrInvalidToken
	}

	return &ClaimsFromToken{Subject: claims.Subject, Role: claims.Role}, nil
}

func (s *AuthService) generateToken(user *domain.User) (string, error) {
	header := jwtHeader{Algorithm: "HS256", Type: "JWT"}
	claims := jwtClaims{
		Subject:   user.ID,
		Role:      string(user.Role),
		IssuedAt:  time.Now().Unix(),
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}

	encodedHeader, err := encodeSegment(header)
	if err != nil {
		return "", err
	}

	encodedClaims, err := encodeSegment(claims)
	if err != nil {
		return "", err
	}

	signingInput := encodedHeader + "." + encodedClaims
	signature := s.sign(signingInput)

	return signingInput + "." + signature, nil
}

func (s *AuthService) sign(data string) string {
	mac := hmac.New(sha256.New, s.secretKey)
	mac.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *AuthService) signatureIsValid(header, claims, providedSig string) bool {
	expectedSig := s.sign(header + "." + claims)
	return hmac.Equal([]byte(expectedSig), []byte(providedSig))
}

func encodeSegment(v any) (string, error) {
	jsonBytes, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(jsonBytes), nil
}

func decodeClaims(encoded string) (*jwtClaims, error) {
	jsonBytes, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return nil, err
	}
	var claims jwtClaims
	if err := json.Unmarshal(jsonBytes, &claims); err != nil {
		return nil, err
	}
	return &claims, nil
}

func verifyPassword(plaintext, hash string) bool {
	mac := hmac.New(sha256.New, []byte("password-secret"))
	mac.Write([]byte(plaintext))
	computed := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(computed), []byte(hash))
}

func HashPassword(plaintext string) string {
	mac := hmac.New(sha256.New, []byte("password-secret"))
	mac.Write([]byte(plaintext))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return base64.RawURLEncoding.EncodeToString(bytes)
}
