import {
  LogoutIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
} from "./icons/CustomIcons";
import modalService from "../services/modalService";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const ProfileUser = ({ username, onLogout, onNavigateBack }) => {
  // Estado para el dropdown del usuario
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Verificar preferencia guardada en localStorage
    const savedTheme = localStorage.getItem("theme");
    return (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Función para cambiar el modo oscuro
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");

    // Aplicar clase dark al elemento html
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // useEffect para aplicar el tema inicial
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Manejar el logout con confirmación
  const handleLogout = () => {
    try {
      modalService
        .showConfirmation(
          "¿Estás seguro?",
          "Cerrarás tu sesión actual",
          "Sí, cerrar sesión",
          "Cancelar"
        )
        .then((result) => {
          if (result.isConfirmed) {
            modalService.showSuccess(
              "¡Sesión cerrada!",
              "Has cerrado sesión exitosamente",
              1500
            );
            // Ejecutar el logout después de un breve delay
            setTimeout(() => {
              onLogout();
            }, 1500);
          }
        })
        .catch((error) => {
          console.error("Error en modal:", error);
          // Fallback: logout directo si hay problemas con el modal
          onLogout();
        });
    } catch (error) {
      console.error("Error en handleLogout:", error);
      // Fallback: logout directo
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Botón de volver */}
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Volver al Dashboard
                </button>
              )}

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mi Perfil
              </h1>
            </div>

            {/* Dark Mode Toggle y User Dropdown */}
            <div className="flex items-center space-x-4">
              {/* Toggle de modo oscuro */}
              <button
                onClick={toggleDarkMode}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title={
                  isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
                }
              >
                <div className="relative w-5 h-5">
                  {/* Animación de transición entre iconos */}
                  <SunIcon
                    className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 transform ${
                      isDarkMode
                        ? "opacity-0 rotate-90 scale-75"
                        : "opacity-100 rotate-0 scale-100"
                    }`}
                  />
                  <MoonIcon
                    className={`absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300 transform ${
                      isDarkMode
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-75"
                    }`}
                  />
                </div>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 focus:ring-indigo-500 focus:ring-offset-1 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hola, {username}
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-10">
                    <div className="py-1">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-300 font-medium">
                              {username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Usuario del sistema
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onNavigateBack) {
                              onNavigateBack();
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 flex items-center"
                        >
                          <svg
                            className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                          </svg>
                          Volver al Dashboard
                        </button>

                        <hr className="my-1 border-gray-100 dark:border-gray-700" />

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20 flex items-center"
                        >
                          <LogoutIcon className="mr-3 h-4 w-4 text-red-400" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay para cerrar dropdown al hacer click fuera */}
                {isDropdownOpen && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
          <div className="px-4 py-5 sm:p-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-300 font-bold text-3xl">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {username}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Usuario del sistema
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Miembro desde: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <hr className="mb-8 border-gray-200 dark:border-gray-600" />

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Personal */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Información Personal
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre de usuario
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {username}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {username}@sistema.gov
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rol
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-white">
                        Usuario estándar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas de actividad */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Estadísticas de Actividad
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                          <span className="text-white text-lg">📂</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                          Réplicas enviadas
                        </p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          12
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                          <span className="text-white text-lg">✅</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-900 dark:text-green-300">
                          Réplicas exitosas
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          10
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-600 rounded-md flex items-center justify-center">
                          <span className="text-white text-lg">⏳</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                          Réplicas pendientes
                        </p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          2
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-8 border-gray-200 dark:border-gray-600" />

            {/* Configuraciones */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Configuraciones
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Modo oscuro
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cambiar la apariencia de la interfaz
                    </p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                      isDarkMode ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Notificaciones por email
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recibir notificaciones sobre el estado de las réplicas
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

//Los propTypes son para validar las props que recibe el componente.
ProfileUser.propTypes = {
  username: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
  onNavigateBack: PropTypes.func,
};

export default ProfileUser;
