# SETUP.md — Guía de Despliegue Completo

## Prerrequisitos Globales
| Entorno | Requerimiento |
|---|---|
| Backend | Go 1.22+ |
| Base de Datos | Docker & Docker Compose |
| Frontend | Node.js 20.x+ |
| Mobile | Node.js 20.x+, Expo CLI, Android Studio / Xcode |

---

## 1. Backend + PostgreSQL (Docker)

La forma más rápida de levantar la infraestructura base es con Docker.

```bash
# Desde la raíz del repositorio
docker-compose up --build -d
```
- La base de datos (PostgreSQL 16) estará en `localhost:5432`
- La API (Go) estará expuesta en `http://localhost:8080`
- El usuario admin base se crea automáticamente (`admin` / `admin123`)

---

## 2. Frontend Web (Next.js)

El frontend contiene un dashboard predictivo con soporte offline incorporado usando IndexedDB.

```bash
cd frontend

# Instalar dependencias
npm install 

# Variables de entorno (Opcional, en caso de cambiar puertos)
# NEXT_PUBLIC_API_URL=http://localhost:8080
# NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Iniciar servidor de desarrollo
npm run dev
```
La interfaz estará disponible en `http://localhost:3000`. 
Entra con credenciales `admin` / `admin123` para ver alertas predictivas.

---

## 3. App Mobile (React Native / Expo)

La app móvil emula y sincroniza las mismas funcionalidades nativamente, con soporte offline via `AsyncStorage`.

```bash
cd mobile

# Instalar dependencias
npm install

# Correr la app localmente
npm start
```
Se abrirá Expo Metro Bundler. Puedes presionar:
- `a` para abrir en emulador de Android.
- `i` para abrir en simulador iOS.
- O escanear el código QR con la app **Expo Go** en un dispositivo físico.

---

## 4. Pruebas Unitarias y Cobertura (Backend)

Los tests se enfocan en la lógica predictiva de dominios estrictos y la implementación nativa del JWT en Golang.

```bash
cd backend
go test ./... -v
```

Para reporte visual de cobertura:
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 5. Pruebas Frontend (Jest)

```bash
cd frontend
npm run test
```
