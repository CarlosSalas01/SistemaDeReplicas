const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3002/api";

class DeploymentService {
  /**
   * Obtener token del localStorage
   */
  getAuthToken() {
    const token = localStorage.getItem("authToken");
    console.log("🔍 getAuthToken - Token present:", token ? "✅ YES" : "❌ NO");
    return token;
  }

  /**
   * Configurar headers de autenticación
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  /**
   * Configurar headers para subida de archivos
   */
  getFileUploadHeaders() {
    const token = this.getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  /**
   * Manejar respuesta de la API
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    return await response.json();
  }

  // ========== MÉTODOS PARA USUARIOS ==========

  /**
   * Subir archivo WAR
   * @param {File} file - Archivo WAR
   * @param {Object} metadata - Metadatos del despliegue
   */
  async uploadWAR(file, metadata) {
    const formData = new FormData();
    formData.append("warFile", file);
    formData.append("targetServer", metadata.targetServer);
    formData.append("applicationName", metadata.applicationName);
    formData.append("description", metadata.description || "");
    formData.append("priority", metadata.priority || "medium");
    formData.append("environment", metadata.environment || "development");

    console.log("🔍 uploadWAR - Metadata being sent:", metadata);
    console.log("🔍 uploadWAR - File:", file.name, file.size);

    const response = await fetch(`${API_BASE_URL}/deployment/upload`, {
      method: "POST",
      headers: this.getFileUploadHeaders(),
      body: formData,
    });

    const result = await this.handleResponse(response);
    console.log("🔍 uploadWAR - Server response:", result);
    console.log("🔍 uploadWAR - Response data:", result.data);

    return result;
  }

  /**
   * Obtener solicitudes del usuario actual
   * @param {Object} params - Parámetros de consulta
   */
  async getMyRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/deployment/my-requests${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("🔍 getMyRequests - URL:", url);
    console.log("🔍 getMyRequests - Headers:", this.getAuthHeaders());

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    const result = await this.handleResponse(response);
    console.log("🔍 getMyRequests - Response:", result);
    console.log("🔍 getMyRequests - Data array:", result.data);

    return result;
  }

  /**
   * Debug: Obtener TODAS las solicitudes del usuario (sin paginación)
   */
  async debugGetAllMyRequests() {
    const url = `${API_BASE_URL}/deployment/debug/all-my-requests`;

    console.log("🔍 debugGetAllMyRequests - URL:", url);
    console.log("🔍 debugGetAllMyRequests - Headers:", this.getAuthHeaders());

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      console.log(
        "🔍 debugGetAllMyRequests - Response status:",
        response.status
      );
      console.log("🔍 debugGetAllMyRequests - Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(
          "🔍 debugGetAllMyRequests - Error response text:",
          errorText
        );
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("🔍 debugGetAllMyRequests - Response:", result);

      return result;
    } catch (error) {
      console.error("🔍 debugGetAllMyRequests - Fetch error:", error);
      throw error;
    }
  }

  /**
   * Super Debug: Obtener TODAS las solicitudes de TODOS los usuarios
   */
  async superDebugGetAllRequests() {
    const url = `${API_BASE_URL}/deployment/debug/super-all-requests`;

    console.log("🔍 superDebugGetAllRequests - URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    const result = await this.handleResponse(response);
    console.log("🔍 superDebugGetAllRequests - Response:", result);

    return result;
  }

  /**
   * Debug: Obtener todas las rutas registradas en el servidor
   */
  async debugGetRoutes() {
    const url = `${API_BASE_URL}/debug/routes`;

    console.log("🔍 debugGetRoutes - URL:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      console.log("🔍 debugGetRoutes - Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("🔍 debugGetRoutes - Error response text:", errorText);
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("🔍 debugGetRoutes - Response:", result);

      return result;
    } catch (error) {
      console.error("🔍 debugGetRoutes - Fetch error:", error);
      throw error;
    }
  }

  /**
   * Obtener detalles de una solicitud específica
   * @param {number} id - ID de la solicitud
   */
  async getRequestById(id) {
    const response = await fetch(`${API_BASE_URL}/deployment/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  // ========== MÉTODOS PARA ADMINISTRADORES ==========

  /**
   * Obtener todas las solicitudes de despliegue (admin)
   * @param {Object} params - Parámetros de consulta
   */
  async getAllRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/deployment/admin/requests${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  /**
   * Revisar solicitud (aprobar/rechazar)
   * @param {number} id - ID de la solicitud
   * @param {string} status - 'approved' o 'rejected'
   * @param {string} comments - Comentarios del admin
   */
  async reviewRequest(id, status, comments = "") {
    const response = await fetch(
      `${API_BASE_URL}/deployment/admin/${id}/review`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          status,
          comments,
        }),
      }
    );

    return await this.handleResponse(response);
  }

  /**
   * Actualizar estado de solicitud (método alternativo)
   * @param {number} id - ID de la solicitud
   * @param {string} status - Nuevo estado
   * @param {string} comments - Comentarios opcionales
   */
  async updateRequestStatus(id, status, comments = "") {
    return await this.reviewRequest(id, status, comments);
  }

  /**
   * Iniciar despliegue (admin)
   * @param {number} id - ID de la solicitud
   */
  async startDeployment(id) {
    const response = await fetch(
      `${API_BASE_URL}/deployment/admin/${id}/deploy`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );

    return await this.handleResponse(response);
  }

  /**
   * Descargar archivo WAR (admin)
   * @param {number} id - ID de la solicitud
   */
  async downloadWAR(id) {
    const response = await fetch(
      `${API_BASE_URL}/deployment/admin/${id}/download`,
      {
        method: "GET",
        headers: this.getFileUploadHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // Retornar el blob y el nombre del archivo
    const blob = await response.blob();
    const filename =
      response.headers.get("Content-Disposition")?.split("filename=")[1] ||
      "download.war";

    return { blob, filename };
  }

  /**
   * Descargar archivo WAR (alias para downloadWAR)
   * @param {number} id - ID de la solicitud
   */
  async downloadWar(id) {
    return await this.downloadWAR(id);
  }

  /**
   * Obtener estadísticas de solicitudes (admin)
   */
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/deployment/admin/stats`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  /**
   * Obtener logs de actividad (admin)
   * @param {Object} params - Parámetros de consulta
   */
  async getActivityLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/deployment/admin/activity-logs${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  /**
   * Obtener estadísticas de actividad (admin)
   * @param {string} period - Período de tiempo ('today', 'week', 'month')
   */
  async getActivityStats(period = "today") {
    const response = await fetch(
      `${API_BASE_URL}/deployment/admin/activity-stats?period=${period}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    return await this.handleResponse(response);
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Formatear tamaño de archivo
   * @param {number} bytes - Tamaño en bytes
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Obtener color según el estado
   * @param {string} status - Estado de la solicitud
   */
  getStatusColor(status) {
    const colors = {
      pending: "yellow",
      reviewing: "blue",
      approved: "green",
      rejected: "red",
      deploying: "orange",
      deployed: "green",
      failed: "red",
    };
    return colors[status] || "gray";
  }

  /**
   * Obtener texto en español según el estado
   * @param {string} status - Estado de la solicitud
   */
  getStatusText(status) {
    const texts = {
      pending: "Pendiente",
      reviewing: "En Revisión",
      approved: "Aprobado",
      rejected: "Rechazado",
      deploying: "Desplegando",
      deployed: "Desplegado",
      failed: "Falló",
    };
    return texts[status] || status;
  }

  /**
   * Obtener icono según el estado
   * @param {string} status - Estado de la solicitud
   */
  getStatusIcon(status) {
    const icons = {
      pending: "⏳",
      reviewing: "👀",
      approved: "✅",
      rejected: "❌",
      deploying: "🚀",
      deployed: "🎉",
      failed: "💥",
    };
    return icons[status] || "📄";
  }
}

// Exportar instancia única
const deploymentService = new DeploymentService();
export default deploymentService;
