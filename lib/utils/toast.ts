import { toast } from "@/lib/hooks/use-toast";

type ToastOptions = {
  id?: string;
  duration?: number;
};

export const toastUtils = {
  success: (title: string, description?: string, options?: ToastOptions) => {
    toast({
      title,
      description,
      variant: "success",
      ...options,
    });
  },

  error: (title: string, description?: string, options?: ToastOptions) => {
    toast({
      title,
      description,
      variant: "destructive",
      ...options,
    });
  },

  warning: (title: string, description?: string, options?: ToastOptions) => {
    toast({
      title,
      description,
      variant: "warning",
      ...options,
    });
  },

  info: (title: string, description?: string, options?: ToastOptions) => {
    toast({
      title,
      description,
      variant: "info",
      ...options,
    });
  },
};
