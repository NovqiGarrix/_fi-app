/** biome-ignore-all lint/correctness/useExhaustiveDependencies: need to prevent the BackHandler based on onboarding status */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { BackHandler, Image, ScrollView, Text, View } from "react-native";
import { DailySpendings } from "@/components/DailySpendings";
import { ExpenseLabelCards } from "@/components/ExpenseLabelCards";
import { FilterExpensesByCategoryForChart } from "@/components/FilterExpensesByCategoryForChart";
import { Incomes } from "@/components/Incomes";
import { MonthlyBudgetRemaining } from "@/components/MonthlyBudgetRemaining";
import { Spendings } from "@/components/Spendings";
import { SyncButton } from "@/components/SyncButton";
import { TotalSpendings } from "@/components/TotalSpendings";
import { Fonts } from "@/constants/Fonts";

function getCurrentMonthYear() {
  const d = new Date();

  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();

  return `${month}, ${year}`;
}

export default function HomeScreen() {
  const { data: onboardingComplete } = useQuery({
    queryKey: ["onboardingComplete"],
    queryFn: () => AsyncStorage.getItem("onboardingComplete"),
  });

  useEffect(() => {
    // Android back should exit app if onboarding is completed
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      BackHandler.exitApp();
      return true;
    });

    return () => {
      sub.remove();
    };
  }, [onboardingComplete]);

  return (
    <ScrollView
      contentContainerClassName="pb-8"
      className="flex-1 bg-dark-background"
    >
      <View className="py-14 pb-7 px-4 bg-[#1F1F1F] rounded-b-[2.5rem]">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://github.com/NovqiGarrix.png" }}
              className="w-14 h-14 rounded-full object-cover mr-4"
            />

            <View>
              <Text
                style={{ fontFamily: Fonts.ManropeLight }}
                className="text-base text-dark-tabIconDefault"
              >
                Hi, Garrix!
              </Text>
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-2xl text-dark-text"
              >
                Fi-App
              </Text>
            </View>
          </View>

          <SyncButton />
        </View>

        <View className="mt-8">
          <DailySpendings />

          <MonthlyBudgetRemaining />

          <View className="flex-row items-center justify-between">
            <Text
              style={{ fontFamily: Fonts.ManropeBold }}
              className="text-2xl text-dark-text"
            >
              Total Spendings{" "}
              <Text
                style={{ fontFamily: Fonts.ManropeRegular }}
                className="text-base text-dark-tabIconDefault"
              >
                ({getCurrentMonthYear()})
              </Text>
            </Text>

            {/* Filter expenses by category for the chart */}
            <FilterExpensesByCategoryForChart />
          </View>

          <TotalSpendings />
        </View>

        <View className="mt-8">
          <ExpenseLabelCards />
        </View>
      </View>

      <View className="px-4 pt-6">
        <Incomes />

        <Spendings />
      </View>
    </ScrollView>
  );
}
