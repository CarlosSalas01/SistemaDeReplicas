const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// CORS debe ir ANTES que cualquier otro middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, etc.) en desarrollo
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Configurar Socket.IO con las mismas opciones de CORS
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Almacenar conexiones de usuarios
const connectedUsers = new Map();
const adminConnections = new Set();

// 📋 Array temporal para almacenar las solicitudes de despliegue (en producción usar BD)
let deploymentRequests = [];

// Configurar eventos de Socket.IO
io.on("connection", (socket) => {
  console.log(`✅ ¡NUEVA CONEXIÓN SOCKET.IO!`);
  console.log(`   - Socket ID: ${socket.id}`);
  console.log(`   - Transport: ${socket.conn.transport.name}`);
  console.log(`   - IP: ${socket.handshake.address}`);
  console.log(`   - Headers:`, socket.handshake.headers.origin);

  // Manejar autenticación
  socket.on("authenticate", (data) => {
    console.log("🔐 Usuario autenticándose:", data);

    socket.userId = data.userId;
    socket.username = data.username;
    socket.userRole = data.userRole;

    // Almacenar conexión por rol
    connectedUsers.set(socket.id, {
      userId: data.userId,
      username: data.username,
      role: data.userRole,
      socketId: socket.id,
    });

    if (data.userRole === "admin") {
      adminConnections.add(socket.id);
      console.log(
        `👑 Administrador conectado: ${data.username} - Total admins: ${adminConnections.size}`
      );
    } else {
      console.log(
        `👤 Usuario conectado: ${data.username} - Rol: ${data.userRole}`
      );
    }

    console.log(
      `📊 Usuarios conectados: ${connectedUsers.size}, Admins: ${adminConnections.size}`
    );
    socket.emit("authenticated", { status: "success" });
  });

  // Manejar nuevas solicitudes de despliegue
  socket.on("new_deployment_request", (data) => {
    console.log("📦 Nueva solicitud de despliegue:", data);

    // Enviar notificación a todos los administradores conectados
    adminConnections.forEach((adminSocketId) => {
      io.to(adminSocketId).emit("new_deployment_request", data);
    });

    console.log(
      `📢 Notificación enviada a ${adminConnections.size} administradores`
    );
  });

  // Evento de prueba
  socket.on("test_event", (data) => {
    console.log("🧪 Evento de prueba recibido:", data);
    socket.emit("test_response", {
      message: "Prueba exitosa desde el servidor",
      receivedData: data,
      timestamp: new Date().toISOString(),
    });
  });

  // Manejar desconexión
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Usuario desconectado: ${socket.id} - Razón: ${reason}`);

    // Remover de las colecciones
    connectedUsers.delete(socket.id);
    adminConnections.delete(socket.id);
  });
});

// Middleware adicional para manejar preflight requests
app.options("*", cors(corsOptions));

// Middlewares de seguridad - configurado para no interferir con CORS
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting - más permisivo para desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana de tiempo (más permisivo)
  message: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${
      req.path
    } - Origin: ${req.get("origin")}`
  );
  next();
});

// Parsear JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Crear directorio uploads si no existe
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB límite
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos WAR
    if (
      file.mimetype === "application/java-archive" ||
      file.originalname.toLowerCase().endsWith(".war")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos WAR"), false);
    }
  },
});

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando correctamente (sin base de datos)",
    timestamp: new Date().toISOString(),
  });
});

// Simulación temporal de rutas de autenticación (sin base de datos)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  // Usuarios temporales para pruebas
  const users = [
    {
      username: "admin",
      password: "admin123",
      role: "admin",
      email: "admin@inegi.com",
    },
    {
      username: "user",
      password: "user123",
      role: "user",
      email: "user@inegi.com",
    },
  ];

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.json({
      message: "Login exitoso",
      user: {
        id: 1,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token: "token_temporal_para_pruebas",
    });
  } else {
    res.status(401).json({ error: "Credenciales inválidas" });
  }
});

// Ruta temporal para validar token
app.get("/api/auth/validate-token", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token === "token_temporal_para_pruebas") {
    res.json({
      message: "Token válido",
      user: {
        id: 1,
        username: "admin",
        email: "admin@inegi.com",
        role: "admin",
      },
    });
  } else {
    res.status(401).json({ error: "Token inválido" });
  }
});

// Ruta para subir archivos WAR
app.post("/api/deployment/upload", upload.single("warFile"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó ningún archivo",
      });
    }

    const {
      targetServer,
      applicationName,
      priority,
      description,
      environment,
    } = req.body;

    // Simulamos guardar la información en base de datos
    const newRequest = {
      id: Date.now(),
      title: applicationName || req.file.originalname.replace(".war", ""),
      applicationName:
        applicationName || req.file.originalname.replace(".war", ""),
      description: description || "",
      filename: req.file.originalname,
      warFileName: req.file.originalname,
      warFile: req.file.originalname,
      filepath: req.file.path,
      size: req.file.size,
      warFileSize: req.file.size,
      targetServer: targetServer || "Servidor de Desarrollo 1",
      priority: priority || "medium",
      environment: environment || "development",
      status: "pending",
      createdAt: new Date().toISOString(),
      requestDate: new Date().toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      User: {
        username: "usuario", // En producción, obtener del token JWT
      },
    };

    // 💾 Guardar la solicitud en el array temporal
    deploymentRequests.push(newRequest);
    console.log(
      "📋 Solicitud guardada. Total solicitudes:",
      deploymentRequests.length
    );

    console.log("Archivo subido:", newRequest);

    // Emitir evento Socket.IO a los administradores
    const notificationData = {
      message: `Nueva solicitud de despliegue de ${newRequest.User.username}`,
      data: {
        id: newRequest.id,
        userId: 1, // En producción obtener del JWT
        username: newRequest.User.username,
        warFileName: newRequest.filename,
        warFileSize: newRequest.size,
        targetServer: newRequest.targetServer,
        applicationName: newRequest.title,
        description: newRequest.description || "Sin descripción",
        priority: newRequest.priority,
        environment: newRequest.environment,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
        requestDate: new Date().toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      type: "new_request",
      timestamp: new Date().toISOString(),
    };

    // Enviar notificación a todos los administradores conectados
    adminConnections.forEach((adminSocketId) => {
      io.to(adminSocketId).emit("new_deployment_request", notificationData);
    });

    console.log(
      `📢 Notificación enviada a ${adminConnections.size} administradores sobre nueva solicitud`
    );

    res.json({
      success: true,
      message: "Archivo subido exitosamente",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
});

// Rutas temporales para deployment
app.get("/api/deployment/admin/requests", (req, res) => {
  console.log(
    "📋 GET /admin/requests - Solicitudes actuales:",
    deploymentRequests.length
  );

  // Si no hay solicitudes reales, devolver array vacío o datos mock
  if (deploymentRequests.length === 0) {
    const mockRequests = [
      {
        id: 999,
        applicationName: "Aplicación Demo",
        warFileName: "demo-app.war",
        username: "usuario_demo",
        status: "pending",
        createdAt: new Date().toISOString(),
        requestDate: new Date().toLocaleString("es-ES"),
        targetServer: "Servidor Demo",
        environment: "development",
        priority: "medium",
        description: "Aplicación de demostración",
        User: {
          username: "usuario_demo",
        },
      },
    ];

    return res.json({
      success: true,
      data: mockRequests,
    });
  }

  // Devolver las solicitudes reales ordenadas por fecha (más recientes primero)
  const sortedRequests = deploymentRequests.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({
    success: true,
    data: sortedRequests,
  });
});

app.put("/api/deployment/admin/requests/:id/approve", (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: `Solicitud ${id} aprobada`,
  });
});

app.put("/api/deployment/admin/requests/:id/reject", (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: `Solicitud ${id} rechazada`,
  });
});

// ✅ Endpoint que usa el frontend para actualizar estado de solicitudes
app.put("/api/deployment/admin/:id/review", (req, res) => {
  const requestId = parseInt(req.params.id);
  const { status, comments } = req.body;

  console.log(`🔄 Actualizando solicitud ${requestId} a estado: ${status}`);

  // Buscar y actualizar la solicitud en el array
  const requestIndex = deploymentRequests.findIndex(
    (req) => req.id === requestId
  );

  if (requestIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Solicitud no encontrada",
    });
  }

  // Actualizar el estado
  deploymentRequests[requestIndex].status = status;
  if (comments) {
    deploymentRequests[requestIndex].adminComments = comments;
  }
  deploymentRequests[requestIndex].reviewedAt = new Date().toISOString();

  console.log(`✅ Solicitud ${requestId} actualizada exitosamente`);

  res.json({
    success: true,
    message: `Solicitud ${
      status === "approved"
        ? "aprobada"
        : status === "rejected"
        ? "rechazada"
        : "actualizada"
    }`,
    data: deploymentRequests[requestIndex],
  });
});

app.get("/api/deployment/user/requests", (req, res) => {
  const mockUserRequests = [
    {
      id: 1,
      filename: "mi-app.war",
      status: "pending",
      uploadDate: new Date().toISOString(),
      replica: "replica-1",
    },
  ];

  res.json({
    success: true,
    data: mockUserRequests,
  });
});

// Ruta para obtener solicitudes del usuario (usada por el frontend)
app.get("/api/deployment/my-requests", (req, res) => {
  const mockUserRequests = [
    {
      id: 1,
      warFileName: "mi-app.war",
      applicationName: "Mi Aplicación",
      targetServer: "Servidor de Desarrollo 1",
      priority: "medium",
      environment: "development",
      description: "Versión inicial de la aplicación",
      status: "pending",
      warFileSize: 1024000, // 1MB
      createdAt: new Date().toISOString(),
      User: {
        username: "usuario",
      },
    },
    {
      id: 2,
      warFileName: "sistema-web.war",
      applicationName: "Sistema Web",
      targetServer: "Servidor de Testing",
      priority: "high",
      environment: "testing",
      description: "Actualización de seguridad",
      status: "approved",
      warFileSize: 2048000, // 2MB
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Ayer
      User: {
        username: "usuario",
      },
    },
  ];

  res.json({
    success: true,
    data: mockUserRequests,
  });
});

// Endpoint para descargar archivos WAR (admin)
app.get("/api/deployment/admin/:id/download", (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    console.log(`📥 Solicitud de descarga para ID: ${requestId}`);

    // Buscar la solicitud en el array
    const request = deploymentRequests.find((req) => req.id === requestId);

    if (!request) {
      console.log(`❌ Solicitud ${requestId} no encontrada`);
      return res.status(404).json({
        success: false,
        error: "Solicitud no encontrada",
      });
    }

    // Verificar si el archivo existe en el sistema de archivos
    if (!request.filepath || !fs.existsSync(request.filepath)) {
      console.log(`❌ Archivo no encontrado en: ${request.filepath}`);
      return res.status(404).json({
        success: false,
        error: "Archivo WAR no encontrado en el servidor",
      });
    }

    console.log(`✅ Enviando archivo: ${request.filepath}`);
    console.log(`📁 Nombre original: ${request.warFileName}`);

    // Configurar headers para descarga
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${request.warFileName}"`
    );
    res.setHeader("Content-Type", "application/java-archive");

    // Obtener estadísticas del archivo
    const stats = fs.statSync(request.filepath);
    res.setHeader("Content-Length", stats.size);

    // Crear stream de lectura y enviarlo
    const fileStream = fs.createReadStream(request.filepath);

    fileStream.on("error", (error) => {
      console.error(`❌ Error leyendo archivo: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error leyendo el archivo",
        });
      }
    });

    fileStream.pipe(res);

    // Registrar actividad
    console.log(
      `📊 Descarga iniciada - Usuario: Admin, Archivo: ${request.warFileName}, Tamaño: ${stats.size} bytes`
    );
  } catch (error) {
    console.error("❌ Error en descarga:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor durante la descarga",
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor",
  });
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Iniciar servidor con Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO habilitado en puerto ${PORT}`);
  console.log(`⚠️  MODO DESARROLLO: Sin conexión a base de datos`);
});

module.exports = app;
