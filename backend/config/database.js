const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configuración para SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "./database/inegi_project.db", // Ruta del archivo SQLite
  logging: console.log, // Habilita logs SQL para debugging
  define: {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  },
});

// Configuración alternativa para MySQL (comentada)
/*
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);
*/

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente.");
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos:", error);
  }
};

module.exports = { sequelize, testConnection };
