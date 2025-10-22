# 🚀 Sistema de Despliegue WAR - INEGI

Sistema completo de gestión y despliegue de archivos WAR con comunicación en tiempo real entre usuarios y administradores.

## 📋 Características Principales

### 👤 **Dashboard de Usuario**

- ✅ **Subida de archivos WAR** con validación (máx. 100MB)
- ✅ **Formulario completo** con campos obligatorios y opcionales
- ✅ **Seguimiento de solicitudes** con estadísticas en tiempo real
- ✅ **Notificaciones push** via Socket.IO
- ✅ **Interfaz moderna** con modo oscuro/claro
- ✅ **Estados visuales** con iconos y colores

### 🔧 **Dashboard de Administrador**

- ✅ **Vista de todas las solicitudes** con filtros por estado
- ✅ **Proceso de revisión completo** (pendiente → revisión → aprobado/rechazado)
- ✅ **Gestión de despliegues** con simulación de proceso
- ✅ **Monitoreo en tiempo real** con Socket.IO
- ✅ **Descarga de archivos WAR** para revisión
- ✅ **Panel de estadísticas** y actividad del sistema

### 🔄 **Flujo de Trabajo Completo**

1. **Usuario sube WAR** → Sistema valida y almacena
2. **Admin recibe notificación** → Inicia proceso de revisión
3. **Admin revisa contenido** → Aprueba o rechaza con comentarios
4. **Usuario recibe actualización** → Ve estado en tiempo real
5. **Admin despliega** → Inicia proceso en servidor objetivo
6. **Sistema notifica resultado** → Actualización automática de estado

## 🛠️ **Tecnologías Utilizadas**

### Backend

- **Node.js** + **Express.js** - Servidor API REST
- **Socket.IO** - Comunicación en tiempo real
- **Sequelize ORM** - Manejo de base de datos
- **SQLite** - Base de datos (desarrollo)
- **Multer** - Manejo de archivos
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas

### Frontend

- **React** + **Vite** - Interfaz de usuario
- **Socket.IO Client** - Comunicación en tiempo real
- **Tailwind CSS** - Diseño y estilos
- **Heroicons** - Iconografía
- **SweetAlert2** - Notificaciones y modales

## 🚦 **Cómo Ejecutar el Sistema**

### Prerrequisitos

- Node.js v18 o superior
- npm o yarn

### Instalación y Ejecución

1. **Clonar el repositorio**

   ```bash
   git clone <repository-url>
   cd newProject
   ```

2. **Instalar dependencias**

   ```bash
   # Dependencias del proyecto principal
   npm install

   # Dependencias del backend
   cd backend && npm install && cd ..

   # Dependencias del frontend
   cd frontend && npm install && cd ..
   ```

3. **Configurar base de datos**

   ```bash
   cd backend
   node seed-database.js
   cd ..
   ```

4. **Ejecutar el sistema completo**

   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación**
   - **Frontend**: http://localhost:5173/
   - **Backend API**: http://localhost:3002/api

## 👥 **Usuarios de Prueba**

### Usuario Regular

- **Usuario**: `usuario1`
- **Contraseña**: `password123`
- **Rol**: Usuario (puede subir archivos WAR)

### Administrador

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador (puede revisar y desplegar)

## 📁 **Estructura del Proyecto**

```
newProject/
├── backend/                    # Servidor Node.js
│   ├── config/                # Configuración de BD
│   ├── controllers/           # Controladores de API
│   ├── middleware/            # Middlewares de autenticación
│   ├── models/               # Modelos de Sequelize
│   ├── routes/               # Rutas de API
│   ├── services/             # Servicios de negocio
│   ├── uploads/wars/         # Archivos WAR subidos
│   ├── server.js            # Servidor principal
│   └── seed-database.js     # Poblado de datos de prueba
│
├── frontend/                  # Cliente React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   ├── admin/       # Dashboard de administrador
│   │   │   └── icons/       # Iconos personalizados
│   │   ├── services/        # Servicios de API y Socket.IO
│   │   └── App.jsx          # Componente principal
│   └── public/              # Archivos estáticos
│
└── package.json              # Scripts principales
```

## 🔌 **API Endpoints**

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/validate` - Validar token

### Despliegues

- `POST /api/deployment/upload` - Subir archivo WAR
- `GET /api/deployment/requests` - Listar todas las solicitudes
- `GET /api/deployment/my-requests` - Mis solicitudes
- `PUT /api/deployment/review/:id` - Revisar solicitud
- `POST /api/deployment/deploy/:id` - Iniciar despliegue
- `GET /api/deployment/download/:id` - Descargar archivo WAR

## 🔄 **Estados de Solicitud**

| Estado      | Descripción                          | Acción Siguiente                  |
| ----------- | ------------------------------------ | --------------------------------- |
| `pending`   | Solicitud creada, esperando revisión | Admin puede iniciar revisión      |
| `reviewing` | En proceso de revisión por admin     | Admin puede aprobar/rechazar      |
| `approved`  | Aprobada para despliegue             | Admin puede iniciar despliegue    |
| `rejected`  | Rechazada por admin                  | Usuario ve comentarios            |
| `deploying` | Proceso de despliegue en curso       | Sistema actualiza automáticamente |
| `deployed`  | Desplegada exitosamente              | Proceso completado                |
| `failed`    | Error en el despliegue               | Admin puede reintentar            |

## 🔔 **Eventos de Socket.IO**

### Eventos del Cliente → Servidor

- `join_room` - Unirse a sala por rol

### Eventos del Servidor → Cliente

- `new_deployment_request` - Nueva solicitud creada
- `request_status_update` - Actualización de estado
- `connection_stats` - Estadísticas de conexión

## 🎨 **Características de UI/UX**

- **Modo Oscuro/Claro** - Toggle completo con persistencia
- **Responsive Design** - Adaptable a dispositivos móviles
- **Notificaciones en Tiempo Real** - Usando SweetAlert2
- **Iconografía Consistente** - Heroicons + iconos personalizados
- **Estados Visuales** - Colores y iconos para cada estado
- **Carga Progresiva** - Indicadores de carga y progreso

## 🔒 **Seguridad**

- **Autenticación JWT** - Tokens seguros con expiración
- **Validación de Archivos** - Solo archivos .war hasta 100MB
- **Sanitización de Datos** - Validación en frontend y backend
- **Control de Acceso** - Separación de roles usuario/admin
- **Logs de Actividad** - Registro completo de acciones

## 🚀 **Despliegue en Producción**

### Variables de Entorno Recomendadas

```bash
# Backend
NODE_ENV=production
PORT=3002
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://user:password@host:port/database

# Frontend
VITE_API_URL=https://your-api-domain.com/api
```

### Consideraciones de Producción

1. Cambiar a PostgreSQL para la base de datos
2. Configurar almacenamiento en nube para archivos WAR
3. Implementar HTTPS en ambos extremos
4. Configurar logs centralizados
5. Implementar monitoreo y alertas

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 **Licencia**

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

---

**Desarrollado con ❤️ para INEGI**
