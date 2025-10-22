const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      allowNull: false,
      defaultValue: "user",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    hooks: {
      // Hook para encriptar la contraseña antes de guardar
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Método de instancia para verificar contraseña
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Método de instancia para obtener datos públicos del usuario
User.prototype.toJSON = function () {
  const userObject = this.get();
  delete userObject.password; // Nunca enviar la contraseña al frontend
  return userObject;
};

// Definir asociaciones con otros modelos
User.associate = (models) => {
  // Un usuario puede tener muchas solicitudes de despliegue
  User.hasMany(models.DeploymentRequest, {
    foreignKey: "userId",
    as: "deploymentRequests",
  });

  // Un usuario puede tener muchas solicitudes revisadas (si es admin)
  User.hasMany(models.DeploymentRequest, {
    foreignKey: "reviewedBy",
    as: "reviewedRequests",
  });

  // Un usuario puede tener muchos logs de actividad
  User.hasMany(models.ActivityLog, {
    foreignKey: "userId",
    as: "activityLogs",
  });
};

module.exports = User;
