# Sistema de Réplicas - Full Stack

##  **Nueva Estructura del Proyecto**

```
inegi-replicas-system/
├── 📄 README.md              # Documentación principal
├──  package.json           # Scripts centralizados
├──  DATABASE_SETUP.md      # Guía de configuración de BD
├──  frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── services/         # API cliente
│   │   └── assets/          # Recursos estáticos
│   ├── public/              # Assets públicos
│   ├── package.json         # Dependencias frontend
│   ├── vite.config.js       # Configuración Vite
│   ├── tailwind.config.js   # Configuración Tailwind
│   └── index.html           # Punto de entrada
├──  backend/               # API Express
│   ├── config/              # Configuración DB
│   ├── models/              # Modelos Sequelize
│   ├── controllers/         # Lógica de negocio
│   ├── middleware/          # Middleware JWT
│   ├── routes/              # Rutas API
│   ├── package.json         # Dependencias backend
│   ├── server.js            # Servidor con MySQL
│   ├── server-dev.js        # Servidor sin DB
│   └── .env                 # Variables de entorno
└──  docs/                 # Documentación adicional
```

##  **Comandos Disponibles**

### Desarrollo Completo (Frontend + Backend)

```bash
# Instalar todas las dependencias
npm run install:all

# Ejecutar frontend y backend simultáneamente
npm run dev


### Construcción y Despliegue

```bash
# Construir frontend para producción
npm run build

# Iniciar servidor de producción
npm start
```

### Mantenimiento

```bash
# Limpiar node_modules y builds
npm run clean

# Ejecutar linting
npm run lint
```

## 🔧 **Configuración Inicial**

### 1. Instalar Dependencias

```bash
cd inegi-replicas-system
npm run install:all
```

### 2. Configurar Backend

```bash
# Copiar variables de entorno
cd backend
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Ejecutar en Modo Desarrollo

```bash
# Opción A: Todo junto (requiere MySQL)
npm run dev

# Opción B: Solo desarrollo (sin MySQL)
npm run dev:backend-no-db
# En otra terminal:
npm run dev:frontend
```

##  **Credenciales de Prueba**

### Modo Desarrollo (sin base de datos):

- **Administrador**: `admin` / `admin123`
- **Usuario**: `usuario` / `user123`

## 📋 **Tecnologías Utilizadas**

### Frontend

-  **React 19** - Framework principal
-  **Vite** - Build tool y dev server
-  **Tailwind CSS** - Framework CSS
-  **Heroicons** - Iconografía
-  **SweetAlert2** - Modales y alertas

### Backend

-  **Node.js + Express** - Servidor API
-  **JWT** - Autenticación
-  **Sequelize + MySQL** - Base de datos
- **bcrypt** - Hash de contraseñas
- **Helmet + CORS** - Seguridad

