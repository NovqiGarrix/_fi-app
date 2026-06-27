import { useMutation } from "@tanstack/react-query";
import { Notifier, NotifierComponents } from "react-native-notifier";
import { sync } from "@/lib/sync";

export function useSync() {
  return useMutation({
    mutationKey: ["sync"],
    mutationFn: sync,
    onSuccess: () => {
      Notifier.showNotification({
        title: "Synced",
        description: "Your data is up to date with the server.",
        Component: NotifierComponents.Alert,
        componentProps: { alertType: "success" },
      });
    },
    onError: (error) => {
      console.error(error);
      Notifier.showNotification({
        title: "Sync failed",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't sync your data. Please try again.",
        Component: NotifierComponents.Alert,
        componentProps: { alertType: "error" },
      });
    },
  });
}
