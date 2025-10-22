import { useState } from "react";
import { InegiLogo, SpinnerIcon, ErrorIcon } from "./icons/CustomIcons";
import { apiService } from "../services/apiService";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validación básica
    if (!formData.username || !formData.password) {
      setError("Por favor, completa todos los campos");
      setIsLoading(false);
      return;
    }

    try {
      // Llamada real a la API
      const response = await apiService.login({
        username: formData.username,
        password: formData.password,
      });

      // Guardar información del usuario en localStorage
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userRole", response.user.role);
      localStorage.setItem("userData", JSON.stringify(response.user));

      // Notificar al componente padre sobre el login exitoso
      onLogin(response.user.username, response.user.role, response.user);
    } catch (error) {
      console.error("Error en login:", error);
      setError(
        error.message ||
          "Error de conexión. Verifica que el servidor esté ejecutándose."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center w-full">
        <div className="bg-slate-900 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center w-full max-w-md">
          <div className="w-full space-y-8 flex flex-col items-center">
            <div>
              {/* <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div> */}
              {/* <div className="flex justify-center">
                <InegiLogo className="h-9 w-auto filter brightness-0 invert" />
              </div> */}
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
                Sistema de réplicas
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Accede a tu cuenta para continuar
              </p>
            </div>

            <form className="mt-8 space-y-6 w-full" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="username" className="sr-only">
                    Usuario
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full my-3 px-3 py-2 border-0 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-0 focus:border-2 focus:border-indigo-700 focus:z-10 sm:text-sm placeholder:text-center"
                    placeholder="Usuario"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-md relative block w-full my-3 px-3 py-2 border-0 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-0 focus:border-2 focus:border-indigo-700 focus:z-10 sm:text-sm placeholder:text-center"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-900 p-2">
                  <div className="flex items-center justify-center">
                    <ErrorIcon className="h-5 w-5 text-red-400 mx-2" />
                    <h3 className="text-sm font-medium text-red-400 text-center">
                      {error}
                    </h3>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <SpinnerIcon className="-ml-1 mr-3 h-5 w-5 text-white" />
                      Iniciando sesión...
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>
              </div>

              {/* <div className="text-center">
                <p className="text-sm text-gray-600">Credenciales de prueba:</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>
                    <strong>Usuario:</strong> admin |{" "}
                    <strong>Contraseña:</strong> admin123 (Rol Admin)
                  </p>
                  <p>
                    <strong>Usuario:</strong> user |{" "}
                    <strong>Contraseña:</strong> user123 (Rol Usuario)
                  </p>
                </div>
              </div> */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
