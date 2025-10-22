import React, { useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { BellIcon as BellSolidIcon } from "@heroicons/react/24/solid";

const NotificationBell = ({
  notifications = [],
  unreadCount = 0,
  onClearAll,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
    setIsOpen(false);
  };

  const handleNotificationClick = (notification) => {
    // Llamar la función de clic en notificación si existe
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    // Cerrar el dropdown
    setIsOpen(false);
  };

  // Función para obtener el color según la prioridad más alta de notificaciones no leídas
  const getHighestPriorityColor = () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return null;

    // Determinar la prioridad más alta (urgent > high > medium > low)
    const hasUrgent = unreadNotifications.some((n) => n.type === "urgent");
    const hasHigh = unreadNotifications.some((n) => n.type === "high");
    const hasMedium = unreadNotifications.some((n) => n.type === "medium");

    if (hasUrgent) {
      return {
        bell: "text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30",
        badge: "bg-red-500 animate-bounce",
      };
    } else if (hasHigh) {
      return {
        bell: "text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20 dark:hover:bg-orange-900/30",
        badge: "bg-orange-500 animate-pulse",
      };
    } else if (hasMedium) {
      return {
        bell: "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30",
        badge: "bg-yellow-500 animate-pulse",
      };
    } else {
      // Para prioridad "low" o cualquier otro tipo
      return {
        bell: "text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30",
        badge: "bg-green-500 animate-pulse",
      };
    }
  };

  const priorityColors = getHighestPriorityColor();

  return (
    <div className="relative">
      {/* Botón de campanita */}
      <button
        onClick={handleToggle}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          unreadCount > 0 && priorityColors
            ? priorityColors.bell
            : unreadCount > 0
            ? "text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
        }`}
        title={`${unreadCount} notificaciones no leídas`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {/* Badge contador */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 h-5 w-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${
              priorityColors ? priorityColors.badge : "bg-red-500 animate-pulse"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Notificaciones
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Limpiar todas
                </button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {unreadCount} sin leer
              </p>
            )}
          </div>
          {/* Lista de notificaciones */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notification.read
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400"
                      : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icono y contenido */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.read
                          ? "bg-blue-500 dark:bg-blue-400"
                          : "bg-gray-300 dark:bg-gray-500"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          !notification.read
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {notification.title}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>

                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{notification.time}</span>
                        {notification.type && (
                          <>
                            <span className="mx-1">•</span>
                            <span
                              className={`px-2 py-1 rounded-full ${
                                notification.type === "urgent"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : notification.type === "warning"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              {notification.type === "urgent"
                                ? "Urgente"
                                : notification.type === "warning"
                                ? "Advertencia"
                                : "Info"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationBell;
