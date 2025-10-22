const path = require("path");
const fs = require("fs").promises;
const {
  DeploymentRequest,
  ActivityLog,
  User,
  sequelize,
} = require("../models");
const { upload, deleteFile, getFileInfo } = require("../services/fileService");
const ActivityLogService = require("../services/activityLogService");

/**
 * Controlador para manejo de solicitudes de despliegue WAR
 */
class DeploymentController {
  /**
   * Subir archivo WAR y crear solicitud de despliegue
   */
  static async uploadWAR(req, res) {
    try {
      const {
        targetServer,
        applicationName,
        description,
        priority = "medium",
        environment = "development",
      } = req.body;
      const user = req.user;
      const file = req.file;

      // Validaciones
      if (!file) {
        return res.status(400).json({
          error: "No se proporcionó archivo WAR",
        });
      }

      if (!targetServer || !applicationName) {
        // Eliminar archivo subido si falta información
        await deleteFile(file.path);
        return res.status(400).json({
          error: "Servidor destino y nombre de aplicación son requeridos",
        });
      }

      // Crear solicitud de despliegue
      console.log("🔍 [UPLOAD] Creating deployment request for user:", {
        userId: user.id,
        username: user.username,
        applicationName,
        targetServer,
      });

      const deploymentRequest = await DeploymentRequest.create({
        userId: user.id,
        username: user.username,
        warFileName: file.originalname,
        warFilePath: file.path,
        warFileSize: file.size,
        targetServer,
        applicationName,
        description: description || null,
        priority,
        environment,
        status: "pending",
      });

      console.log("✅ [UPLOAD] Deployment request created successfully:", {
        id: deploymentRequest.id,
        userId: deploymentRequest.userId,
        username: deploymentRequest.username,
        applicationName: deploymentRequest.applicationName,
        status: deploymentRequest.status,
      });

      // Forzar sincronización de la base de datos
      await sequelize.sync();
      console.log("🔄 [UPLOAD] Database synced after creation");

      // Registrar actividad
      await ActivityLogService.logWarUpload(
        user,
        deploymentRequest.id,
        {
          fileName: file.originalname,
          fileSize: file.size,
          targetServer,
          applicationName,
        },
        req
      );

      // Notificar a admins en tiempo real
      if (req.notificationService) {
        req.notificationService.notifyWarUploaded(deploymentRequest, user);
      }

      res.status(201).json({
        message: "Archivo WAR subido exitosamente",
        data: {
          id: deploymentRequest.id,
          fileName: deploymentRequest.warFileName,
          fileSize: deploymentRequest.warFileSize,
          targetServer: deploymentRequest.targetServer,
          applicationName: deploymentRequest.applicationName,
          status: deploymentRequest.status,
          priority: deploymentRequest.priority,
          createdAt: deploymentRequest.createdAt,
        },
      });
    } catch (error) {
      console.error("Error subiendo WAR:", error);

      // Limpiar archivo si hubo error
      if (req.file) {
        await deleteFile(req.file.path);
      }

      res.status(500).json({
        error: "Error interno del servidor al subir archivo",
      });
    }
  }

  /**
   * Obtener todas las solicitudes de despliegue (admin)
   */
  static async getAllRequests(req, res) {
    try {
      const { status, priority, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;

      const requests = await DeploymentRequest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "requestUser",
            attributes: ["id", "username", "email"],
          },
          {
            association: "reviewer",
            attributes: ["id", "username"],
            required: false,
          },
        ],
      });

      res.json({
        message: "Solicitudes obtenidas exitosamente",
        data: requests.rows,
        pagination: {
          total: requests.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(requests.count / limit),
        },
      });
    } catch (error) {
      console.error("Error obteniendo solicitudes:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener solicitudes del usuario actual
   */
  static async getUserRequests(req, res) {
    try {
      const user = req.user;
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      console.log("🔍 [GET_USER_REQUESTS] Query for user:", {
        userId: user.id,
        username: user.username,
        status,
        page,
        limit,
      });

      const whereClause = { userId: user.id };
      if (status) whereClause.status = status;

      console.log("🔍 [GET_USER_REQUESTS] WHERE clause:", whereClause);

      const requests = await DeploymentRequest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "reviewer",
            attributes: ["id", "username"],
            required: false,
          },
        ],
      });

      console.log("✅ [GET_USER_REQUESTS] Found requests:", {
        count: requests.count,
        rows: requests.rows.length,
        requestIds: requests.rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          username: r.username,
          applicationName: r.applicationName,
        })),
      });

      res.json({
        message: "Solicitudes del usuario obtenidas exitosamente",
        data: requests.rows,
        pagination: {
          total: requests.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(requests.count / limit),
        },
      });
    } catch (error) {
      console.error(
        "❌ [GET_USER_REQUESTS] Error obteniendo solicitudes del usuario:",
        error
      );
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Debug: Obtener TODAS las solicitudes del usuario (sin paginación)
   */
  static async debugGetAllUserRequests(req, res) {
    try {
      const user = req.user;

      console.log("🔍 [DEBUG] Getting ALL requests for user:", {
        userId: user.id,
        username: user.username,
      });

      // Obtener TODAS las solicitudes sin límite
      const allRequests = await DeploymentRequest.findAll({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]],
        raw: true, // Datos en formato crudo para debugging
      });

      console.log("✅ [DEBUG] ALL requests found:", {
        total: allRequests.length,
        requests: allRequests.map((r) => ({
          id: r.id,
          userId: r.userId,
          username: r.username,
          applicationName: r.applicationName,
          status: r.status,
          createdAt: r.createdAt,
        })),
      });

      res.json({
        message: "Debug: Todas las solicitudes del usuario",
        data: allRequests,
        total: allRequests.length,
      });
    } catch (error) {
      console.error("❌ [DEBUG] Error:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Super Debug: Obtener TODAS las solicitudes de TODOS los usuarios
   */
  static async superDebugGetAllRequests(req, res) {
    try {
      console.log("🔍 [SUPER_DEBUG] Getting ALL requests from ALL users");

      // Obtener TODAS las solicitudes de todos los usuarios
      const allRequests = await DeploymentRequest.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      console.log("✅ [SUPER_DEBUG] ALL requests in database:", {
        total: allRequests.length,
        requests: allRequests.map((r) => ({
          id: r.id,
          userId: r.userId,
          username: r.username,
          applicationName: r.applicationName,
          status: r.status,
          createdAt: r.createdAt,
        })),
      });

      // Agrupar por usuario
      const byUser = allRequests.reduce((acc, req) => {
        if (!acc[req.userId]) {
          acc[req.userId] = [];
        }
        acc[req.userId].push(req);
        return acc;
      }, {});

      console.log(
        "📊 [SUPER_DEBUG] Requests by user:",
        Object.keys(byUser).map((userId) => ({
          userId: parseInt(userId),
          count: byUser[userId].length,
          usernames: [...new Set(byUser[userId].map((r) => r.username))],
        }))
      );

      res.json({
        message: "Super Debug: Todas las solicitudes de todos los usuarios",
        data: allRequests,
        total: allRequests.length,
        byUser: byUser,
      });
    } catch (error) {
      console.error("❌ [SUPER_DEBUG] Error:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener una solicitud específica
   */
  static async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const request = await DeploymentRequest.findByPk(id, {
        include: [
          {
            association: "requestUser",
            attributes: ["id", "username", "email"],
          },
          {
            association: "reviewer",
            attributes: ["id", "username"],
            required: false,
          },
        ],
      });

      if (!request) {
        return res.status(404).json({
          error: "Solicitud no encontrada",
        });
      }

      // Verificar permisos: solo el usuario que creó la solicitud o un admin puede verla
      if (user.role !== "admin" && request.userId !== user.id) {
        return res.status(403).json({
          error: "No tienes permisos para ver esta solicitud",
        });
      }

      res.json({
        message: "Solicitud obtenida exitosamente",
        data: request,
      });
    } catch (error) {
      console.error("Error obteniendo solicitud:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Revisar solicitud (admin)
   */
  static async reviewRequest(req, res) {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      const admin = req.user;

      // Validar estado
      const validStatuses = ["reviewing", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error:
            'Estado inválido. Debe ser "reviewing", "approved" o "rejected"',
        });
      }

      const request = await DeploymentRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({
          error: "Solicitud no encontrada",
        });
      }

      // Verificar que la solicitud esté en estado pending o reviewing
      if (!["pending", "reviewing"].includes(request.status)) {
        return res.status(400).json({
          error: "La solicitud ya ha sido procesada",
        });
      }

      // Actualizar solicitud
      await request.update({
        status,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        reviewComments: comments || null,
      });

      // Registrar actividad
      if (status === "approved") {
        await ActivityLogService.logRequestApproved(
          admin,
          request.id,
          comments,
          req
        );
      } else if (status === "rejected") {
        await ActivityLogService.logRequestRejected(
          admin,
          request.id,
          comments,
          req
        );
      } else if (status === "reviewing") {
        await ActivityLogService.logActivity({
          eventType: "review_started",
          description: `Admin ${admin.username} inició revisión de solicitud #${request.id}`,
          userId: admin.id,
          username: admin.username,
          userRole: admin.role,
          deploymentRequestId: request.id,
          metadata: JSON.stringify({
            requestId: request.id,
            comments: comments || null,
          }),
          ipAddress: req.ip || req.connection.remoteAddress,
        });
      }

      // Notificar al usuario en tiempo real
      if (req.notificationService) {
        if (status === "approved") {
          req.notificationService.notifyRequestApproved(
            request.userId,
            request,
            comments
          );
        } else if (status === "rejected") {
          req.notificationService.notifyRequestRejected(
            request.userId,
            request,
            comments
          );
        } else if (status === "reviewing") {
          req.notificationService.notifyUserRequestUpdate(
            request.userId,
            "reviewing",
            request,
            comments
          );
        }
      }

      const statusMessages = {
        approved: "aprobada",
        rejected: "rechazada",
        reviewing: "marcada como en revisión",
      };

      res.json({
        message: `Solicitud ${statusMessages[status]} exitosamente`,
        data: {
          id: request.id,
          status: status,
          reviewedBy: admin.username,
          reviewedAt: new Date(),
          comments: comments,
        },
      });
    } catch (error) {
      console.error("Error revisando solicitud:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Iniciar despliegue (admin)
   */
  static async startDeployment(req, res) {
    try {
      const { id } = req.params;
      const admin = req.user;

      const request = await DeploymentRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({
          error: "Solicitud no encontrada",
        });
      }

      // Verificar que la solicitud esté aprobada
      if (request.status !== "approved") {
        return res.status(400).json({
          error: "La solicitud debe estar aprobada para iniciar el despliegue",
        });
      }

      // Actualizar estado a deploying
      await request.update({
        status: "deploying",
        deploymentStartedAt: new Date(),
      });

      // Registrar actividad
      await ActivityLogService.logActivity({
        eventType: "deployment_started",
        description: `Admin ${admin.username} inició despliegue de ${request.warFileName}`,
        userId: admin.id,
        username: admin.username,
        userRole: admin.role,
        deploymentRequestId: request.id,
        metadata: JSON.stringify({
          requestId: request.id,
          fileName: request.warFileName,
          targetServer: request.targetServer,
        }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Notificar en tiempo real
      if (req.notificationService) {
        req.notificationService.notifyDeploymentStarted(
          request.userId,
          request
        );
      }

      // Aquí se integraría con el sistema de despliegue real
      // Por ahora simulamos un despliegue exitoso después de un delay
      setTimeout(async () => {
        try {
          await request.update({
            status: "deployed",
            deploymentCompletedAt: new Date(),
            deploymentLogs: "Despliegue completado exitosamente",
          });

          // Registrar completion
          await ActivityLogService.logActivity({
            eventType: "deployment_completed",
            description: `Despliegue completado: ${request.warFileName}`,
            userId: admin.id,
            username: admin.username,
            userRole: admin.role,
            deploymentRequestId: request.id,
            metadata: JSON.stringify({
              requestId: request.id,
              fileName: request.warFileName,
            }),
          });

          // Notificar completion
          if (req.notificationService) {
            req.notificationService.notifyDeploymentCompleted(
              request.userId,
              request
            );
          }
        } catch (error) {
          console.error("Error completando despliegue simulado:", error);
        }
      }, 10000); // 10 segundos de simulación

      res.json({
        message: "Despliegue iniciado exitosamente",
        data: {
          id: request.id,
          status: "deploying",
          deploymentStartedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error iniciando despliegue:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Descargar archivo WAR (admin)
   */
  static async downloadWAR(req, res) {
    try {
      const { id } = req.params;
      const admin = req.user;

      const request = await DeploymentRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({
          error: "Solicitud no encontrada",
        });
      }

      // Verificar que el archivo existe
      const filePath = request.warFilePath;
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          error: "Archivo no encontrado en el servidor",
        });
      }

      // Registrar descarga
      await ActivityLogService.logActivity({
        eventType: "file_downloaded",
        description: `Admin ${admin.username} descargó ${request.warFileName}`,
        userId: admin.id,
        username: admin.username,
        userRole: admin.role,
        deploymentRequestId: request.id,
        metadata: JSON.stringify({
          fileName: request.warFileName,
          fileSize: request.warFileSize,
        }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.download(filePath, request.warFileName);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de solicitudes (admin)
   */
  static async getStats(req, res) {
    try {
      const { Op } = require("sequelize");

      // Contar solicitudes por estado
      const statusStats = await DeploymentRequest.findAll({
        attributes: [
          "status",
          [
            DeploymentRequest.sequelize.fn(
              "COUNT",
              DeploymentRequest.sequelize.col("status")
            ),
            "count",
          ],
        ],
        group: ["status"],
      });

      // Contar solicitudes por prioridad
      const priorityStats = await DeploymentRequest.findAll({
        attributes: [
          "priority",
          [
            DeploymentRequest.sequelize.fn(
              "COUNT",
              DeploymentRequest.sequelize.col("priority")
            ),
            "count",
          ],
        ],
        group: ["priority"],
      });

      // Solicitudes de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = await DeploymentRequest.count({
        where: {
          createdAt: {
            [Op.gte]: today,
          },
        },
      });

      // Solicitudes pendientes
      const pendingCount = await DeploymentRequest.count({
        where: {
          status: "pending",
        },
      });

      res.json({
        message: "Estadísticas obtenidas exitosamente",
        data: {
          byStatus: statusStats,
          byPriority: priorityStats,
          todayRequests: todayCount,
          pendingRequests: pendingCount,
        },
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }
}

module.exports = DeploymentController;
