
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive";

type ToastOptions = {
  description?: string;
  variant?: ToastVariant;
};

export const toast = (title: string, options?: ToastOptions) => {
  const { description, variant } = options || {};
  
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
    });
  }
  
  return sonnerToast(title, {
    description,
  });
};
