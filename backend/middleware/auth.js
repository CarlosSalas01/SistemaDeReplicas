const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Token de acceso requerido",
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Usuario no válido o inactivo",
      });
    }

    // Agregar usuario al request
    req.user = user;
    console.log("🔐 [AUTH] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    });
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        error: "Token inválido",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        error: "Token expirado",
      });
    }

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// Middleware para verificar roles específicos
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "No tienes permisos para acceder a este recurso",
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
