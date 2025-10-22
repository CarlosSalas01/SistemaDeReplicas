const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Configuración de almacenamiento para archivos WAR
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads", "wars");

    try {
      // Crear directorio si no existe
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);

    // Formato: originalname_timestamp.extension
    const uniqueName = `${basename}_${timestamp}${extension}`;
    cb(null, uniqueName);
  },
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  // Aceptar solo archivos .war
  if (
    file.mimetype === "application/java-archive" ||
    file.originalname.toLowerCase().endsWith(".war")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos .war"), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
  },
});

// Función para eliminar un archivo
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    return false;
  }
};

// Función para verificar si un archivo existe
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Función para obtener información de un archivo
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  upload,
  deleteFile,
  fileExists,
  getFileInfo,
};
