const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Importar configuración de base de datos
const { sequelize, testConnection } = require("./config/database");

// Importar todos los modelos (esto ejecuta las asociaciones)
const models = require("./models");

// Importar servicios
const NotificationService = require("./services/notificationService");

// Importar rutas
const authRoutes = require("./routes/auth");
const deploymentRoutes = require("./routes/deployment");

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Inicializar servicio de notificaciones
const notificationService = new NotificationService(io);

// Middlewares de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.",
});
app.use(limiter);

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200, // Para soporte de navegadores legacy
};
app.use(cors(corsOptions));

// Middleware adicional para manejar preflight requests
app.options("*", cors(corsOptions));

// Parsear JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Configuración de Socket.IO
io.on("connection", (socket) => {
  console.log(`🔌 Usuario conectado: ${socket.id}`);

  // Manejar autenticación del socket
  socket.on("authenticate", (data) => {
    if (data.token && data.userRole) {
      socket.userRole = data.userRole;
      socket.userId = data.userId;
      socket.username = data.username;

      // Unir a room específico según el rol
      if (data.userRole === "admin") {
        socket.join("admins");
        console.log(`👑 Admin ${data.username} conectado`);

        // Enviar estadísticas iniciales al admin
        socket.emit("admin_stats", {
          connectedUsers: io.sockets.sockets.size,
          pendingRequests: 0, // Se actualizará con datos reales
        });
      } else {
        socket.join("users");
        console.log(`👤 Usuario ${data.username} conectado`);
      }
    }
  });

  // Manejar desconexión
  socket.on("disconnect", () => {
    console.log(`🔌 Usuario desconectado: ${socket.id}`);
  });

  // Evento de prueba
  socket.on("test_event", (data) => {
    console.log("📡 Evento de prueba recibido:", data);
    socket.emit("test_response", {
      message: "Conexión Socket.IO funcionando correctamente",
      timestamp: new Date().toISOString(),
    });
  });
});

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  console.log(`� PETICIÓN RECIBIDA: ${req.method} ${req.originalUrl}`);
  console.log(
    `� Authorization:`,
    req.headers.authorization ? "PRESENTE" : "AUSENTE"
  );
  next();
});

// Middleware para hacer el objeto io y notificationService disponibles en las rutas
app.use((req, res, next) => {
  req.io = io;
  req.notificationService = notificationService;
  next();
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/deployment", deploymentRoutes);

// Ruta especial para diagnosticar rutas registradas
app.get("/api/debug/routes", (req, res) => {
  const routes = [];

  // Función para extraer rutas de una aplicación Express
  function extractRoutes(layer, prefix = "") {
    if (layer.route) {
      // Es una ruta directa
      routes.push({
        path: prefix + layer.route.path,
        methods: Object.keys(layer.route.methods),
      });
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      // Es un router, extraer sus rutas
      const routerPrefix =
        prefix +
        (layer.regexp.toString().match(/^\/\^\\?(.+?)\\\?\$/) || [
          "",
          "",
        ])[1].replace(/\\\//g, "/");
      layer.handle.stack.forEach((subLayer) => {
        extractRoutes(subLayer, routerPrefix);
      });
    }
  }

  // Extraer todas las rutas de la app
  app._router.stack.forEach((layer) => {
    extractRoutes(layer);
  });

  res.json({
    message: "Rutas registradas en el servidor",
    routes: routes,
    total: routes.length,
  });
});

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: false }); // force: true recrea las tablas
    console.log("📊 Base de datos sincronizada");

    // Iniciar servidor
    server.listen(PORT, () => {
      console.log(
        `🚀 Servidor backend ejecutándose en http://localhost:${PORT}`
      );
      // Debug: Server restarted to pick up new debug routes v2
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
      console.log(`⚡ Socket.IO configurado para tiempo real`);
    });
  } catch (error) {
    console.error("❌ Error al inicializar el servidor:", error);
    process.exit(1);
  }
};

// Inicializar servidor
startServer();

module.exports = app;
