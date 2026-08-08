# DESIGN.md — Arquitectura y Trade-offs Globales

## Resumen del Ecosistema

El sistema es una solución distribuida para el monitoreo de flotas IoT. Combina ingesta masiva de sensores, algoritmos predictivos reactivos (combustible y alertas), streaming bidireccional (WebSockets) e interfaces adaptativas con capacidades offline.

| Capa | Rol | Stack | Racional de la Tecnología |
|---|---|---|---|
| **Backend** | Ingesta IoT, WS, API, Modelo Hexagonal | Go 1.22, PostgreSQL 16 | Altísimo rendimiento en ruteo y conexiones persistentes WS. Go gestiona las goroutines concurrentes nativamente con huella mínima de memoria. |
| **Frontend** | Dashboard web administrativo | Next.js 14, React 18 | Framework de alta performance, fácil encapsulamiento, ecosistema unificado para diseño UI moderno (Glassmorphism, dark mode nativo). |
| **Mobile** | Monitorización reactiva nativa | React Native, Expo | Permite compartir la misma lógica mental del pipeline frontend y simplificar la gestión de Push Notificaciones nativas a través de Expo Services. |

---

## Decisiones Técnicas Core y Trade-Offs

### 1. Backend: Implementación Estrícta de JWT Manual
- **Decisión:** En `auth_service.go`, se programó el JWT usando la base estándar criptográfica (`crypto/hmac`, `crypto/sha256`), sin reposar en importaciones frágiles como `golang-jwt`.
- **Ventaja:** Cero dependencias externas. Auditable línea por línea, evitando bugs upstream.
- **Trade-off:** La suite actual no verifica reclamaciones avanzadas (`aud`, `iss`) ni gestiona `RSA`. Se centró en `HS256` puro. Es robusto pero más limitado en federación.

### 2. Privacidad de Dispositivos (Role-based Masking)
- **Decisión:** Los UUID reales de los vehículos nunca se exponen al front. Si no eres admin, el backend intercepta el envío y cambia el `DisplayID` a algo como `DEV-****-XXXX`.
- **Ventaja:** Cumplimiento inmediato de privacidad (Pryvacy by Design). El frontend ni siquiera recibe el dato oculto.
- **Trade-off:** Requiere clonar o transformar arrays de datos on-the-fly en los middleware HTTP.

### 3. Modelo Predictivo de Combustible Evaluado en el Dominio
- **Decisión:** El cálculo de la autonomía `< 60 minutos` vive estrictamente en la entidad `Vehicle / SensorReading` en Golang.
- **Ventaja:** Completamente testeable con Unit Tests determinísticos (véase `vehicle_test.go`).
- **Trade-off:** La tasa de consumo (actualmente fijada en `0.5 l/min`) no infiere regresión lineal a partir de velocidades históricas (por diseño para mantener simplicidad y cumplir la consigna). Esto podría volverse un microservicio predictor en una fase real.

### 4. Modo Offline Nativo (Local First)
- **Decisión Frontend:** Se utilizó `idb` para persistir los últimos vehículos y lecturas en base IndexedDB cuando se pierde internet.
- **Decisión Mobile:** Se utilizó `@react-native-async-storage/async-storage` para resolver el mismo patrón offline de forma cruda.
- **Ventaja:** La aplicación nunca "rompe" al perder conectividad. Falla graciosa y notifica en pantalla.

### 5. WebSockets Centralizados y Livianos
- **Decisión:** Se usó un `WebSocketHub` con mutex nativo `sync.RWMutex` para despachar lectura por broadcast genérico.
- **Trade-off:** Aunque soporta miles de conexiones rápidas por ser Golang, no incluye un subsistema de canales/topics pub-sub dedicado (Redis/Kafka) como en arquitecturas enterprise masivas. Para propósitos de este tamaño, el broadcast local en memoria ahorra muchísima complejidad de infraestructura.
