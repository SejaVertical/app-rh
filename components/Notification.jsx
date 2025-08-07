import { useEffect } from "react";

const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] min-w-[220px] max-w-xs rounded-lg px-4 py-3 shadow-lg transition-all duration-300
        ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}
      `}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-lg font-bold text-white hover:text-gray-200 focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification; 