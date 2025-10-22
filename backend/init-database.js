const { sequelize } = require("./config/database");
const User = require("./models/User");

// Script para inicializar la base de datos SQLite
const initializeDatabase = async () => {
  try {
    console.log("🔄 Inicializando base de datos SQLite...");

    // Probar conexión
    await sequelize.authenticate();
    console.log("✅ Conexión a SQLite establecida");

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: false }); // force: true borra y recrea las tablas
    console.log("✅ Tablas sincronizadas correctamente");

    // Verificar si ya existe un usuario admin
    const adminUser = await User.findOne({ where: { role: "admin" } });

    if (!adminUser) {
      // Crear usuario admin por defecto
      const admin = await User.create({
        username: "admin",
        email: "admin@sistema.gov",
        password: "admin123", // Se hasheará automáticamente
        role: "admin",
      });
      console.log("✅ Usuario admin creado:");
      console.log("   Username: admin");
      console.log("   Password: admin123");
      console.log("   Email: admin@sistema.gov");
    } else {
      console.log("ℹ️  Usuario admin ya existe");
    }

    // Crear usuario de ejemplo si no existe
    const testUser = await User.findOne({ where: { username: "usuario" } });

    if (!testUser) {
      await User.create({
        username: "usuario",
        email: "usuario@sistema.gov",
        password: "usuario123", // Se hasheará automáticamente
        role: "user",
      });
      console.log("✅ Usuario de prueba creado:");
      console.log("   Username: usuario");
      console.log("   Password: usuario123");
      console.log("   Email: usuario@sistema.gov");
    } else {
      console.log("ℹ️  Usuario de prueba ya existe");
    }

    console.log("\n🎉 Base de datos inicializada correctamente!");
    console.log("📍 Archivo de BD: ./database/inegi_project.db");
  } catch (error) {
    console.error("💥 Error inicializando base de datos:", error);
  } finally {
    await sequelize.close();
    console.log("🔌 Conexión cerrada");
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log("🗃️  Inicializador de Base de Datos SQLite");
  console.log("=========================================\n");

  initializeDatabase().catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };
