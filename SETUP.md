# SETUP.md - Guía de Despliegue y Pruebas

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
pnpm install 

# Variables de entorno (Opcional, en caso de cambiar puertos)
# NEXT_PUBLIC_API_URL=http://localhost:8080
# NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Iniciar servidor de desarrollo
pnpm run dev
```
La interfaz estará disponible en `http://localhost:3000`. 
Entra con credenciales `admin` / `admin123` para ver alertas predictivas.

---

## 3. App Mobile (React Native / Expo)

La app móvil emula y sincroniza las mismas funcionalidades nativamente, con soporte offline via `AsyncStorage`.

```bash
cd mobile

# Instalar dependencias
pnpm install

# Correr la app localmente
pnpm start
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
pnpm run test
```
## 6. Pasos para Probar en Postman (Backend, Frontend y Mobile)
Para agregar manualmente más datos desde Postman, sigue este flujo paso a paso:

### Paso 1: Autenticación (Obtener Token JWT)
```
Método: POST
URL: http://localhost:8080/api/v1/auth/login
Headers: Content-Type: application/json
Body (raw / JSON):
json
{
  "username": "admin",
  "password": "admin123"
}
```
Respuesta: Copia el texto devuelto en la clave "token".
### Paso 2: Registrar un nuevo vehículo (Backend / Admin)
```
Método: POST
URL: http://localhost:8080/api/v1/vehicles
Headers:
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUÍ
Body (raw / JSON):
json
{
  "name": "Camión de Carga 05",
  "license_plate": "MNO-999",
  "owner_id": "flota-norte"
}
```
Respuesta: Recibirás un objeto JSON con el id generado para el vehículo (ej: 8a7b9c1d-...). Copia ese id.
### Paso 3: Ingerir datos de Telemetría/Sensores (Visualización en tiempo real)
```
Método: POST
URL: http://localhost:8080/api/v1/vehicles/ID_DEL_VEHICULO/sensor (Reemplaza ID_DEL_VEHICULO por el ID obtenido en el paso 2)
Headers:
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUÍ
Body (raw / JSON):
json
{
  "latitude": 4.6097,
  "longitude": -74.0817,
  "speed": 115.0,
  "fuel_level": 12.0,
  "temperature": 94.0
}
```

### Nota sobre el comportamiento en Web y Mobile:

* Al enviar la petición en Postman, el Backend procesará el dato y lo enviará vía WebSocket a los clientes conectados.
* Tanto en la Web (Next.js) como en la App Mobile (Expo), verás actualizarse la posición en el mapa, los gráficos y, al haber superado los 100 km/h o tener <15% de combustible, saltará una alerta predictiva en vivo.