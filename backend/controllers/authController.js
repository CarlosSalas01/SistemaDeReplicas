const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/User");
const ActivityLogService = require("../services/activityLogService");

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

// Registro de usuario
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email y password son requeridos",
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "El usuario o email ya existe",
      });
    }

    // Crear nuevo usuario
    const newUser = await User.create({
      username,
      email,
      password,
      role: role || "user",
    });

    // Generar token
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: newUser.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({
        error: "Username y password son requeridos",
      });
    }

    // Buscar usuario por username o email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }, // Permitir login con email también
        ],
      },
    });
    // Debug: log lookup result (no passwords)
    console.log(
      `🔐 [AUTH] login attempt for '${username}'. userFound=${!!user}`
    );
    if (user) {
      console.log("🔐 [AUTH] user record:", {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
      });
    }

    if (!user) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        error: "Usuario inactivo",
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.validatePassword(password);
    console.log(
      `🔐 [AUTH] password validation for userId=${user.id}: ${isValidPassword}`
    );

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Actualizar último login
    await user.update({ lastLogin: new Date() });

    // Registrar login en actividad
    await ActivityLogService.logUserLogin(user, req);

    // Generar token
    const token = generateToken(user.id);

    res.status(200).json({
      message: "Login exitoso",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Contraseña actual y nueva contraseña son requeridas",
      });
    }

    // Verificar contraseña actual
    const isValidPassword = await req.user.validatePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Contraseña actual incorrecta",
      });
    }

    // Actualizar contraseña
    await req.user.update({ password: newPassword });

    res.status(200).json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// Logout de usuario
const logout = async (req, res) => {
  try {
    const user = req.user;

    // Registrar logout en actividad
    await ActivityLogService.logUserLogout(user, req);

    res.status(200).json({
      message: "Logout exitoso",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  changePassword,
};
