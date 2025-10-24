import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.callbacks = new Map();
  }

  /**
   * Conectar al servidor Socket.IO
   * @param {string} token - Token JWT del usuario
   * @param {Object} user - Información del usuario
   */
  connect(token, user) {
    console.log("🚀 INICIANDO socketService.connect()");
    console.log("🚀 Token:", token ? "✅ Present" : "❌ Missing");
    console.log("🚀 User:", user);

    if (this.socket) {
      this.disconnect();
    }

    try {
      // Configuración de conexión - MODO DEBUG
      console.log("🔧 DEBUG: Intentando conectar Socket.IO...");
      this.socket = io(
        import.meta.env.VITE_API_URL || "http://localhost:3001",
        {
          transports: ["polling", "websocket"], // Cambiar orden: polling primero
          timeout: 30000, // Más tiempo
          forceNew: true,
          autoConnect: true, // Asegurar auto-conexión
        }
      );

      // Eventos de conexión
      this.socket.on("connect", () => {
        console.log("✅ ¡Socket.IO CONECTADO EXITOSAMENTE!:", this.socket.id);
        console.log(
          "🔧 Transport usado:",
          this.socket.io.engine.transport.name
        );
        this.isConnected = true;

        // Autenticar con el servidor
        console.log("🔐 Enviando autenticación para:", user);
        this.socket.emit("authenticate", {
          token: token,
          userId: user.id,
          username: user.username,
          userRole: user.role,
        });
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 Desconectado de Socket.IO:", reason);
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ ERROR DE CONEXIÓN Socket.IO:");
        console.error("   - Tipo:", error.type);
        console.error("   - Descripción:", error.description);
        console.error("   - Context:", error.context);
        console.error("   - Error completo:", error);
        this.isConnected = false;
      });

      // Evento de prueba
      this.socket.on("test_response", (data) => {
        console.log("📡 Respuesta de prueba:", data);
      });

      // Eventos para usuarios normales
      if (user.role === "user") {
        this.setupUserEvents();
      }

      // Eventos para administradores
      if (user.role === "admin") {
        this.setupAdminEvents();
      }
    } catch (error) {
      console.error("❌ Error iniciando Socket.IO:", error);
    }
  }

  /**
   * Configurar eventos para usuarios normales
   */
  setupUserEvents() {
    // Actualizaciones de estado de solicitudes
    this.socket.on("request_status_update", (data) => {
      console.log("📱 Actualización de solicitud:", data);
      this.executeCallback("request_status_update", data);
    });
  }

  /**
   * Configurar eventos para administradores
   */
  setupAdminEvents() {
    // Nuevas solicitudes de despliegue
    this.socket.on("new_deployment_request", (data) => {
      console.log("📢 Nueva solicitud de despliegue:", data);
      this.executeCallback("new_deployment_request", data);
    });

    // Actividad del sistema
    this.socket.on("system_activity", (data) => {
      console.log("🔔 Actividad del sistema:", data);
      this.executeCallback("system_activity", data);
    });

    // Estadísticas actualizadas
    this.socket.on("stats_update", (data) => {
      console.log("📊 Estadísticas actualizadas:", data);
      this.executeCallback("stats_update", data);
    });

    // Estadísticas iniciales para admin
    this.socket.on("admin_stats", (data) => {
      console.log("📊 Estadísticas iniciales:", data);
      this.executeCallback("admin_stats", data);
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log("🔌 Socket.IO desconectado");
    }
  }

  /**
   * Registrar callback para un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   */
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  /**
   * Desregistrar callback para un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback a remover
   */
  off(event, callback) {
    if (this.callbacks.has(event)) {
      const callbacks = this.callbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Ejecutar callbacks registrados para un evento
   * @param {string} event - Nombre del evento
   * @param {Object} data - Datos del evento
   */
  executeCallback(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error ejecutando callback para ${event}:`, error);
        }
      });
    }
  }

  /**
   * Emitir evento al servidor
   * @param {string} event - Nombre del evento
   * @param {Object} data - Datos a enviar
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket no conectado. No se puede emitir evento:", event);
    }
  }

  /**
   * Probar conexión
   */
  testConnection() {
    this.emit("test_event", {
      message: "Prueba de conexión desde el frontend",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
    };
  }
}

// Exportar instancia única (singleton)
const socketService = new SocketService();
export default socketService;
