import Swal from "sweetalert2";

// Función para detectar si el modo oscuro está activo
const isDarkMode = () => {
  return document.documentElement.classList.contains("dark");
};

// Configuración base común para todos los modales con soporte para modo oscuro
const getBaseModalConfig = () => {
  const darkMode = isDarkMode();

  return {
    width: 400,
    padding: "2em",
    heightAuto: true,
    customClass: {
      popup: darkMode
        ? "bg-gray-800 rounded-lg shadow-xl border border-gray-700"
        : "bg-white rounded-lg shadow-xl border-0",
      title: darkMode
        ? "text-white font-semibold text-xl"
        : "text-gray-900 font-semibold text-xl",
      content: darkMode ? "text-gray-300 text-base" : "text-gray-600 text-base",
      confirmButton: darkMode
        ? "bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 mr-2"
        : "bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 mr-2",
      cancelButton: darkMode
        ? "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        : "bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200",
      actions: "gap-2",
    },
    didOpen: () => {
      const popup = Swal.getPopup();
      if (popup) {
        popup.style.fontFamily = "inherit";
        // Aplicar estilos adicionales para modo oscuro
        if (darkMode) {
          popup.style.backgroundColor = "#1F2937"; // gray-800
          popup.style.color = "#F9FAFB"; // gray-50
        }
      }
    },
  };
};

// Modal de confirmación para cerrar sesión
export const showLogoutConfirmation = (onConfirm) => {
  const baseConfig = getBaseModalConfig();

  return Swal.fire({
    ...baseConfig,
    title: "¿Estás seguro?",
    text: "Cerrarás tu sesión actual",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3B82F6", // blue-500
    cancelButtonColor: "#EF4444", // red-500
    confirmButtonText: "Cerrar sesión",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      showSuccessMessage(
        "¡Sesión cerrada!",
        "Has cerrado sesión exitosamente",
        1500
      );
      setTimeout(() => {
        onConfirm();
      }, 1500);
    }
  });
};

// Modal de confirmación para enviar réplica
export const showSendReplicaConfirmation = (onConfirm) => {
  const baseConfig = getBaseModalConfig();
  const darkMode = isDarkMode();

  return Swal.fire({
    ...baseConfig,
    title: "¿Estás seguro?",
    text: "Enviarás la réplica seleccionada",
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Enviar réplica",
    cancelButtonText: "Cancelar",
    customClass: {
      ...baseConfig.customClass,
      confirmButton: darkMode
        ? "bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 mr-2"
        : "bg-indigo-600 hover:bg-indigo-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 mr-2",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      showSuccessMessage(
        "¡Solicitud enviada!",
        "Su solicitud será revisada por el administrador del sistema",
        2000
      );
      setTimeout(() => {
        onConfirm();
      }, 2000);
    }
  });
};

// Modal de mensaje de éxito reutilizable
export const showSuccessMessage = (title, text, timer = 1500) => {
  const darkMode = isDarkMode();

  return Swal.fire({
    title,
    text,
    icon: "success",
    timer,
    showConfirmButton: false,
    customClass: {
      popup: darkMode
        ? "bg-gray-800 rounded-lg shadow-xl border border-gray-700"
        : "bg-white rounded-lg shadow-xl border-0",
      title: darkMode
        ? "text-green-400 font-semibold text-xl"
        : "text-green-600 font-semibold text-xl",
      content: darkMode ? "text-gray-300 text-base" : "text-gray-600 text-base",
    },
    didOpen: () => {
      const popup = Swal.getPopup();
      if (popup && darkMode) {
        popup.style.backgroundColor = "#1F2937"; // gray-800
        popup.style.color = "#F9FAFB"; // gray-50
      }
    },
  });
};

// Modal de error reutilizable
export const showErrorMessage = (title, text) => {
  const baseConfig = getBaseModalConfig();
  const darkMode = isDarkMode();

  return Swal.fire({
    ...baseConfig,
    title,
    text,
    icon: "error",
    confirmButtonText: "Entendido",
    customClass: {
      ...baseConfig.customClass,
      title: darkMode
        ? "text-red-400 font-semibold text-xl"
        : "text-red-600 font-semibold text-xl",
      confirmButton: darkMode
        ? "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        : "bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200",
    },
  });
};

// Modal de información reutilizable
export const showInfoMessage = (title, text) => {
  const baseConfig = getBaseModalConfig();
  const darkMode = isDarkMode();

  return Swal.fire({
    ...baseConfig,
    title,
    text,
    icon: "info",
    confirmButtonText: "Entendido",
    customClass: {
      ...baseConfig.customClass,
      title: darkMode
        ? "text-blue-400 font-semibold text-xl"
        : "text-blue-600 font-semibold text-xl",
      confirmButton: darkMode
        ? "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        : "bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200",
    },
  });
};

// Modal de confirmación genérico
export const showConfirmation = (
  title,
  text,
  confirmText = "Confirmar",
  cancelText = "Cancelar"
) => {
  const baseConfig = getBaseModalConfig();

  return Swal.fire({
    ...baseConfig,
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3B82F6", // blue-500
    cancelButtonColor: "#EF4444", // red-500
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

// Modal de éxito genérico
export const showSuccess = (title, text, timer = 1500) => {
  return showSuccessMessage(title, text, timer);
};

// Modal de error genérico
export const showError = (title, text) => {
  return showErrorMessage(title, text);
};

// Modal de input genérico
export const showInput = async (title, text, placeholder = "") => {
  return await Swal.fire({
    ...getBaseModalConfig(),
    title,
    text,
    input: "textarea",
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => {
      if (!value || value.trim() === "") {
        return "Este campo es obligatorio";
      }
    },
  });
};

// Export default como objeto con todas las funciones
const modalService = {
  showLogoutConfirmation,
  showSendReplicaConfirmation,
  showSuccessMessage,
  showErrorMessage,
  showInfoMessage,
  showConfirmation,
  showSuccess,
  showError,
  showInput,
};

export default modalService;
