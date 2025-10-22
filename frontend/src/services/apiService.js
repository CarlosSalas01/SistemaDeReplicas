// Configuración de la API
const API_BASE_URL = "http://localhost:3002/api";

// Clase para manejar las llamadas a la API
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Método auxiliar para hacer peticiones HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autorización si existe
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug: log outgoing request for troubleshooting (mask password)
    try {
      const safeBody = config.body
        ? JSON.parse(config.body.toString())
        : undefined;
      if (safeBody && safeBody.password) safeBody.password = "***MASKED***";
      console.debug("🌐 [API] Request:", {
        url,
        method: config.method,
        headers: config.headers,
        body: safeBody,
      });
    } catch {
      console.debug("🌐 [API] Request (unable to parse body)", {
        url,
        method: config.method,
      });
    }

    try {
      const response = await fetch(url, config);

      // Si la respuesta no es ok, lanzar error
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `Error HTTP: ${response.status} ${response.statusText}`,
          };
        }
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error en petición API:", error);

      // Mejorar el mensaje de error para el usuario
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "No se puede conectar al servidor. Verifica que el backend esté ejecutándose."
        );
      }

      throw error;
    }
  }

  // Métodos de autenticación
  async login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async validateToken() {
    return this.request("/auth/validate-token", {
      method: "GET",
    });
  }

  async getProfile() {
    return this.request("/auth/profile", {
      method: "GET",
    });
  }

  async changePassword(passwordData) {
    return this.request("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  // Método para verificar si la API está disponible
  async checkHealth() {
    return this.request("/health", {
      method: "GET",
    });
  }

  // Método para limpiar token del localStorage
  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");
  }
}

// Exportar una instancia única del servicio
export const apiService = new ApiService();

// Exportar también la clase por si se necesita crear instancias personalizadas
export default ApiService;
