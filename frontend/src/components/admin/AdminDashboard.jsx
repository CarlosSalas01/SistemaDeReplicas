import React, { useState, useEffect, useCallback } from "react";
import deploymentService from "../../services/deploymentService";
import modalService from "../../services/modalService";
import socketService from "../../services/socketService";
import NotificationBell from "../NotificationBell";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  UpdateIcon,
  SunIcon,
  MoonIcon,
  RocketIconOutline,
  LogoutIcon,
  ListBulletIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  SummaryIcon,
  CogIcon,
  TrashIcon,
} from "../icons/CustomIcons";

const AdminDashboard = ({ username, user, onLogout }) => {
  // Estados básicos
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Estados para solicitudes
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    deploying: 0,
    deployed: 0,
    failed: 0,
  });

  // Estados para notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estado para trackear nuevas solicitudes y resaltarlas
  // const [newRequestIds, setNewRequestIds] = useState(new Set());

  // Estado para resaltar una solicitud específica cuando se hace clic en notificación
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  // Estados para modal de detalles
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para filtros
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Funciones para manejar notificaciones
  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Función para manejar clic en notificación
  const handleNotificationClick = (notification) => {
    console.log("🔔 Clic en notificación:", notification);

    // Cambiar a la pestaña de solicitudes
    setActiveTab("requests");

    // Obtener el ID de la solicitud desde los datos de la notificación
    const requestId = notification.data?.id;

    if (requestId) {
      // Resaltar la solicitud específica
      setHighlightedRequestId(requestId);

      // Agregar también a newRequestIds para el efecto visual extra
      // setNewRequestIds((prev) => new Set([...prev, requestId]));

      // Quitar el resaltado después de 5 segundos
      setTimeout(() => {
        setHighlightedRequestId(null);
      }, 5000);

      // Quitar el efecto de nueva solicitud después de 8 segundos
      // setTimeout(() => {
      //   setNewRequestIds((prev) => {
      //     const newSet = new Set(prev);
      //     newSet.delete(requestId);
      //     return newSet;
      //   });
      // }, 8000);

      console.log("✨ Solicitud resaltada:", requestId);
    }

    // Marcar la notificación como leída
    handleMarkAsRead(notification.id);
  };

  // Aplicar tema inicial
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Función para agregar actividad
  const addActivity = useCallback((action, type = "info") => {
    const newActivity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      time: new Date().toLocaleTimeString(),
      type,
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
  }, []);

  // Cargar todas las solicitudes
  const loadAllRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      console.log("🔄 Cargando todas las solicitudes...");
      const response = await deploymentService.getAllRequests();
      console.log("📋 Respuesta del servidor:", response);
      console.log("📋 Datos recibidos:", response.data);

      setRequests(response.data);

      const totalRequests = response.data.length;
      const pendingCount = response.data.filter(
        (r) => r.status === "pending"
      ).length;
      const reviewingCount = response.data.filter(
        (r) => r.status === "reviewing"
      ).length;
      const approvedCount = response.data.filter(
        (r) => r.status === "approved"
      ).length;
      const rejectedCount = response.data.filter(
        (r) => r.status === "rejected"
      ).length;
      const deployingCount = response.data.filter(
        (r) => r.status === "deploying"
      ).length;
      const deployedCount = response.data.filter(
        (r) => r.status === "deployed"
      ).length;
      const failedCount = response.data.filter(
        (r) => r.status === "failed"
      ).length;

      setStats({
        total: totalRequests,
        pending: pendingCount,
        reviewing: reviewingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        deploying: deployingCount,
        deployed: deployedCount,
        failed: failedCount,
      });

      console.log("📊 Estadísticas actualizadas:", {
        total: totalRequests,
        pending: pendingCount,
        reviewing: reviewingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        deploying: deployingCount,
        deployed: deployedCount,
        failed: failedCount,
      });
    } catch (error) {
      console.error("❌ Error cargando solicitudes:", error);
      modalService.showError("Error al cargar las solicitudes");
      addActivity("Error al cargar solicitudes", "error");
    } finally {
      setLoadingRequests(false);
    }
  }, [addActivity]);

  // Configurar Socket.IO para notificaciones del administrador
  useEffect(() => {
    if (user) {
      console.log("🔍 AdminDashboard - User object:", user);
      const token = localStorage.getItem("authToken"); // Corregido: usar "authToken"
      console.log(
        "🔍 AdminDashboard - Token found:",
        token ? "✅ YES" : "❌ NO"
      );
      if (token) {
        console.log(
          "🔍 AdminDashboard - Conectando Socket.IO con rol:",
          user.role
        );
        socketService.connect(token, user);

        // Manejar nuevas solicitudes de despliegue
        const handleNewDeploymentRequest = (data) => {
          console.log("🔔 Nueva solicitud de despliegue recibida:", data);
          console.log("🔔 Data de la solicitud:", data.data);

          // Crear nueva notificación
          const newNotification = {
            id: Date.now(),
            title: `Nueva solicitud de ${data.data?.username || "usuario"}`,
            message: `${data.data?.applicationName || "Aplicación"} - ${
              data.data?.targetServer || "Servidor"
            }`,
            time: new Date().toLocaleTimeString(),
            type: data.data?.priority || "info",
            read: false,
            data: data.data,
          };

          // Agregar notificación al estado
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Agregar actividad
          addActivity(
            `Nueva solicitud: ${data.data?.applicationName} por ${data.data?.username}`,
            "info"
          );

          // 🔄 SIEMPRE actualizar la lista de solicitudes (no solo si está visible)
          loadAllRequests();
        };

        // Configurar callback para nuevas solicitudes
        socketService.on("new_deployment_request", handleNewDeploymentRequest);

        // Cleanup al desmontar
        return () => {
          socketService.off(
            "new_deployment_request",
            handleNewDeploymentRequest
          );
        };
      }
    }
  }, [user, activeTab, loadAllRequests, addActivity]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".relative")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Manejar revisión de solicitud
  const handleReviewRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      await deploymentService.reviewRequest(requestId, "reviewing");
      addActivity(`Iniciando revisión de solicitud ID: ${requestId}`, "info");
      modalService.showSuccess("Solicitud marcada como en revisión");
      loadAllRequests();
    } catch (error) {
      console.error("Error actualizando estado:", error);
      modalService.showError("Error al actualizar el estado");
      addActivity(`Error al revisar solicitud ID: ${requestId}`, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveRequest = async (requestId) => {
    const result = await modalService.showConfirmation(
      "¿Aprobar solicitud?",
      "¿Estás seguro de que deseas aprobar esta solicitud de despliegue?"
    );

    if (result.isConfirmed) {
      setProcessingId(requestId);
      try {
        await deploymentService.updateRequestStatus(requestId, "approved");
        addActivity(`Solicitud aprobada ID: ${requestId}`, "success");
        modalService.showSuccess("Solicitud aprobada exitosamente");
        loadAllRequests();
      } catch (error) {
        console.error("Error aprobando solicitud:", error);
        modalService.showError("Error al aprobar la solicitud");
        addActivity(`Error al aprobar solicitud ID: ${requestId}`, "error");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    const result = await modalService.showInput(
      "Rechazar solicitud",
      "Proporciona una razón para el rechazo:",
      "Razón del rechazo..."
    );

    if (result.isConfirmed && result.value) {
      setProcessingId(requestId);
      try {
        await deploymentService.updateRequestStatus(
          requestId,
          "rejected",
          result.value
        );
        addActivity(
          `Solicitud rechazada ID: ${requestId} - Razón: ${result.value}`,
          "warning"
        );
        modalService.showSuccess("Solicitud rechazada");
        loadAllRequests();
      } catch (error) {
        console.error("Error rechazando solicitud:", error);
        modalService.showError("Error al rechazar la solicitud");
        addActivity(`Error al rechazar solicitud ID: ${requestId}`, "error");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const _HANDLE_DEPLOY_REQUEST = async (requestId) => {
    const result = await modalService.showConfirmation(
      "¿Desplegar aplicación?",
      "¿Estás seguro de que deseas iniciar el despliegue de esta aplicación?"
    );

    if (result.isConfirmed) {
      setProcessingId(requestId);
      try {
        await deploymentService.updateRequestStatus(requestId, "deploying");
        addActivity(`Iniciando despliegue ID: ${requestId}`, "info");
        modalService.showSuccess("Despliegue iniciado");

        // Simular proceso de despliegue
        setTimeout(async () => {
          try {
            const success = Math.random() > 0.2; // 80% de probabilidad de éxito
            const finalStatus = success ? "deployed" : "failed";
            await deploymentService.updateRequestStatus(requestId, finalStatus);
            addActivity(
              `Despliegue ${
                success ? "completado" : "fallido"
              } ID: ${requestId}`,
              success ? "success" : "error"
            );
            loadAllRequests();
          } catch (error) {
            console.error("Error finalizando despliegue:", error);
            addActivity(
              `Error finalizando despliegue ID: ${requestId}`,
              "error"
            );
          }
        }, 5000);

        loadAllRequests();
      } catch (error) {
        console.error("Error iniciando despliegue:", error);
        modalService.showError("Error al iniciar el despliegue");
        addActivity(`Error al desplegar solicitud ID: ${requestId}`, "error");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleDownloadWar = async (requestId, filename) => {
    try {
      console.log("🔽 Iniciando descarga de archivo WAR, ID:", requestId);
      addActivity(
        `Iniciando descarga del archivo: ${
          filename || `solicitud-${requestId}.war`
        }`,
        "info"
      );

      const response = await deploymentService.downloadWar(requestId);
      console.log("📦 Respuesta de descarga:", response);

      // El servicio devuelve { blob, filename }
      const { blob, filename: serverFilename } = response;

      // Usar el nombre del servidor o fallback
      const downloadFilename =
        serverFilename || filename || `deployment-${requestId}.war`;

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename.replace(/"/g, ""); // Limpiar comillas si las hay
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addActivity(`Archivo WAR descargado: ${downloadFilename}`, "success");
      modalService.showSuccess(
        "Archivo descargado exitosamente",
        `${downloadFilename} descargado correctamente`
      );
    } catch (error) {
      console.error("❌ Error descargando archivo:", error);
      modalService.showError(
        "Error al descargar el archivo",
        error.message || "No se pudo descargar el archivo WAR"
      );
      addActivity(
        `Error descargando archivo: ${filename || `solicitud-${requestId}`}`,
        "error"
      );
    }
  };

  // Manejar logout con modal de confirmación
  const handleLogout = async () => {
    try {
      const result = await modalService.showConfirmation(
        "¿Cerrar sesión?",
        "¿Estás seguro de que quieres cerrar tu sesión?",
        "Sí, cerrar sesión",
        "Cancelar"
      );

      if (result.isConfirmed) {
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

  // Manejar apertura del modal de detalles
  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Manejar cierre del modal de detalles
  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  // Effects
  useEffect(() => {
    loadAllRequests();
    addActivity("Dashboard de administrador iniciado", "info");
  }, [loadAllRequests, addActivity]);

  useEffect(() => {
    if (activeTab === "requests" || activeTab === "overview") {
      loadAllRequests();
    }
  }, [activeTab, loadAllRequests]);

  // Función para filtrar solicitudes
  const getFilteredRequests = () => {
    let filtered = requests;

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Filtrar por prioridad
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.priority === priorityFilter
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((request) => {
        const applicationName = (
          request.applicationName ||
          request.title ||
          ""
        ).toLowerCase();
        const username = (
          request.User?.username ||
          request.username ||
          ""
        ).toLowerCase();
        const status = (request.status || "").toLowerCase();

        return (
          applicationName.includes(term) ||
          username.includes(term) ||
          status.includes(term)
        );
      });
    }

    return filtered;
  };

  // Función para obtener el texto del filtro
  const getFilterText = () => {
    const filteredRequests = getFilteredRequests();
    const count = filteredRequests.length;
    const totalCount = requests.length;

    let text = "";

    // Texto base según los filtros activos
    const activeFilters = [];

    if (statusFilter !== "all") {
      const statusNames = {
        pending: "pendientes",
        reviewing: "en revisión",
        approved: "aprobadas",
        rejected: "rechazadas",
        deploying: "desplegando",
        deployed: "desplegadas",
        failed: "fallidas",
      };
      activeFilters.push(statusNames[statusFilter] || statusFilter);
    }

    if (priorityFilter !== "all") {
      const priorityNames = {
        urgent: "urgentes",
        high: "alta prioridad",
        medium: "prioridad media",
        low: "baja prioridad",
      };
      activeFilters.push(priorityNames[priorityFilter] || priorityFilter);
    }

    if (activeFilters.length > 0) {
      text = `Mostrando solicitudes ${activeFilters.join(" y ")}`;
    } else {
      text = "Mostrando todas las solicitudes";
    }

    // Agregar información de búsqueda si hay término
    if (searchTerm.trim() !== "") {
      text += ` que contienen "${searchTerm.trim()}"`;
    }

    // Agregar contador
    text += ` (${count}${totalCount !== count ? ` de ${totalCount}` : ""})`;

    return text;
  };

  // Funciones de renderizado
  const getActivityIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case "warning":
        return <XCircleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Estadísticas */}
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

      {/* Actividad reciente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Actividad Reciente
          </h3>
        </div>
        <div className="p-6">
          {activities.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay actividad reciente
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="bg-slate-100 dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* <h3 className="text-lg font-semibold text-gray-600 dark:text-white">
            Todas las solicitudes de despliegue
          </h3> */}

          {/* Filtros de estado y búsqueda */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Buscador */}
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {/* Buscar: */}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Proyecto, usuario, estado..."
                  className="px-3 py-1 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                />
                <svg
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {/* Estado: */}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="reviewing">Revisando</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
                {/* <option value="deploying">Desplegando</option>
                <option value="deployed">Desplegados</option>
                <option value="failed">Falló</option> */}
              </select>
            </div>

            {/* Filtro de prioridad */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {/* Prioridad: */}
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            {/* Botón de limpiar filtros - solo aparece si hay filtros activos */}
            {(searchTerm.trim() !== "" ||
              statusFilter !== "all" ||
              priorityFilter !== "all") && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setSearchTerm("");
                  }}
                  title="Limpiar filtros"
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                >
                  <TrashIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400" />
                </button>
              </div>
            )}
          </div>

          {/* Botón de actualizar */}
          <div className="flex justify-end">
            <button
              onClick={loadAllRequests}
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
                <UpdateIcon className="h-4 w-4 text-purple-500 dark:text-gray-200" />
              )}
              <span className="ml-1 text-purple-500 dark:text-gray-200 py-0.4">
                Actualizar
              </span>
            </button>
          </div>
        </div>
      </div>

      {loadingRequests ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay solicitudes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Las solicitudes de despliegue aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden">
          {/* Información del filtro */}
          <div className="flex justify-end px-6 py-2 bg-gray-750 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getFilterText()}
            </p>
          </div>

          {/* Headers de la tabla estilo card */}
          <div
            className="bg-slate-100 dark:bg-gray-800 px-6 py-3 grid gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1.5fr 1fr 1.3fr 1fr" }}
          >
            <div className="text-center">SOLICITUD</div>
            <div className="text-center">USUARIO</div>
            <div className="text-center">PRIORIDAD</div>
            <div className="text-center">FECHA Y HORA</div>
            <div className="text-center">TAMAÑO</div>
            <div className="text-center">ESTADO</div>
            <div className="text-center">DETALLES</div>
          </div>

          {/* Lista de solicitudes como cards */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {getFilteredRequests().length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <ListBulletIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No hay solicitudes que coincidan con los filtros
                  </h3>
                  <p className="text-sm">
                    {searchTerm.trim() !== "" &&
                    (statusFilter !== "all" || priorityFilter !== "all")
                      ? `No se encontraron solicitudes que coincidan con todos los filtros aplicados.`
                      : searchTerm.trim() !== ""
                      ? `No se encontraron solicitudes que contengan "${searchTerm.trim()}".`
                      : statusFilter !== "all" || priorityFilter !== "all"
                      ? `No se encontraron solicitudes con los filtros aplicados.`
                      : "No se encontraron solicitudes de despliegue."}
                    <br />
                    <span className="text-xs mt-2 inline-block">
                      Intenta{" "}
                      {searchTerm.trim() !== ""
                        ? "cambiar el término de búsqueda o "
                        : ""}
                      {statusFilter !== "all" || priorityFilter !== "all"
                        ? "cambiar los filtros aplicados"
                        : "verificar que haya solicitudes disponibles"}
                      .
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              getFilteredRequests().map((request) => {
                // ✨ Determinar si esta solicitud está siendo resaltada por clic en notificación
                const isHighlighted = highlightedRequestId === request.id;

                return (
                  <div
                    key={request.id}
                    className={`
                    px-6 py-4 grid gap-4 items-center
                    ${
                      isHighlighted
                        ? // ? "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 ring-2 ring-yellow-300 dark:ring-yellow-500 shadow-lg border-l-4 border-l-yellow-400 dark:border-l-yellow-300"
                          // : isNewRequest
                          "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 ring-2 ring-blue-400 dark:ring-blue-800 animate-pulse shadow-lg"
                        : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }
                    transition-all duration-500 ease-in-out
                  `}
                    style={{
                      gridTemplateColumns: "2fr 1.2fr 1fr 1.5fr 1fr 1.3fr 1fr",
                    }}
                  >
                    {/* Columna 1: Nombre de la aplicación únicamente */}
                    <div className="text-center px-2 flex items-center justify-center min-h-[3rem]">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white multiline-text text-center max-w-full">
                        {request.applicationName ||
                          request.title ||
                          "Aplicación"}
                      </div>
                    </div>
                    {/* Columna 2: Usuario */}
                    <div className="text-center">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {request.User?.username ||
                          request.username ||
                          "usuario"}
                      </div>
                    </div>
                    {/* Columna 3: Prioridad */}
                    <div className="text-center">
                      <div className="tooltip-wrapper">
                        <span
                          className={`inline-flex w-4 h-4 rounded-full cursor-default transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                            request.priority === "urgent"
                              ? "bg-red-500"
                              : request.priority === "high"
                              ? "bg-orange-500"
                              : request.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></span>
                        <div className="tooltip-content">
                          {request.priority === "urgent"
                            ? "Prioridad: Urgente"
                            : request.priority === "high"
                            ? "Prioridad: Alta"
                            : request.priority === "medium"
                            ? "Prioridad: Media"
                            : "Prioridad: Baja"}
                        </div>
                      </div>
                    </div>{" "}
                    {/* Columna 4: Fecha y hora */}
                    <div className="text-center text-gray-900 dark:text-white">
                      {request.requestDate ||
                        new Date(request.createdAt).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                    {/* Columna 5: Tamaño */}
                    <div className="text-center text-gray-900 dark:text-white font-medium">
                      {request.warFileSize
                        ? deploymentService.formatFileSize
                          ? deploymentService.formatFileSize(
                              request.warFileSize
                            )
                          : Math.round(request.warFileSize / 1024) + " KB"
                        : "N/A"}
                    </div>
                    {/* Columna 6: Estado */}
                    <div className="text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
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
                            ? "bg-green-300 text-green-900 border border-green-400"
                            : request.status === "failed"
                            ? "bg-red-300 text-red-900 border border-red-400"
                            : "bg-gray-300 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {request.status === "pending"
                          ? "Pendiente"
                          : request.status === "reviewing"
                          ? "Revisando"
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
                    {/* Columna 7: Botón de Detalles */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleOpenDetails(request)}
                        className="inline-flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-700 text-white rounded-full transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        title="Ver detalles"
                      >
                        <CogIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
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
                Panel de Administración
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

              {/* Campanita de notificaciones */}
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAllNotifications}
                onNotificationClick={handleNotificationClick}
              />

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 focus:ring-indigo-500 focus:ring-offset-1 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                      {(username || user?.username || "Admin")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hola, {username || user?.username || "Admin"}
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
                              {(username || user?.username || "Admin")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {username || user?.username || "Administrador"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Administrador del sistema
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
            <button
              onClick={() => setActiveTab("overview")}
              className={`${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
            >
              <ListBulletIcon className="h-4 w-4" />
              <span>Resumen</span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`${
                activeTab === "requests"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
            >
              <EnvelopeIcon className="h-4 w-4" />
              <span>Solicitudes</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "requests" && renderRequests()}
      </main>

      {/* Modal de Detalles */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-800 text-white rounded-t-lg">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-white uppercase">
                  {selectedRequest.applicationName ||
                    selectedRequest.title ||
                    "APLICACIÓN"}
                </h3>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedRequest.status === "pending"
                      ? "bg-yellow-400 text-yellow-800 border border-yellow-800"
                      : selectedRequest.status === "reviewing"
                      ? "bg-blue-400 text-blue-900 border border-blue-900"
                      : selectedRequest.status === "approved"
                      ? "bg-green-400  text-green-800 border border-green-800"
                      : selectedRequest.status === "rejected"
                      ? "bg-red-300 text-red-800 border border-red-800"
                      : selectedRequest.status === "deploying"
                      ? "bg-purple-500 text-white"
                      : selectedRequest.status === "deployed"
                      ? "bg-green-600 text-white"
                      : selectedRequest.status === "failed"
                      ? "bg-red-600 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {selectedRequest.status === "pending"
                    ? "Pendiente"
                    : selectedRequest.status === "reviewing"
                    ? "Revisando"
                    : selectedRequest.status === "approved"
                    ? "Aprobado"
                    : selectedRequest.status === "rejected"
                    ? "Rechazado"
                    : selectedRequest.status === "deploying"
                    ? "Desplegando"
                    : selectedRequest.status === "deployed"
                    ? "Desplegado"
                    : selectedRequest.status === "failed"
                    ? "Falló"
                    : selectedRequest.status}
                </span>
              </div>
              <button
                onClick={handleCloseDetails}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 bg-slate-700 text-white space-y-6">
              {/* Layout en dos columnas como la imagen */}
              <div className="grid grid-cols-2 gap-8">
                {/* Columna Izquierda */}
                <div className="space-y-3">
                  <div>
                    <span className="text-white font-medium">Archivo: </span>
                    <span className="text-gray-300">
                      {selectedRequest.warFileName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Servidor: </span>
                    <span className="text-gray-300">
                      {selectedRequest.targetServer || "Servidor de testing"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Ambiente: </span>
                    <span className="text-gray-300">
                      {selectedRequest.environment === "development"
                        ? "Desarrollo"
                        : selectedRequest.environment === "testing"
                        ? "Testing"
                        : selectedRequest.environment === "staging"
                        ? "Pruebas"
                        : selectedRequest.environment === "production"
                        ? "Producción"
                        : selectedRequest.environment || "Testing"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Prioridad: </span>
                    <span
                      className={`font-medium ${
                        selectedRequest.priority === "urgent"
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {selectedRequest.priority === "urgent"
                        ? "Urgente"
                        : selectedRequest.priority === "high"
                        ? "Alta"
                        : selectedRequest.priority === "medium"
                        ? "Media"
                        : selectedRequest.priority === "low"
                        ? "Baja"
                        : selectedRequest.priority || "Media"}
                    </span>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-3">
                  <div>
                    <span className="text-white font-medium">Descripción:</span>
                    <div className="text-gray-300 mt-1">
                      {selectedRequest.description || "Sin descripción"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <hr className="border-gray-600" />

              {/* Información adicional en una sola fila */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white font-medium">Fecha y hora: </span>
                  <div className="text-gray-300">
                    {selectedRequest.requestDate ||
                      new Date(selectedRequest.createdAt).toLocaleString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                  </div>
                </div>
                <div>
                  <span className="text-white font-medium">Usuario: </span>
                  <div className="text-gray-300">
                    {selectedRequest.User?.username ||
                      selectedRequest.username ||
                      "usuario"}
                  </div>
                </div>
                <div>
                  <span className="text-white font-medium">Tamaño: </span>
                  <div className="text-gray-300">
                    {selectedRequest.warFileSize
                      ? deploymentService.formatFileSize
                        ? deploymentService.formatFileSize(
                            selectedRequest.warFileSize
                          )
                        : Math.round(selectedRequest.warFileSize / 1024) + " KB"
                      : "33.28 MB"}
                  </div>
                </div>
              </div>

              <hr className="border-gray-600" />

              {/* Botones de Acción */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  {(selectedRequest.status === "pending" ||
                    selectedRequest.status === "reviewing") && (
                    <button
                      onClick={() => {
                        handleApproveRequest(selectedRequest.id);
                        handleCloseDetails();
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="inline-flex items-center px-4 py-2 bg-green-400  text-green-800 border hover:bg-green-500 hover:text-green-900 border-green-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                      Aceptar
                    </button>
                  )}

                  {(selectedRequest.status === "pending" ||
                    selectedRequest.status === "reviewing") && (
                    <button
                      onClick={() => {
                        handleRejectRequest(selectedRequest.id);
                        handleCloseDetails();
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="inline-flex items-center px-4 py-2 bg-red-400 text-red-900 border border-red-800 hover:bg-red-700 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                      Rechazar
                    </button>
                  )}

                  {selectedRequest.status === "pending" && (
                    <button
                      onClick={() => {
                        handleReviewRequest(selectedRequest.id);
                        handleCloseDetails();
                      }}
                      disabled={processingId === selectedRequest.id}
                      className="inline-flex items-center px-4 py-2 bg-blue-300 hover:bg-blue-400 text-blue-800 hover:text-blue-900 border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                      Revisión
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleDownloadWar(
                        selectedRequest.id,
                        selectedRequest.warFileName || selectedRequest.warFile
                      )
                    }
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-900 text-indigo-100 border-indigo-800 rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    Descargar
                  </button>
                </div>

                <button
                  onClick={handleCloseDetails}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-900 text-white rounded-md transition-colors duration-200 text-sm font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
