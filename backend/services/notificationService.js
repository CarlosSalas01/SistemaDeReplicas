/**
 * Servicio para manejar notificaciones en tiempo real via Socket.IO
 */
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Notificar a todos los admins sobre una nueva solicitud de despliegue
   * @param {Object} deploymentRequest - Datos de la solicitud
   * @param {Object} user - Usuario que hizo la solicitud
   */
  notifyAdminsNewRequest(deploymentRequest, user) {
    this.io.to("admins").emit("new_deployment_request", {
      type: "new_request",
      message: `Nueva solicitud de despliegue de ${user.username}`,
      data: {
        id: deploymentRequest.id,
        fileName: deploymentRequest.warFileName,
        username: user.username,
        targetServer: deploymentRequest.targetServer,
        applicationName: deploymentRequest.applicationName,
        priority: deploymentRequest.priority,
        createdAt: deploymentRequest.createdAt,
      },
      timestamp: new Date().toISOString(),
    });

    console.log(
      `📢 Notificación enviada a admins: Nueva solicitud #${deploymentRequest.id}`
    );
  }

  /**
   * Notificar a un usuario específico sobre el estado de su solicitud
   * @param {number} userId - ID del usuario
   * @param {string} status - Nuevo estado de la solicitud
   * @param {Object} requestData - Datos de la solicitud
   * @param {string} adminComment - Comentario del admin (opcional)
   */
  notifyUserRequestUpdate(userId, status, requestData, adminComment = null) {
    const statusMessages = {
      reviewing: "Tu solicitud está siendo revisada por un administrador",
      approved: "Tu solicitud ha sido aprobada y será desplegada",
      rejected: "Tu solicitud ha sido rechazada",
      deploying: "Tu aplicación está siendo desplegada",
      deployed: "Tu aplicación ha sido desplegada exitosamente",
      failed: "El despliegue de tu aplicación ha fallado",
    };

    const statusColors = {
      reviewing: "blue",
      approved: "green",
      rejected: "red",
      deploying: "yellow",
      deployed: "green",
      failed: "red",
    };

    // Buscar socket del usuario específico
    const userSockets = Array.from(this.io.sockets.sockets.values()).filter(
      (socket) => socket.userId === userId
    );

    userSockets.forEach((socket) => {
      socket.emit("request_status_update", {
        type: "status_update",
        message: statusMessages[status] || `Tu solicitud cambió a: ${status}`,
        data: {
          requestId: requestData.id,
          fileName: requestData.warFileName,
          status: status,
          statusColor: statusColors[status],
          adminComment: adminComment,
          updatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    });

    console.log(
      `📱 Notificación enviada a usuario #${userId}: Solicitud ${status}`
    );
  }

  /**
   * Notificar actividad general del sistema
   * @param {string} eventType - Tipo de evento
   * @param {string} description - Descripción del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  notifySystemActivity(eventType, description, metadata = {}) {
    // Notificar solo a admins sobre actividad del sistema
    this.io.to("admins").emit("system_activity", {
      type: "activity",
      eventType: eventType,
      message: description,
      data: metadata,
      timestamp: new Date().toISOString(),
    });

    console.log(`🔔 Actividad del sistema notificada: ${eventType}`);
  }

  /**
   * Enviar estadísticas actualizadas a todos los admins
   * @param {Object} stats - Estadísticas del sistema
   */
  broadcastStatsToAdmins(stats) {
    this.io.to("admins").emit("stats_update", {
      type: "stats",
      data: stats,
      timestamp: new Date().toISOString(),
    });

    console.log("📊 Estadísticas actualizadas enviadas a admins");
  }

  /**
   * Notificar a todos los usuarios conectados (broadcasting)
   * @param {string} message - Mensaje a enviar
   * @param {Object} data - Datos adicionales
   */
  broadcastToAll(message, data = {}) {
    this.io.emit("system_broadcast", {
      type: "broadcast",
      message: message,
      data: data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 Mensaje broadcast enviado: ${message}`);
  }

  /**
   * Obtener estadísticas de conexiones actuales
   */
  getConnectionStats() {
    const sockets = Array.from(this.io.sockets.sockets.values());
    const adminSockets = sockets.filter((s) => s.userRole === "admin");
    const userSockets = sockets.filter((s) => s.userRole === "user");

    return {
      total: sockets.length,
      admins: adminSockets.length,
      users: userSockets.length,
      adminUsers: adminSockets.map((s) => ({
        id: s.userId,
        username: s.username,
      })),
      connectedUsers: userSockets.map((s) => ({
        id: s.userId,
        username: s.username,
      })),
    };
  }

  /**
   * Métodos de conveniencia para eventos específicos
   */
  notifyWarUploaded(deploymentRequest, user) {
    this.notifyAdminsNewRequest(deploymentRequest, user);
    this.notifySystemActivity(
      "war_upload",
      `${user.username} subió ${deploymentRequest.warFileName}`,
      {
        userId: user.id,
        fileName: deploymentRequest.warFileName,
        fileSize: deploymentRequest.warFileSize,
      }
    );
  }

  notifyRequestApproved(userId, requestData, adminComment) {
    this.notifyUserRequestUpdate(userId, "approved", requestData, adminComment);
    this.notifySystemActivity(
      "request_approved",
      `Solicitud #${requestData.id} aprobada`,
      {
        requestId: requestData.id,
        fileName: requestData.warFileName,
      }
    );
  }

  notifyRequestRejected(userId, requestData, adminComment) {
    this.notifyUserRequestUpdate(userId, "rejected", requestData, adminComment);
    this.notifySystemActivity(
      "request_rejected",
      `Solicitud #${requestData.id} rechazada`,
      {
        requestId: requestData.id,
        fileName: requestData.warFileName,
      }
    );
  }

  notifyDeploymentStarted(userId, requestData) {
    this.notifyUserRequestUpdate(userId, "deploying", requestData);
    this.notifySystemActivity(
      "deployment_started",
      `Iniciando despliegue de ${requestData.warFileName}`,
      {
        requestId: requestData.id,
        fileName: requestData.warFileName,
      }
    );
  }

  notifyDeploymentCompleted(userId, requestData) {
    this.notifyUserRequestUpdate(userId, "deployed", requestData);
    this.notifySystemActivity(
      "deployment_completed",
      `Despliegue completado: ${requestData.warFileName}`,
      {
        requestId: requestData.id,
        fileName: requestData.warFileName,
      }
    );
  }

  notifyDeploymentFailed(userId, requestData, error) {
    this.notifyUserRequestUpdate(
      userId,
      "failed",
      requestData,
      `Error: ${error}`
    );
    this.notifySystemActivity(
      "deployment_failed",
      `Falló el despliegue: ${requestData.warFileName}`,
      {
        requestId: requestData.id,
        fileName: requestData.warFileName,
        error: error,
      }
    );
  }
}

module.exports = NotificationService;
