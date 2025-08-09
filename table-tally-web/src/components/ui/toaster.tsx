// shadcn/ui ToastProvider, ToastViewport, and useToast implementation
import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "default";
export interface ToastProps {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

const ToastContext = createContext<{
  toast: (props: ToastProps) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);
  const toast = useCallback((props: ToastProps) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...props, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, props.duration || 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function ToastViewport({ toasts }: { toasts: Array<ToastProps & { id: number }> }) {
  return (
    <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg shadow-lg px-4 py-3 text-sm bg-white border flex flex-col min-w-[220px] max-w-xs
            ${t.type === "success" ? "border-green-500 text-green-700" : ""}
            ${t.type === "error" ? "border-red-500 text-red-700" : ""}
            ${t.type === "info" ? "border-blue-500 text-blue-700" : ""}
          `}
        >
          {t.title && <div className="font-semibold mb-1">{t.title}</div>}
          {t.description && <div>{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
