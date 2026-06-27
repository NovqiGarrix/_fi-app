import Ionicons from "@expo/vector-icons/Ionicons";
import { Q } from "@nozbe/watermelondb";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { categoryCollection, expenseCollection } from "@/lib/db";
import {
  useExcludedCategoriesForDailySpendings,
  useSetExcludedCategoriesForDailySpendings,
} from "@/stores/localState.store";
import {
  getStartOfMonth,
  getStartOfNextMonth,
  getStartOfToday,
  getStartOfTomorrow,
} from "@/utils/date";
import { formatMoney } from "@/utils/formatter";

export function DailySpendings() {
  const excludedCategoryIds = useExcludedCategoriesForDailySpendings();
  const setExcludedCategoryIds = useSetExcludedCategoriesForDailySpendings();

  const [isOpen, setIsOpen] = useState(false);

  const { data: monthExpenses = [] } = useQuery({
    queryKey: ["daily-spendings", "month-expenses"],
    queryFn: () =>
      expenseCollection
        .query(
          Q.where(
            "created_at",
            Q.between(getStartOfMonth(), getStartOfNextMonth()),
          ),
        )
        .fetch(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["daily-spendings", "categories"],
    queryFn: () => categoryCollection.query().fetch(),
  });

  const includedMonthExpenses = useMemo(
    () =>
      monthExpenses.filter(
        (exp) => !excludedCategoryIds.includes(exp.category.id),
      ),
    [monthExpenses, excludedCategoryIds],
  );

  const todayAmount = useMemo(() => {
    const startOfToday = getStartOfToday();
    const startOfTomorrow = getStartOfTomorrow();
    return includedMonthExpenses
      .filter(
        (exp) =>
          exp.createdAt >= startOfToday && exp.createdAt < startOfTomorrow,
      )
      .reduce((prev, acc) => prev + acc.amount, 0);
  }, [includedMonthExpenses]);

  const averageAmount = useMemo(() => {
    const total = includedMonthExpenses.reduce(
      (prev, acc) => prev + acc.amount,
      0,
    );
    const dayOfMonth = new Date().getDate();
    return total / dayOfMonth;
  }, [includedMonthExpenses]);

  const categoryWithAmounts = useMemo(() => {
    return categories.map((category) => {
      const amount = monthExpenses
        .filter((expense) => expense.category.id === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        id: category.id,
        color: category.color,
        name: category.name,
        amount,
      };
    });
  }, [categories, monthExpenses]);

  function onSelect(categoryId: string) {
    if (excludedCategoryIds.includes(categoryId)) {
      setExcludedCategoryIds(
        excludedCategoryIds.filter((id) => id !== categoryId),
      );
    } else {
      setExcludedCategoryIds([...excludedCategoryIds, categoryId]);
    }
  }

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: Fonts.ManropeBold }}
          className="text-lg text-dark-tabIconDefault"
        >
          SPENT TODAY
        </Text>

        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="p-1.5 bg-dark-tabIconSelected rounded-full"
        >
          <Ionicons name="filter" size={16} color={Colors.dark.background} />
        </TouchableOpacity>
      </View>

      <Text
        style={{ fontFamily: Fonts.ManropeBold }}
        className="text-6xl text-dark-text"
      >
        {formatMoney(todayAmount)}{" "}
      </Text>

      <Text
        style={{ fontFamily: Fonts.ManropeRegular }}
        className="text-xl text-dark-tabIconDefault mt-1"
      >
        {formatMoney(averageAmount)} daily average
      </Text>

      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full h-full max-h-[30rem] rounded-2xl bg-[#1c1c1c] py-6">
            <View className="flex flex-row items-center justify-between px-6 pb-4 mb-2 border-b border-dark-tabIconDefault/20">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-xl"
              >
                Filter Daily Spendings
              </Text>

              <TouchableOpacity hitSlop={5} onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categoryWithAmounts}
              showsVerticalScrollIndicator
              keyExtractor={(item) => item.id}
              renderItem={({ item: category }) => (
                <TouchableOpacity
                  key={category.id}
                  className="py-3 px-6 flex-row items-center gap-2"
                  onPress={() => {
                    onSelect(category.id);
                  }}
                >
                  <Ionicons
                    name={
                      !excludedCategoryIds.includes(category.id)
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      !excludedCategoryIds.includes(category.id)
                        ? "#3AB879"
                        : Colors.dark.text
                    }
                  />
                  <View className="flex-1 flex-row items-center justify-between">
                    <Text
                      className="text-white text-lg"
                      style={[
                        { fontFamily: Fonts.ManropeSemiBold },
                        !excludedCategoryIds.includes(category.id) && {
                          color: "#3AB879",
                        },
                      ]}
                    >
                      {category.name}
                    </Text>

                    <Text
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: Fonts.ManropeSemiBold }}
                    >
                      {formatMoney(category.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
