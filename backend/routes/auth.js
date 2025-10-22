const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

// Rutas públicas (no requieren autenticación)
router.post("/register", register);
router.post("/login", login);

// Rutas protegidas (requieren autenticación)
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);
router.put("/change-password", authenticateToken, changePassword);

// Ruta para validar token
router.get("/validate-token", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Token válido",
    user: req.user.toJSON(),
  });
});

module.exports = router;
