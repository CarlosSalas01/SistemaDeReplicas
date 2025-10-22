import { useState, useEffect, useRef } from "react";
import socketService from "../services/socketService";
import deploymentService from "../services/deploymentService";
import modalService from "../services/modalService";
// Importar iconos
import {
  LogoutIcon,
  ChevronDownIcon,
  UserIcon,
  EnvelopeIcon,
  SunIcon,
  MoonIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  RocketIconOutline,
  UpdateIcon,
  FolderIcon,
  SummaryIcon,
} from "./icons/CustomIcons";
import PropTypes from "prop-types";

const Dashboard = ({ username, user, onLogout }) => {
  // Estados básicos
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("publish");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Estados para subida de WAR
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    targetServer: "",
    applicationName: "",
    description: "",
    priority: "medium",
    environment: "development",
  });

  // Estados para solicitudes
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    deployed: 0,
  });

  const fileInputRef = useRef(null);

  // Función para cambiar el modo oscuro
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // ✨ Función para obtener el ícono según el estado (igual que en AdminDashboard)
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "reviewing":
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case "approved":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case "deploying":
        return <CloudArrowUpIcon className="w-5 h-5 text-purple-500" />;
      case "deployed":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Configurar Socket.IO cuando el componente se monta
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("authToken");
      if (token) {
        socketService.connect(token, user);
      }
    }

    // Cargar solicitudes si está en la pestaña correspondiente
    if (activeTab === "requests") {
      loadUserRequests();
    }

    return () => {
      // Cleanup si es necesario
      if (socketService.isConnected) {
        socketService.disconnect();
      }
    };
  }, [user, activeTab]);

  // Configurar listeners de Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (user && token) {
      // Listener para actualizaciones de status de solicitudes
      const handleRequestStatusUpdate = (data) => {
        console.log("🔄 Status update recibido en UserDashboard:", data);
        console.log("🔄 Data detallada:", {
          type: data.type,
          message: data.message,
          requestId: data.data?.id,
          newStatus: data.data?.status,
          currentTab: activeTab,
        });

        // Mostrar notificación al usuario
        if (data.message) {
          console.log("📢 Mostrando notificación:", data.message);
          modalService.showInfoMessage(
            "Actualización de solicitud",
            data.message
          );
        }

        // Recargar solicitudes si estamos en la pestaña de requests
        if (activeTab === "requests") {
          console.log(
            "🔄 Recargando solicitudes por estar en pestaña requests"
          );
          loadUserRequests();
        }

        // Actualizar el estado local de la solicitud específica
        if (data.data && data.data.id) {
          console.log(
            "🔄 Actualizando estado local para solicitud ID:",
            data.data.id
          );
          setRequests((prevRequests) => {
            const updatedRequests = prevRequests.map((request) =>
              request.id === data.data.id
                ? {
                    ...request,
                    status: data.data.status,
                    reviewComments: data.data.reviewComments,
                  }
                : request
            );
            console.log("🔄 Estado actualizado:", updatedRequests);
            return updatedRequests;
          });
        }
      };

      // Registrar el callback
      socketService.on("request_status_update", handleRequestStatusUpdate);

      return () => {
        // Cleanup: remover el callback cuando el componente se desmonte
        socketService.off("request_status_update", handleRequestStatusUpdate);
      };
    }
  }, [user, activeTab]);

  // Aplicar tema inicial
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Cargar solicitudes del usuario cuando cambia de pestaña
  useEffect(() => {
    console.log("🔄 useEffect triggered - activeTab:", activeTab);
    if (activeTab === "requests") {
      console.log("📋 Cargando solicitudes por cambio de pestaña...");
      loadUserRequests();
    }
  }, [activeTab]);

  // Cargar solicitudes del usuario
  const loadUserRequests = async () => {
    setLoadingRequests(true);
    try {
      console.log("📋 Cargando solicitudes del usuario...");
      const response = await deploymentService.getMyRequests();
      console.log("📋 Respuesta de getMyRequests:", response);
      console.log(
        "📋 Número de solicitudes recibidas:",
        response.data?.length || 0
      );

      setRequests(response.data || []);

      // Calcular estadísticas
      const pending = response.data.filter(
        (r) => r.status === "pending"
      ).length;
      const reviewing = response.data.filter(
        (r) => r.status === "reviewing"
      ).length;
      const approved = response.data.filter(
        (r) => r.status === "approved"
      ).length;
      const rejected = response.data.filter(
        (r) => r.status === "rejected"
      ).length;
      const deployed = response.data.filter(
        (r) => r.status === "deployed"
      ).length;

      setStats({
        total: response.data.length,
        pending,
        reviewing,
        approved,
        rejected,
        deployed,
      });

      console.log("📊 Estadísticas actualizadas:", {
        total: response.data.length,
        pending,
        reviewing,
        approved,
        rejected,
        deployed,
      });
    } catch (error) {
      console.error("❌ Error cargando solicitudes:", error);
      modalService.showError("Error al cargar las solicitudes");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Manejar logout
  const handleLogout = async () => {
    try {
      const result = await modalService.showConfirmation(
        "¿Cerrar sesión?",
        "¿Estás seguro de que quieres cerrar tu sesión?",
        "Sí, cerrar sesión",
        "Cancelar"
      );

      if (result.isConfirmed) {
        // Desconectar Socket.IO
        if (socketService.isConnected) {
          socketService.disconnect();
        }

        // Logout
        onLogout();

        modalService.showSuccess(
          "¡Sesión cerrada!",
          "Has cerrado sesión exitosamente",
          1500
        );
      }
    } catch (error) {
      console.error("Error en logout:", error);
      onLogout();
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        // 100MB
        modalService.showError(
          "Archivo muy grande",
          "El archivo no puede superar los 100MB"
        );
        return;
      }

      if (!file.name.endsWith(".war")) {
        modalService.showError(
          "Tipo de archivo incorrecto",
          "Solo se permiten archivos .war"
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Manejar subida de archivo
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      modalService.showError("Error", "Selecciona un archivo WAR");
      return;
    }

    if (!formData.targetServer) {
      modalService.showError("Error", "Selecciona un servidor destino");
      return;
    }

    if (!formData.applicationName) {
      modalService.showError("Error", "Ingresa el nombre de la aplicación");
      return;
    }

    setIsUploading(true);

    try {
      const requestData = {
        warFile: selectedFile,
        targetServer: formData.targetServer,
        applicationName: formData.applicationName,
        description: formData.description || "Sin descripción",
        priority: formData.priority,
        environment: formData.environment,
        username: username || user?.username || "usuario",
        userId: user?.id || 1,
        warFileName: selectedFile.name,
        warFileSize: selectedFile.size,
        createdAt: new Date().toISOString(),
      };

      console.log("📤 Subiendo archivo:", requestData);

      // Subir archivo
      const response = await deploymentService.uploadWAR(selectedFile, {
        targetServer: formData.targetServer,
        applicationName: formData.applicationName,
        description: formData.description,
        priority: formData.priority,
        environment: formData.environment,
      });

      console.log("✅ Respuesta del servidor:", response);

      // Emitir evento Socket.IO para notificar al administrador
      if (socketService.isConnected) {
        socketService.emit("new_deployment_request", {
          message: `Nueva solicitud de despliegue de ${username}`,
          data: requestData,
          type: "new_request",
          timestamp: new Date().toISOString(),
        });
        console.log("🚀 Notificación enviada al administrador:", requestData);
      }

      modalService.showSuccess(
        "¡Éxito!",
        "Archivo WAR subido correctamente. La solicitud se ha agregado a tu historial.",
        3000
      );

      // Limpiar formulario
      setSelectedFile(null);
      setFormData({
        targetServer: "",
        applicationName: "",
        description: "",
        priority: "medium",
        environment: "development",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Cambiar a la pestaña de solicitudes inmediatamente
      setActiveTab("requests");

      // Recargar solicitudes con múltiples intentos para asegurar que se actualice
      console.log("🔄 Recargando solicitudes del usuario...");

      const reloadWithRetry = async (attempts = 5, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          try {
            console.log(
              `📋 Intento ${i + 1} de ${attempts} para cargar solicitudes`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            await loadUserRequests();
            console.log("✅ Solicitudes recargadas exitosamente");
            break;
          } catch (error) {
            console.error(`❌ Error en intento ${i + 1}:`, error);
            if (i === attempts - 1) {
              console.error("❌ Falló después de todos los intentos");
              // Último recurso: recargar la página completa
              console.log("🔄 Recargando página como último recurso...");
              window.location.reload();
            }
          }
        }
      };

      // Ejecutar recarga con reintentos
      reloadWithRetry();
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      modalService.showError(
        "Error",
        error.message || "Error subiendo el archivo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Pestañas disponibles
  const tabs = [
    {
      id: "publish",
      name: "Subir WAR",
      icon: <CloudArrowUpIcon className="h-4 w-4" />,
    },
    {
      id: "requests",
      name: "Solicitudes",
      icon: <EnvelopeIcon className="h-4 w-4" />,
    },
  ];

  // Renderizar contenido de subida
  const renderUploadContent = () => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
      <div className="px-6 py-6">
        <div className="flex items-center mb-6">
          <CloudArrowUpIcon className="h-6 w-6 mr-3 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Subir Archivo WAR
          </h2>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Selección de archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivo WAR *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-indigo-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Seleccionar archivo</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept=".war"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="pl-1">o arrastra y suelta</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Solo archivos .war hasta 100MB
                </p>
              </div>
            </div>
            {selectedFile && (
              <div className="mt-2 text-sm text-gray-600 dark:text-indigo-400">
                <strong>Archivo seleccionado:</strong> {selectedFile.name} (
                {deploymentService.formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servidor destino *
              </label>
              <select
                value={formData.targetServer}
                onChange={(e) =>
                  handleFormChange("targetServer", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecciona un servidor...</option>
                <option value="Servidor de Desarrollo 1">
                  Servidor de Desarrollo 1
                </option>
                <option value="Servidor de Desarrollo 2">
                  Servidor de Desarrollo 2
                </option>
                <option value="Servidor de Testing">Servidor de Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de Aplicación *
              </label>
              <input
                type="text"
                value={formData.applicationName}
                onChange={(e) =>
                  handleFormChange("applicationName", e.target.value)
                }
                placeholder="Ej: Sistema Principal"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleFormChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ambiente
              </label>
              <select
                value={formData.environment}
                onChange={(e) =>
                  handleFormChange("environment", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="development">Desarrollo</option>
                <option value="testing">Testing</option>
                <option value="staging">Staging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              placeholder="Describe los cambios o mejoras incluidos en esta versión..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Botón de subida */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Subir WAR
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Renderizar contenido de solicitudes
  const renderRequestsContent = () => (
    <div className="space-y-6">
      {/* Estadísticas del usuario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <SummaryIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pendientes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pending}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                En revisión
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.reviewing}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Aprobadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approved}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rechazadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.rejected}
              </p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Desplegadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.deployed}
              </p>
            </div>
            <RocketIconOutline className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Historial de solicitudes de despliegue
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                console.log("🔄 Actualización manual solicitada");
                loadUserRequests();
              }}
              disabled={loadingRequests}
              className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loadingRequests ? (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <UpdateIcon className="h-4 w-4" />
              )}
              <span className="ml-1">Actualizar</span>
            </button>

            {/* Botón de Debug */}
            {/* <button
              onClick={async () => {
                console.log("🔍 DEBUG: Llamando endpoint de debug...");
                try {
                  const result =
                    await deploymentService.debugGetAllMyRequests();
                  console.log("🔍 DEBUG: Resultado completo:", result);
                } catch (error) {
                  console.error("❌ DEBUG: Error:", error);
                }
              }}
              className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              🔍 Debug
            </button> */}
          </div>
        </div>

        <div className="overflow-hidden">
          {loadingRequests ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Cargando solicitudes...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No hay solicitudes
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sube tu primer archivo WAR para comenzar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-gray-600 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(request.status)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {request.warFileName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {request.applicationName} → {request.targetServer}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          Tamaño:{" "}
                          {deploymentService.formatFileSize
                            ? deploymentService.formatFileSize(
                                request.warFileSize
                              )
                            : Math.round(request.warFileSize / 1024) + " KB"}
                        </span>
                        <span>
                          Prioridad:{" "}
                          {request.priority === "urgent"
                            ? "Urgente"
                            : request.priority === "high"
                            ? "Alta"
                            : request.priority === "medium"
                            ? "Media"
                            : request.priority === "low"
                            ? "Baja"
                            : request.priority}
                        </span>
                        <span>
                          Creado:{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {request.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {request.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          request.status === "pending"
                            ? "bg-yellow-300 text-yellow-800 border-yellow-300"
                            : request.status === "reviewing"
                            ? "bg-blue-300 text-blue-800 border border-blue-500"
                            : request.status === "approved"
                            ? "bg-green-300 text-green-800 border border-green-500"
                            : request.status === "rejected"
                            ? "bg-red-300 text-red-800 border border-red-500"
                            : request.status === "deploying"
                            ? "bg-purple-300 text-purple-800 border border-purple-300"
                            : request.status === "deployed"
                            ? "bg-purple-300 text-purple-800 border border-purple-300"
                            : request.status === "failed"
                            ? "bg-red-300 text-red-900 border border-red-400"
                            : "bg-gray-300 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {request.status === "pending"
                          ? "Pendiente"
                          : request.status === "reviewing"
                          ? "En revisión"
                          : request.status === "approved"
                          ? "Aprobado"
                          : request.status === "rejected"
                          ? "Rechazado"
                          : request.status === "deploying"
                          ? "Desplegando"
                          : request.status === "deployed"
                          ? "Desplegado"
                          : request.status === "failed"
                          ? "Falló"
                          : request.status}
                      </span>
                    </div>
                  </div>
                  {request.reviewComments && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Comentarios del administrador:</strong>{" "}
                        {request.reviewComments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sistema de Despliegue
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
                      {(username || user?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hola, {username || user?.username || "user"}
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
                              {(username || user?.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {username || user?.username || "Usuario"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Usuario del sistema
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
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

                {/* Overlay para cerrar dropdown */}
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "publish" && renderUploadContent()}
        {activeTab === "requests" && renderRequestsContent()}
      </main>
    </div>
  );
};

Dashboard.propTypes = {
  username: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Dashboard;
