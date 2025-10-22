const { ActivityLog } = require("../models");

/**
 * Servicio para registrar actividades del sistema
 */
class ActivityLogService {
  /**
   * Registra una nueva actividad en el sistema
   * @param {Object} params - Parámetros del evento
   * @param {string} params.eventType - Tipo de evento
   * @param {string} params.description - Descripción del evento
   * @param {number} params.userId - ID del usuario
   * @param {string} params.username - Nombre del usuario
   * @param {string} params.userRole - Rol del usuario (admin/user)
   * @param {number} params.deploymentRequestId - ID de la solicitud (opcional)
   * @param {Object} params.metadata - Metadatos adicionales (opcional)
   * @param {string} params.ipAddress - IP del usuario (opcional)
   * @param {string} params.userAgent - User Agent (opcional)
   */
  static async logActivity({
    eventType,
    description,
    userId,
    username,
    userRole,
    deploymentRequestId = null,
    metadata = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const activityLog = await ActivityLog.create({
        eventType,
        description,
        userId,
        username,
        userRole,
        deploymentRequestId,
        metadata,
        ipAddress,
        userAgent,
      });

      return activityLog;
    } catch (error) {
      console.error("Error registrando actividad:", error);
      throw error;
    }
  }

  /**
   * Obtiene logs de actividad con filtros
   * @param {Object} filters - Filtros para la consulta
   * @param {number} filters.limit - Límite de registros (default: 50)
   * @param {number} filters.offset - Offset para paginación (default: 0)
   * @param {string} filters.eventType - Filtrar por tipo de evento
   * @param {number} filters.userId - Filtrar por usuario
   * @param {string} filters.userRole - Filtrar por rol
   * @param {number} filters.deploymentRequestId - Filtrar por solicitud
   */
  static async getActivityLogs(filters = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        eventType,
        userId,
        userRole,
        deploymentRequestId,
      } = filters;

      const whereClause = {};

      if (eventType) whereClause.eventType = eventType;
      if (userId) whereClause.userId = userId;
      if (userRole) whereClause.userRole = userRole;
      if (deploymentRequestId)
        whereClause.deploymentRequestId = deploymentRequestId;

      const logs = await ActivityLog.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "user",
            attributes: ["id", "username", "role"],
          },
          {
            association: "deploymentRequest",
            attributes: ["id", "warFileName", "status"],
          },
        ],
      });

      return logs;
    } catch (error) {
      console.error("Error obteniendo logs de actividad:", error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de actividad
   * @param {Object} params - Parámetros para las estadísticas
   * @param {string} params.period - Período de tiempo ('today', 'week', 'month')
   */
  static async getActivityStats(period = "today") {
    try {
      const { Op } = require("sequelize");
      let dateFilter;

      const now = new Date();
      switch (period) {
        case "today":
          dateFilter = {
            createdAt: {
              [Op.gte]: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
              ),
            },
          };
          break;
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = {
            createdAt: {
              [Op.gte]: weekAgo,
            },
          };
          break;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = {
            createdAt: {
              [Op.gte]: monthAgo,
            },
          };
          break;
        default:
          dateFilter = {};
      }

      const stats = await ActivityLog.findAll({
        where: dateFilter,
        attributes: [
          "eventType",
          [
            ActivityLog.sequelize.fn(
              "COUNT",
              ActivityLog.sequelize.col("eventType")
            ),
            "count",
          ],
        ],
        group: ["eventType"],
        order: [
          [
            ActivityLog.sequelize.fn(
              "COUNT",
              ActivityLog.sequelize.col("eventType")
            ),
            "DESC",
          ],
        ],
      });

      return stats;
    } catch (error) {
      console.error("Error obteniendo estadísticas de actividad:", error);
      throw error;
    }
  }

  /**
   * Métodos de conveniencia para eventos específicos
   */
  static async logWarUpload(user, deploymentRequestId, metadata, req) {
    return this.logActivity({
      eventType: "war_upload",
      description: `Usuario ${user.username} subió archivo WAR: ${metadata.fileName}`,
      userId: user.id,
      username: user.username,
      userRole: user.role,
      deploymentRequestId,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  }

  static async logReviewStarted(admin, deploymentRequestId, req) {
    return this.logActivity({
      eventType: "review_started",
      description: `Admin ${admin.username} inició revisión de solicitud #${deploymentRequestId}`,
      userId: admin.id,
      username: admin.username,
      userRole: admin.role,
      deploymentRequestId,
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  }

  static async logRequestApproved(admin, deploymentRequestId, comments, req) {
    return this.logActivity({
      eventType: "request_approved",
      description: `Admin ${admin.username} aprobó solicitud #${deploymentRequestId}`,
      userId: admin.id,
      username: admin.username,
      userRole: admin.role,
      deploymentRequestId,
      metadata: { comments },
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  }

  static async logRequestRejected(admin, deploymentRequestId, comments, req) {
    return this.logActivity({
      eventType: "request_rejected",
      description: `Admin ${admin.username} rechazó solicitud #${deploymentRequestId}`,
      userId: admin.id,
      username: admin.username,
      userRole: admin.role,
      deploymentRequestId,
      metadata: { comments },
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  }

  static async logUserLogin(user, req) {
    return this.logActivity({
      eventType: "user_login",
      description: `Usuario ${user.username} inició sesión`,
      userId: user.id,
      username: user.username,
      userRole: user.role,
      metadata: { loginMethod: "form" },
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  }

  static async logUserLogout(user, req) {
    return this.logActivity({
      eventType: "user_logout",
      description: `Usuario ${user.username} cerró sesión`,
      userId: user.id,
      username: user.username,
      userRole: user.role,
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  }
}

module.exports = ActivityLogService;
