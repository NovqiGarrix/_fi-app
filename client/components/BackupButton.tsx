import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Notifier, NotifierComponents } from "react-native-notifier";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { type BackupResult, saveBackupToDevice } from "@/lib/backup";
import {
  categoryCollection,
  expenseCollection,
  incomeCollection,
} from "@/lib/db";
import { API_URL } from "@/utils/constants";

export function BackupButton() {
  const { mutate: backup, isPending } = useMutation({
    mutationKey: ["backup"],
    mutationFn: async (): Promise<BackupResult> => {
      const [categories, expenses, incomes] = await Promise.all([
        categoryCollection.query().fetch(),
        expenseCollection.query().fetch(),
        incomeCollection.query().fetch(),
      ]);

      const payload = {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          color: category.color,
        })),
        expenses: expenses.map((expense) => ({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          categoryId: expense.category.id,
          createdAt: expense.createdAt,
        })),
        incomes: incomes.map((income) => ({
          id: income.id,
          title: income.title,
          amount: income.amount,
          createdAt: income.createdAt,
        })),
      };

      const contents = JSON.stringify(payload, null, 2);

      try {
        const response = await fetch(`${API_URL}/backup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: contents,
        });

        if (!response.ok) {
          throw new Error(`Backup failed with status ${response.status}`);
        }

        return { savedTo: "remote" };
      } catch (networkError) {
        // Couldn't reach the server, fall back to saving the data locally
        // somewhere the user can access it.
        console.error(networkError);

        const fileName = `fi-app-backup-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.json`;

        const fileUri = await saveBackupToDevice(fileName, contents);
        return { savedTo: "device", fileUri };
      }
    },
    onSuccess: (result) => {
      if (result.savedTo === "remote") {
        Notifier.showNotification({
          title: "Success: Backup",
          description: "Your data has been backed up successfully",
          Component: NotifierComponents.Alert,
          componentProps: {
            alertType: "success",
          },
        });
        return;
      }

      Notifier.showNotification({
        title: "Saved to device",
        description:
          "Couldn't reach the server, so your data was saved to the folder you selected.",
        Component: NotifierComponents.Alert,
        componentProps: {
          alertType: "warn",
        },
      });
    },
    onError: (error) => {
      console.error(error);
      Notifier.showNotification({
        title: "Error: Backup",
        description:
          error instanceof Error
            ? error.message
            : "Failed to back up your data. Please try again.",
        Component: NotifierComponents.Alert,
        componentProps: {
          alertType: "error",
        },
      });
    },
  });

  return (
    <TouchableOpacity
      onPress={() => backup()}
      disabled={isPending}
      className="flex-row items-center rounded-full border border-dark-tabIconDefault/20 bg-[#242424] py-2.5 px-4"
    >
      {isPending ? (
        <ActivityIndicator
          size="small"
          color={Colors.dark.text}
          className="mr-2"
        />
      ) : (
        <Ionicons
          name="cloud-upload-outline"
          size={16}
          color={Colors.dark.text}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={{ fontFamily: Fonts.ManropeRegular }}
        className="text-base text-dark-text"
      >
        {isPending ? "Backing up..." : "Backup"}
      </Text>
    </TouchableOpacity>
  );
}
