import Ionicons from "@expo/vector-icons/Ionicons";
import { Q } from "@nozbe/watermelondb";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { categoryCollection, expenseCollection } from "@/lib/db";
import {
  useExcludedCategoriesForMonthlyBudget,
  useMonthlyBudget,
  useSetExcludedCategoriesForMonthlyBudget,
  useSetMonthlyBudget,
} from "@/stores/localState.store";
import { getStartOfMonth, getStartOfNextMonth } from "@/utils/date";
import {
  formatMoney,
  formatToRupiah,
  parseFromRupiah,
} from "@/utils/formatter";

export function MonthlyBudgetRemaining() {
  const monthlyBudget = useMonthlyBudget();
  const setMonthlyBudget = useSetMonthlyBudget();

  const excludedCategoryIds = useExcludedCategoriesForMonthlyBudget();
  const setExcludedCategoryIds = useSetExcludedCategoriesForMonthlyBudget();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [displayBudget, setDisplayBudget] = useState("");

  const { data: monthExpenses = [] } = useQuery({
    // Shares the prefix invalidated by AddExpense (["daily-spendings"]).
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

  const spent = useMemo(
    () =>
      monthExpenses
        .filter((exp) => !excludedCategoryIds.includes(exp.category.id))
        .reduce((sum, exp) => sum + exp.amount, 0),
    [monthExpenses, excludedCategoryIds],
  );

  const remaining = monthlyBudget - spent;
  const isOverspent = remaining < 0;

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

  useEffect(() => {
    if (isEditOpen) {
      setDisplayBudget(formatToRupiah(monthlyBudget));
    }
  }, [isEditOpen, monthlyBudget]);

  function onSelect(categoryId: string) {
    if (excludedCategoryIds.includes(categoryId)) {
      setExcludedCategoryIds(
        excludedCategoryIds.filter((id) => id !== categoryId),
      );
    } else {
      setExcludedCategoryIds([...excludedCategoryIds, categoryId]);
    }
  }

  function onSaveBudget() {
    setMonthlyBudget(parseFromRupiah(displayBudget));
    setIsEditOpen(false);
  }

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: Fonts.ManropeBold }}
          className="text-lg text-dark-tabIconDefault"
        >
          I SAVE FOR THIS MONTH
        </Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setIsEditOpen(true)}
            className="p-1.5 bg-dark-tabIconSelected rounded-full"
          >
            <Ionicons name="pencil" size={16} color={Colors.dark.background} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsFilterOpen(true)}
            className="p-1.5 bg-dark-tabIconSelected rounded-full"
          >
            <Ionicons name="filter" size={16} color={Colors.dark.background} />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={{ fontFamily: Fonts.ManropeBold }}
        className={`text-5xl ${isOverspent ? "text-red-400" : "text-dark-text"}`}
      >
        {formatMoney(remaining)}
      </Text>

      <Text
        style={{ fontFamily: Fonts.ManropeRegular }}
        className="text-base text-dark-tabIconDefault mt-1"
      >
        {formatMoney(spent)} spent of {formatMoney(monthlyBudget)}
      </Text>

      {/* Edit budget modal */}
      <Modal
        transparent
        visible={isEditOpen}
        animationType="fade"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full rounded-2xl bg-[#1c1c1c] p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-xl"
              >
                Monthly Budget
              </Text>

              <TouchableOpacity
                hitSlop={5}
                onPress={() => setIsEditOpen(false)}
              >
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={displayBudget}
              onChangeText={(text) =>
                setDisplayBudget(formatToRupiah(parseFromRupiah(text)))
              }
              placeholder="How much can you spend this month?"
              placeholderTextColor="#9CA3AF"
              className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 mb-6"
              style={{ fontFamily: Fonts.ManropeRegular }}
              autoFocus
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={onSaveBudget}
            />

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="px-4 py-2.5 rounded-xl bg-neutral-800"
                onPress={() => setIsEditOpen(false)}
              >
                <Text
                  style={{ fontFamily: Fonts.ManropeBold }}
                  className="text-white"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 items-center justify-center py-2.5 rounded-xl bg-dark-text"
                onPress={onSaveBudget}
              >
                <Text
                  style={{ fontFamily: Fonts.ManropeBold }}
                  className="text-black"
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter categories modal */}
      <Modal
        transparent
        visible={isFilterOpen}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full h-full max-h-[30rem] rounded-2xl bg-[#1c1c1c] py-6">
            <View className="flex flex-row items-center justify-between px-6 pb-4 mb-2 border-b border-dark-tabIconDefault/20">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-xl"
              >
                Exclude from Budget
              </Text>

              <TouchableOpacity
                hitSlop={5}
                onPress={() => setIsFilterOpen(false)}
              >
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
