const bcrypt = require("bcrypt");
const { sequelize } = require("./config/database");
const User = require("./models/User");

// Script para migrar contraseñas existentes de texto plano a hash
const migratePasswords = async () => {
  try {
    console.log("🔄 Iniciando migración de contraseñas...");

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a BD establecida");

    // Obtener todos los usuarios
    // Usamos query raw para evitar los hooks que hashearían automáticamente
    const users = await sequelize.query(
      "SELECT id, username, password FROM users",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log("ℹ️  No hay usuarios para migrar");
      return;
    }

    console.log(`📋 Encontrados ${users.length} usuarios para migrar`);

    let migratedCount = 0;
    let alreadyHashedCount = 0;

    for (const user of users) {
      try {
        // Verificar si la contraseña ya está hasheada (bcrypt hashes empiezan con $2b$)
        if (user.password && user.password.startsWith("$2b$")) {
          console.log(
            `⏭️  Usuario "${user.username}" ya tiene contraseña hasheada`
          );
          alreadyHashedCount++;
          continue;
        }

        // Hashear la contraseña en texto plano
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);

        // Actualizar directamente en la BD sin activar hooks
        await sequelize.query("UPDATE users SET password = ? WHERE id = ?", {
          replacements: [hashedPassword, user.id],
          type: sequelize.QueryTypes.UPDATE,
        });

        console.log(`✅ Usuario "${user.username}" migrado correctamente`);
        migratedCount++;
      } catch (error) {
        console.error(
          `❌ Error migrando usuario "${user.username}":`,
          error.message
        );
      }
    }

    console.log("\n📊 Resumen de migración:");
    console.log(`   - Usuarios migrados: ${migratedCount}`);
    console.log(`   - Ya hasheados: ${alreadyHashedCount}`);
    console.log(`   - Total procesados: ${users.length}`);
    console.log("\n🎉 Migración completada!");
  } catch (error) {
    console.error("💥 Error en migración:", error);
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log("🔌 Conexión a BD cerrada");
    process.exit(0);
  }
};

// Ejecutar migración si se llama directamente
if (require.main === module) {
  console.log("🔐 Script de Migración de Contraseñas");
  console.log("=====================================\n");

  migratePasswords().catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
}

module.exports = { migratePasswords };
