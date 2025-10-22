const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Información del evento (SQLite no soporta ENUM, usamos STRING con validación)
    eventType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [
          [
            "war_upload",
            "review_started",
            "request_approved",
            "request_rejected",
            "deployment_started",
            "deployment_completed",
            "deployment_failed",
            "user_login",
            "user_logout",
            "file_downloaded",
          ],
        ],
      },
    },

    // Detalles del evento
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "Descripción legible del evento",
    },

    // Información del usuario/admin
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    userRole: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [["admin", "user"]],
      },
    },

    // Relación con solicitud de despliegue (si aplica)
    deploymentRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "deployment_requests",
        key: "id",
      },
    },

    // Metadatos adicionales (SQLite soporta JSON desde versión 3.7.17)
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Información adicional del evento en formato JSON",
    },

    // IP del usuario (para auditoría)
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    // User Agent (para auditoría)
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "activity_logs",
    indexes: [
      { fields: ["eventType"] },
      { fields: ["userId"] },
      { fields: ["deploymentRequestId"] },
      { fields: ["createdAt"] },
      { fields: ["userRole"] },
    ],
  }
);

// Asociaciones
ActivityLog.associate = (models) => {
  ActivityLog.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });

  ActivityLog.belongsTo(models.DeploymentRequest, {
    foreignKey: "deploymentRequestId",
    as: "deploymentRequest",
  });
};

module.exports = ActivityLog;
