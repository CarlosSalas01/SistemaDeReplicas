const { sequelize } = require("../config/database");

// Importar todos los modelos
const User = require("./User");
const DeploymentRequest = require("./DeploymentRequest");
const ActivityLog = require("./ActivityLog");

// Crear objeto con todos los modelos
const models = {
  User,
  DeploymentRequest,
  ActivityLog,
  sequelize,
};

// Ejecutar las asociaciones de cada modelo
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
