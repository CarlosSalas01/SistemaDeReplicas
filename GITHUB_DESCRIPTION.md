# 🏗️ Sistema de Gestión de Réplicas INEGI

## 📋 Descripción

Sistema completo de gestión y despliegue de archivos WAR (Web Application Archive) desarrollado para INEGI. Permite a los usuarios subir aplicaciones Java para revisión administrativa y posterior despliegue en servidores de destino, con un flujo completo de aprobación y notificaciones en tiempo real.

## ✨ Características Principales

### 🔐 **Autenticación y Seguridad**

- Sistema de autenticación JWT con roles diferenciados (Admin/Usuario)
- Middleware de seguridad con Helmet y rate limiting
- Validación de datos y protección CORS

### 👥 **Gestión de Usuarios**

- **Usuarios**: Pueden subir archivos WAR, ver historial de solicitudes y recibir notificaciones
- **Administradores**: Pueden revisar, aprobar/rechazar solicitudes y gestionar despliegues

### 📤 **Gestión de Archivos WAR**

- Subida segura de archivos WAR con validación
- Metadatos configurables (servidor destino, aplicación, descripción, prioridad)
- Almacenamiento organizado con nombres únicos

### 🔄 **Flujo de Trabajo**

1. **Usuario sube WAR** → Sistema valida y almacena
2. **Admin recibe notificación** → Inicia proceso de revisión
3. **Admin revisa contenido** → Aprueba o rechaza con comentarios
4. **Notificación al usuario** → Recibe actualización en tiempo real
5. **Admin despliega** → Inicia proceso en servidor objetivo

### 📊 **Dashboards Interactivos**

- **Dashboard Usuario**: Subida de archivos, historial de solicitudes, estadísticas personales
- **Dashboard Admin**: Gestión de todas las solicitudes, estadísticas globales, controles de despliegue

### 🔔 **Notificaciones en Tiempo Real**

- Socket.IO para comunicación bidireccional
- Actualizaciones automáticas de estado en ambos dashboards
- Notificaciones visuales con SweetAlert2

### 🎨 **Interfaz Moderna**

- React 19 con componentes reutilizables
- Diseño responsive con Tailwind CSS
- Tema claro/oscuro automático
- Iconos personalizados con Heroicons

## 🛠️ **Stack Tecnológico**

### Frontend

- **React 19** - Framework UI moderno
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Framework CSS utility-first
- **Socket.IO Client** - Comunicación en tiempo real
- **SweetAlert2** - Modales y notificaciones elegantes

### Backend

- **Node.js + Express.js** - API RESTful
- **Sequelize ORM** - Gestión de base de datos
- **SQLite** - Base de datos embebida (desarrollo)
- **Socket.IO** - Servidor de notificaciones en tiempo real
- **JWT** - Autenticación stateless
- **Multer** - Manejo de archivos
- **bcrypt** - Hash de contraseñas

### DevOps & Herramientas

- **Concurrently** - Ejecución simultánea frontend/backend
- **Nodemon** - Auto-reload en desarrollo
- **ESLint** - Linting de código
- **Dotenv** - Gestión de variables de entorno

## 🚀 **Instalación y Configuración**

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 8.0.0

### Instalación Rápida

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/sistema-replicas-inegi.git
cd sistema-replicas-inegi

# Instalar todas las dependencias
npm run install:all

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones

# Inicializar base de datos y datos de prueba
cd backend && npm run init-db

# Ejecutar en modo desarrollo (frontend + backend)
npm run dev
```

### URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **Socket.IO**: ws://localhost:3002

## 👤 **Credenciales de Prueba**

### Administrador

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador (puede revisar y desplegar)

### Usuario Estándar

- **Usuario**: `user`
- **Contraseña**: `user123`
- **Rol**: Usuario (puede subir archivos)

## 📁 **Estructura del Proyecto**

```
inegi-replicas-system/
├── 📦 package.json                 # Scripts centralizados y workspaces
├── 🎨 frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/             # Componentes React
│   │   │   ├── Login.jsx          # Componente de autenticación
│   │   │   ├── UserDashboard.jsx  # Dashboard usuario
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx # Dashboard administrador
│   │   │   └── icons/             # Iconos personalizados
│   │   ├── services/              # Servicios API
│   │   │   ├── apiService.js      # Cliente HTTP base
│   │   │   ├── deploymentService.js # Gestión de despliegues
│   │   │   ├── socketService.js   # Cliente Socket.IO
│   │   │   └── modalService.js    # Gestión de modales
│   │   └── assets/                # Recursos estáticos
│   └── public/                    # Assets públicos
├── ⚙️ backend/                     # API Express
│   ├── config/
│   │   └── database.js            # Configuración Sequelize
│   ├── models/                    # Modelos de datos
│   │   ├── User.js               # Modelo de usuario
│   │   ├── DeploymentRequest.js  # Modelo de solicitudes
│   │   └── ActivityLog.js        # Modelo de logs
│   ├── controllers/               # Lógica de negocio
│   │   ├── authController.js     # Autenticación
│   │   └── deploymentController.js # Gestión despliegues
│   ├── middleware/
│   │   └── auth.js               # Middleware JWT
│   ├── routes/                   # Rutas API
│   │   ├── auth.js              # Rutas autenticación
│   │   └── deployment.js        # Rutas despliegues
│   ├── services/                # Servicios de negocio
│   │   ├── notificationService.js # Notificaciones Socket.IO
│   │   └── activityLogService.js  # Logging de actividades
│   ├── uploads/                  # Archivos subidos
│   ├── database/                 # Base de datos SQLite
│   ├── server.js                # Servidor principal
│   └── .env                     # Variables de entorno
└── 📄 docs/                      # Documentación adicional
```

## 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev                    # Frontend + Backend simultáneamente
npm run dev:frontend          # Solo React (puerto 5173)
npm run dev:backend           # Solo Express (puerto 3002)

# Instalación
npm run install:all           # Instalar todas las dependencias

# Producción
npm run build                 # Build frontend para producción

# Base de datos
cd backend && npm run init-db # Inicializar BD y datos de prueba
```

## 🔒 **Seguridad**

- Autenticación JWT con expiración configurable
- Hash de contraseñas con bcrypt (salt rounds: 10)
- Validación de archivos en servidor
- Rate limiting para prevenir ataques
- Headers de seguridad con Helmet
- Validación de entrada con express-validator
- CORS configurado para dominios específicos

## 📈 **Características Avanzadas**

### Sistema de Estados

- `pending` → Solicitud creada, esperando revisión
- `reviewing` → En proceso de revisión por admin
- `approved` → Aprobada para despliegue
- `rejected` → Rechazada por admin
- `deploying` → En proceso de despliegue
- `deployed` → Desplegada exitosamente
- `failed` → Error en el despliegue

### Logging de Actividades

- Registro completo de todas las acciones
- Metadatos JSON para análisis detallado
- Tracking de IP y timestamps
- Asociación con usuarios y solicitudes

### Notificaciones Inteligentes

- Eventos diferenciados por tipo de usuario
- Actualización automática de UI
- Persistencia de estado entre sesiones
- Reconexión automática de Socket.IO

## 🤝 **Contribución**

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 **Licencia**

Este proyecto está bajo la Licencia ISC. Ver `LICENSE` para más detalles.

## 👨‍💻 **Autor**

**José Carlos Hernández Salas**

- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

---

⭐ **¡Dale una estrella si te parece útil!** ⭐
