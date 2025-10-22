const express = require("express");
const router = express.Router();
const DeploymentController = require("../controllers/deploymentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { upload } = require("../services/fileService");

// Middleware para validar archivos WAR
const validateWARFile = (req, res, next) => {
  if (req.file && !req.file.originalname.toLowerCase().endsWith(".war")) {
    return res.status(400).json({
      error: "Solo se permiten archivos con extensión .war",
    });
  }
  next();
};

// ========== RUTAS PARA USUARIOS ==========

/**
 * POST /api/deployment/upload
 * Subir archivo WAR y crear solicitud de despliegue
 * Requiere: autenticación
 */
router.post(
  "/upload",
  authenticateToken,
  upload.single("warFile"),
  validateWARFile,
  DeploymentController.uploadWAR
);

/**
 * GET /api/deployment/my-requests
 * Obtener solicitudes del usuario actual
 * Requiere: autenticación
 */
router.get(
  "/my-requests",
  authenticateToken,
  DeploymentController.getUserRequests
);

/**
 * GET /api/deployment/debug/all-my-requests
 * Debug: Obtener TODAS las solicitudes del usuario (sin paginación)
 * Requiere: autenticación
 */
router.get(
  "/debug/all-my-requests",
  authenticateToken,
  DeploymentController.debugGetAllUserRequests
);

/**
 * GET /api/deployment/debug/super-all-requests
 * Super Debug: Obtener TODAS las solicitudes de TODOS los usuarios
 * Requiere: autenticación
 */
router.get(
  "/debug/super-all-requests",
  authenticateToken,
  DeploymentController.superDebugGetAllRequests
);

/**
 * GET /api/deployment/:id
 * Obtener detalles de una solicitud específica
 * Requiere: autenticación (usuario propietario o admin)
 */
router.get("/:id", authenticateToken, DeploymentController.getRequestById);

// ========== RUTAS PARA ADMINISTRADORES ==========

/**
 * GET /api/deployment/admin/requests
 * Obtener todas las solicitudes de despliegue
 * Requiere: autenticación + rol admin
 */
router.get(
  "/admin/requests",
  authenticateToken,
  authorizeRoles("admin"),
  DeploymentController.getAllRequests
);

/**
 * PUT /api/deployment/admin/:id/review
 * Revisar solicitud (aprobar/rechazar)
 * Requiere: autenticación + rol admin
 */
router.put(
  "/admin/:id/review",
  authenticateToken,
  authorizeRoles("admin"),
  DeploymentController.reviewRequest
);

/**
 * POST /api/deployment/admin/:id/deploy
 * Iniciar proceso de despliegue
 * Requiere: autenticación + rol admin
 */
router.post(
  "/admin/:id/deploy",
  authenticateToken,
  authorizeRoles("admin"),
  DeploymentController.startDeployment
);

/**
 * GET /api/deployment/admin/:id/download
 * Descargar archivo WAR
 * Requiere: autenticación + rol admin
 */
router.get(
  "/admin/:id/download",
  authenticateToken,
  authorizeRoles("admin"),
  DeploymentController.downloadWAR
);

/**
 * GET /api/deployment/admin/stats
 * Obtener estadísticas de solicitudes
 * Requiere: autenticación + rol admin
 */
router.get(
  "/admin/stats",
  authenticateToken,
  authorizeRoles("admin"),
  DeploymentController.getStats
);

// ========== RUTAS PARA LOGS DE ACTIVIDAD ==========

/**
 * GET /api/deployment/admin/activity-logs
 * Obtener logs de actividad
 * Requiere: autenticación + rol admin
 */
router.get(
  "/admin/activity-logs",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const ActivityLogService = require("../services/activityLogService");
      const {
        eventType,
        userId,
        userRole,
        deploymentRequestId,
        page = 1,
        limit = 50,
      } = req.query;

      const filters = {
        limit: parseInt(limit),
        offset: (page - 1) * parseInt(limit),
        eventType,
        userId: userId ? parseInt(userId) : undefined,
        userRole,
        deploymentRequestId: deploymentRequestId
          ? parseInt(deploymentRequestId)
          : undefined,
      };

      const logs = await ActivityLogService.getActivityLogs(filters);

      res.json({
        message: "Logs de actividad obtenidos exitosamente",
        data: logs.rows,
        pagination: {
          total: logs.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(logs.count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error obteniendo logs de actividad:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }
);

/**
 * GET /api/deployment/admin/activity-stats
 * Obtener estadísticas de actividad
 * Requiere: autenticación + rol admin
 */
router.get(
  "/admin/activity-stats",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const ActivityLogService = require("../services/activityLogService");
      const { period = "today" } = req.query;

      const stats = await ActivityLogService.getActivityStats(period);

      res.json({
        message: "Estadísticas de actividad obtenidas exitosamente",
        data: stats,
        period: period,
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas de actividad:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }
);

// Middleware de manejo de errores específico para multer
router.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "El archivo es demasiado grande. Máximo permitido: 100MB",
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: 'Campo de archivo inesperado. Use "warFile" como nombre del campo',
    });
  }

  if (error.message === "Solo se permiten archivos .war") {
    return res.status(400).json({
      error: error.message,
    });
  }

  next(error);
});

module.exports = router;
