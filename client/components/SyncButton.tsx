import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { useSync } from "@/hooks/useSync";

export function SyncButton() {
  const { mutate: runSync, isPending } = useSync();

  return (
    <TouchableOpacity
      onPress={() => runSync()}
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
          name="sync-outline"
          size={16}
          color={Colors.dark.text}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={{ fontFamily: Fonts.ManropeRegular }}
        className="text-base text-dark-text"
      >
        {isPending ? "Syncing..." : "Sync"}
      </Text>
    </TouchableOpacity>
  );
}
