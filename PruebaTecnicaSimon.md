# Objetivo
Desarrollar un sistema de monitoreo IoT para flotas vehiculares con:
1. Backend: API para ingesta/procesamiento de datos.
2. Frontend Web: Dashboard interactivo.
3. Mobile: App para monitoreo en movimiento.

# Requisitos Técnicos
1. Backend (Lenguaje Golang)

    1.1. Implementar una API REST con:
    * Endpoint de autenticación JWT manual (sin librerías externas para validación).
    * Ingesta de datos de sensores (ubicación GPS, combustible, temperatura).
    * Cálculo predictivo de combustible: Alerta si el nivel baja a <1 hora de autonomía.

    1.2. Persistencia en base de datos (PostgreSQL/SQLite).

    1.3. WebSockets para actualizaciones en tiempo real.


2. Frontend Web (React/NextJS)

    2.1. Dashboard con:
    * Mapa interactivo (Google Maps/MapLibre) mostrando ubicaciones en vivo.
    * Gráficos históricos (velocidad/combustible).

    2.2. Sistema de alertas predictivas visible solo para admin.

    2.3. Funcionalidad offline usando caché (localStorage/IndexedDB).


3. Mobile (React Native)

    3.1. Réplica del dashboard web con:
    * Soporte para notificaciones push de alertas.
    * Sincronización offline.

4. Requisitos Generales

    4.1. Privacidad: Enmascarar IDs de dispositivos para usuarios no administradores (ej: DEV-****-XC54).

    4.2. Documentación:
    * DESIGN.md explicando elección de stack y trade-offs técnicos.
    * SETUP.md con guía de despliegue local.

    4.3. Testing: Unit tests para lógica crítica (ej: cálculo de combustible, autenticación).

# Entrega
1. Repositorio Público con:
    * Código fuente (backend + frontend + mobile si aplica).
    * Documentación (DESIGN.md, SETUP.md).
    * Tests automatizados.