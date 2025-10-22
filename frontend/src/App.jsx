import { useState, useEffect } from "react";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import ProfileUser from "./components/ProfileUser";
import { apiService } from "./services/apiService";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard"); // Nuevo estado para manejar la vista actual

  // Cargar datos de autenticación al iniciar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");
      const userRole = localStorage.getItem("userRole");

      if (token && userData && userRole) {
        try {
          // Verificar si el token sigue siendo válido
          await apiService.validateToken();

          // Si llegamos aquí, el token es válido
          const user = JSON.parse(userData);
          setCurrentUser(user.username);
          setUserRole(userRole);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token inválido o expirado:", error);
          // Limpiar datos si el token no es válido
          apiService.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (username, role, userData) => {
    // El login ya se maneja en el componente Login con apiService
    // Solo actualizamos el estado local - asegurar estructura consistente
    const userObject = userData || { username, role };
    setCurrentUser(userObject);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Usar el método de logout del servicio API
    apiService.logout();

    // Limpiar estado local
    setCurrentUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
    setCurrentView("dashboard"); // Resetear vista al logout
  };

  // Funciones de navegación
  const handleNavigateToProfile = () => {
    setCurrentView("profile");
  };

  const handleNavigateBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const renderDashboard = () => {
    // Si estamos en la vista de perfil, mostrar ProfileUser
    if (currentView === "profile") {
      return (
        <ProfileUser
          username={currentUser}
          onLogout={handleLogout}
          onNavigateBack={handleNavigateBackToDashboard}
        />
      );
    }

    // Vista de dashboard según el rol
    if (userRole === "admin") {
      return (
        <AdminDashboard
          username={
            typeof currentUser === "string"
              ? currentUser
              : currentUser?.username
          }
          user={
            typeof currentUser === "string"
              ? { username: currentUser, role: userRole }
              : currentUser
          }
          onLogout={handleLogout}
        />
      );
    } else {
      return (
        <UserDashboard
          username={
            typeof currentUser === "string"
              ? currentUser
              : currentUser?.username
          }
          user={
            typeof currentUser === "string"
              ? { username: currentUser, role: userRole }
              : currentUser
          }
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
        />
      );
    }
  };

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? renderDashboard() : <Login onLogin={handleLogin} />}
    </div>
  );
}

export default App;
