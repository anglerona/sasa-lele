import * as React from "react";
import { ToastProvider, ToastViewport, useToast as useShadcnToast } from "./toaster";

export function useToast() {
  return useShadcnToast();
}

export function ToastRoot({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
