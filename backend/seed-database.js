const { sequelize } = require("./config/database");
const { User, DeploymentRequest, ActivityLog } = require("./models");

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed de la base de datos...");

    // Sincronizar todos los modelos con la base de datos
    await sequelize.sync({ force: false });
    console.log("📊 Modelos sincronizados");

    // Verificar si ya existen usuarios
    const existingUsers = await User.count();
    if (existingUsers === 0) {
      console.log("👥 Creando usuarios de prueba...");

      // Crear usuarios de prueba
      const adminUser = await User.create({
        username: "admin",
        email: "admin@inegi.com",
        password: "admin123",
        role: "admin",
      });

      const user1 = await User.create({
        username: "desarrollador1",
        email: "dev1@inegi.com",
        password: "user123",
        role: "user",
      });

      const user2 = await User.create({
        username: "desarrollador2",
        email: "dev2@inegi.com",
        password: "user123",
        role: "user",
      });

      // Add simple "user" account to match frontend expectation
      const simpleUser = await User.create({
        username: "user",
        email: "user@inegi.com",
        password: "user123",
        role: "user",
      });

      console.log("✅ Usuarios creados exitosamente");

      // Crear solicitudes de despliegue de prueba
      console.log("📦 Creando solicitudes de despliegue de prueba...");

      const request1 = await DeploymentRequest.create({
        userId: user1.id,
        username: user1.username,
        warFileName: "sistema-principal-v1.2.3.war",
        warFilePath: "/uploads/wars/sistema-principal-v1.2.3_1634567890.war",
        warFileSize: 15728640, // ~15MB
        targetServer: "Servidor de Desarrollo 1",
        applicationName: "Sistema Principal",
        description:
          "Actualización de la interfaz de usuario y corrección de bugs menores",
        status: "pending",
        priority: "medium",
        environment: "development",
      });

      const request2 = await DeploymentRequest.create({
        userId: user2.id,
        username: user2.username,
        warFileName: "modulo-reportes-v2.1.0.war",
        warFilePath: "/uploads/wars/modulo-reportes-v2.1.0_1634567891.war",
        warFileSize: 8947712, // ~8.5MB
        targetServer: "Servidor de Desarrollo 2",
        applicationName: "Módulo de Reportes",
        description:
          "Nueva funcionalidad para exportar reportes en Excel y PDF",
        status: "reviewing",
        priority: "high",
        environment: "development",
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      });

      const request3 = await DeploymentRequest.create({
        userId: user1.id,
        username: user1.username,
        warFileName: "api-core-v3.0.1.war",
        warFilePath: "/uploads/wars/api-core-v3.0.1_1634567892.war",
        warFileSize: 23592960, // ~22.5MB
        targetServer: "Servidor de Desarrollo 1",
        applicationName: "API Core",
        description: "Corrección crítica de vulnerabilidad de seguridad",
        status: "approved",
        priority: "urgent",
        environment: "development",
        reviewedBy: adminUser.id,
        reviewedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        reviewComments:
          "Cambio crítico aprobado. Proceder con despliegue inmediato.",
        deploymentStartedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutos atrás
      });

      console.log("✅ Solicitudes de despliegue creadas exitosamente");

      // Crear logs de actividad de prueba
      console.log("📝 Creando logs de actividad de prueba...");

      await ActivityLog.create({
        eventType: "war_upload",
        description: `Usuario ${user1.username} subió archivo WAR: sistema-principal-v1.2.3.war`,
        userId: user1.id,
        username: user1.username,
        userRole: user1.role,
        deploymentRequestId: request1.id,
        metadata: JSON.stringify({
          fileName: "sistema-principal-v1.2.3.war",
          fileSize: 15728640,
          targetServer: "Servidor de Desarrollo 1",
        }),
        ipAddress: "192.168.1.100",
      });

      await ActivityLog.create({
        eventType: "war_upload",
        description: `Usuario ${user2.username} subió archivo WAR: modulo-reportes-v2.1.0.war`,
        userId: user2.id,
        username: user2.username,
        userRole: user2.role,
        deploymentRequestId: request2.id,
        metadata: JSON.stringify({
          fileName: "modulo-reportes-v2.1.0.war",
          fileSize: 8947712,
          targetServer: "Servidor de Desarrollo 2",
        }),
        ipAddress: "192.168.1.101",
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
      });

      await ActivityLog.create({
        eventType: "review_started",
        description: `Admin ${adminUser.username} inició revisión de solicitud #${request2.id}`,
        userId: adminUser.id,
        username: adminUser.username,
        userRole: adminUser.role,
        deploymentRequestId: request2.id,
        metadata: JSON.stringify({
          requestId: request2.id,
        }),
        ipAddress: "192.168.1.10",
        createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutos atrás
      });

      await ActivityLog.create({
        eventType: "request_approved",
        description: `Admin ${adminUser.username} aprobó solicitud #${request3.id}`,
        userId: adminUser.id,
        username: adminUser.username,
        userRole: adminUser.role,
        deploymentRequestId: request3.id,
        metadata: JSON.stringify({
          requestId: request3.id,
          comments:
            "Cambio crítico aprobado. Proceder con despliegue inmediato.",
        }),
        ipAddress: "192.168.1.10",
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      });

      await ActivityLog.create({
        eventType: "deployment_started",
        description: `Inicio de despliegue para solicitud #${request3.id}`,
        userId: adminUser.id,
        username: adminUser.username,
        userRole: adminUser.role,
        deploymentRequestId: request3.id,
        metadata: JSON.stringify({
          requestId: request3.id,
          targetServer: "Servidor de Desarrollo 1",
        }),
        ipAddress: "192.168.1.10",
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutos atrás
      });

      await ActivityLog.create({
        eventType: "user_login",
        description: `Usuario ${user1.username} inició sesión`,
        userId: user1.id,
        username: user1.username,
        userRole: user1.role,
        metadata: JSON.stringify({
          loginMethod: "form",
        }),
        ipAddress: "192.168.1.100",
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
      });

      console.log("✅ Logs de actividad creados exitosamente");
    } else {
      console.log("ℹ️  Los usuarios ya existen, saltando seed...");
    }

    // Mostrar resumen
    const userCount = await User.count();
    const requestCount = await DeploymentRequest.count();
    const logCount = await ActivityLog.count();

    console.log("\n📊 Resumen de la base de datos:");
    console.log(`👥 Usuarios: ${userCount}`);
    console.log(`📦 Solicitudes de despliegue: ${requestCount}`);
    console.log(`📝 Logs de actividad: ${logCount}`);

    console.log("\n🎉 Seed completado exitosamente!");
    console.log("\n👤 Credenciales de prueba:");
    console.log("   Admin: admin / admin123");
    console.log("   Usuario 1: desarrollador1 / user123");
    console.log("   Usuario 2: desarrollador2 / user123");
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
  } finally {
    await sequelize.close();
    console.log("🔌 Conexión a la base de datos cerrada");
  }
}

// Ejecutar el seed
seedDatabase();
