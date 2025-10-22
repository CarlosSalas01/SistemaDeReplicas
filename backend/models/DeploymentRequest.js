const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const DeploymentRequest = sequelize.define(
  "DeploymentRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Información del usuario
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

    // Información del archivo WAR
    warFileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    warFilePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    warFileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    // Información del despliegue
    targetServer: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Servidor destino seleccionado por el usuario",
    },
    applicationName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre de la aplicación seleccionada",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción opcional del cambio",
    },

    // Estado del proceso (SQLite no soporta ENUM, usamos STRING con validación)
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
      allowNull: false,
      validate: {
        isIn: [
          [
            "pending",
            "reviewing",
            "approved",
            "rejected",
            "deploying",
            "deployed",
            "failed",
          ],
        ],
      },
    },

    // Información del admin
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "ID del admin que revisó la solicitud",
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Comentarios del admin sobre la aprobación/rechazo",
    },

    // Información del despliegue
    deploymentStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deploymentCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deploymentLogs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Logs del proceso de despliegue",
    },

    // Metadatos adicionales (SQLite no soporta ENUM, usamos STRING con validación)
    priority: {
      type: DataTypes.STRING(10),
      defaultValue: "medium",
      validate: {
        isIn: [["low", "medium", "high", "urgent"]],
      },
    },
    environment: {
      type: DataTypes.STRING(20),
      defaultValue: "development",
      validate: {
        isIn: [["development", "testing", "staging"]],
      },
    },
  },
  {
    tableName: "deployment_requests",
    indexes: [
      { fields: ["userId"] },
      { fields: ["status"] },
      { fields: ["reviewedBy"] },
      { fields: ["createdAt"] },
      { fields: ["priority"] },
    ],
  }
);

// Asociaciones
DeploymentRequest.associate = (models) => {
  // Relación con el usuario que hace la solicitud
  DeploymentRequest.belongsTo(models.User, {
    foreignKey: "userId",
    as: "requestUser",
  });

  // Relación con el admin que revisa
  DeploymentRequest.belongsTo(models.User, {
    foreignKey: "reviewedBy",
    as: "reviewer",
  });
};

module.exports = DeploymentRequest;
