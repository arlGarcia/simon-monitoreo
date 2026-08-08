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

### 3.1. Configuración de Variables de Entorno para Expo Go
Si deseas probar la app desde un **celular físico** usando la aplicación **Expo Go**, debes configurar tu dirección IP de red local para que el celular pueda comunicarse con el backend en Go de tu computadora:

1. Obtén la IP local de tu PC en la red Wi-Fi:
   - **Windows**: Ejecuta `ipconfig` en la consola y copia la `Dirección IPv4` (Ejemplo: `192.168.1.7`).
   - **Mac/Linux**: Ejecuta `ifconfig` o `ip a`.
2. En la carpeta `mobile`, crea o edita el archivo `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://<TU_IP_LOCAL>:8080
   EXPO_PUBLIC_WS_URL=ws://<TU_IP_LOCAL>:8080
   ```
   *(Ejemplo: `EXPO_PUBLIC_API_URL=http://192.168.1.7:8080`)*

### 3.2. Ejecución de la App Móvil
```bash
cd mobile

# Instalar dependencias
pnpm install

# Correr la app limpiando caché
npx expo start -c
```
Se abrirá Expo Metro Bundler y mostrará un código QR en la consola:
- Asegúrate de que **tu celular y tu computadora estén en la misma red Wi-Fi**.
- Abre la app **Expo Go** en tu dispositivo Android o la app Cámara en iOS.
- Escanea el código QR mostrado en la terminal.
- Inicia sesión con `admin` / `admin123`.

*Nota: También puedes presionar `a` para abrir en emulador de Android Studio o `i` para simulador de iOS.*

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
