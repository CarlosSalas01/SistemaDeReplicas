const { sequelize } = require("./config/database");
const User = require("./models/User");

async function addUserAccount() {
  try {
    console.log("🌱 Adding 'user' account...");

    await sequelize.sync({ force: false });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username: "user" } });

    if (existingUser) {
      console.log("ℹ️  User 'user' already exists");
    } else {
      // Create the user account
      const newUser = await User.create({
        username: "user",
        email: "user@inegi.com",
        password: "user123",
        role: "user",
      });

      console.log("✅ User 'user' created successfully:", {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      });
    }

    // Show all users
    const allUsers = await User.findAll({
      attributes: ["id", "username", "email", "role", "isActive"],
    });

    console.log("\n👥 All users in database:");
    allUsers.forEach((user) => {
      console.log(
        `  - ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
    console.log("🔌 Connection closed");
  }
}

addUserAccount();
