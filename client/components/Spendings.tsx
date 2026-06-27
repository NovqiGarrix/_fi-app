import Ionicons from "@expo/vector-icons/Ionicons";
import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Notifier, NotifierComponents } from "react-native-notifier";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { database, expenseCollection } from "@/lib/db";
import type Expense from "@/model/Expense.model";
import { useSelectedCategoryForExpenseListFilter } from "@/stores/localState.store";
import { getStartOfMonth, getStartOfNextMonth } from "@/utils/date";
import { formatMoney } from "@/utils/formatter";
import { AddExpense } from "./AddExpense";
import { SpendingCategoryFilter } from "./SpendingCategoryFilter";

function formatDate(timestamp: number) {
  const date = new Date(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
    weekday: "long",
  };
  const formattedDate = date.toLocaleDateString("id-ID", options);

  return formattedDate;
}

export const Spendings = withObservables([], () => ({
  expenses: expenseCollection.query(
    Q.sortBy("created_at", Q.desc),
    Q.where("created_at", Q.between(getStartOfMonth(), getStartOfNextMonth())),
  ),
}))(SpendingsComp) as React.ComponentType;

interface SpendingsProps {
  expenses: Expense[];
}

function SpendingsComp({ expenses }: SpendingsProps) {
  const filter = useSelectedCategoryForExpenseListFilter();
  const queryClient = useQueryClient();
  const [longPressExpense, setLongPressExpense] = useState<Expense | null>(
    null,
  );

  const filteredExpenses = useMemo(() => {
    const _exp =
      filter === "all"
        ? expenses
        : expenses.filter((exp) => exp.category.id === filter);

    return Object.entries(
      _exp.reduce(
        (acc, expense) => {
          const date = String(new Date(expense.createdAt).getDate());
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(expense);
          return acc;
        },
        {} as Record<string, Expense[]>,
      ),
    )
      .map(([_, expenses]) => ({
        key: formatDate(expenses[0].createdAt),
        expenses,
      }))
      .sort((exp) => {
        const date = new Date(exp.expenses[0].createdAt);
        return -date.getTime();
      });
  }, [filter, expenses]);

  const { mutateAsync: deleteExpense, isPending: isDeletingExpense } =
    useMutation({
      mutationKey: ["deleteExpense", longPressExpense?.id],
      mutationFn: async () => {
        if (!longPressExpense) throw new Error("No expense selected");

        await database.write(async () => {
          const expense = await expenseCollection.find(longPressExpense.id);
          if (!expense) throw new Error("Expense not found");

          await expense.markAsDeleted(); // syncable
          // await expense.destroyPermanently(); // permanent
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["daily-spendings"] });
        setLongPressExpense(null);
        setTimeout(() => {
          Notifier.showNotification({
            title: "Success: Delete Expense",
            description: "Expense deleted successfully",
            Component: NotifierComponents.Alert,
            componentProps: {
              alertType: "success",
            },
          });
        }, 100);
      },
      onError: (error) => {
        console.error(error);
        ToastAndroid.show(error.message, ToastAndroid.LONG);
      },
    });

  return (
    <View className="mt-6">
      <View className="flex-row justify-between mb-5">
        <Text
          style={{ fontFamily: Fonts.ManropeBold }}
          className="text-3xl text-dark-text"
        >
          Spendings
        </Text>
        <View className="gap-5 flex-row items-center">
          <AddExpense />
          <SpendingCategoryFilter />
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        ItemSeparatorComponent={() => <View className="h-7" />}
        renderItem={({ item }) => (
          <View>
            <Text
              style={{ fontFamily: Fonts.ManropeSemiBold }}
              className="text-dark-tabIconDefault text-sm mb-3"
            >
              {item.key}
            </Text>

            <View className="gap-3">
              {item.expenses.map((exp, index) => (
                <Spending
                  setLongPressExpense={setLongPressExpense}
                  item={exp}
                  index={index}
                  key={exp.id}
                />
              ))}
            </View>
          </View>
        )}
      />

      <Modal
        transparent
        visible={!!longPressExpense}
        animationType="fade"
        onRequestClose={() => setLongPressExpense(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full rounded-2xl bg-[#1c1c1c] py-6">
            <View className="flex justify-between px-6 pb-4 mb-2">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-left text-xl"
              >
                Delete this expense?
              </Text>
              <Text
                style={{ fontFamily: Fonts.ManropeRegular }}
                className="text-dark-tabIconDefault text-lg"
              >
                Are you sure you want to delete{" "}
                <Text className="text-dark-text italic font-bold">
                  {longPressExpense?.title}
                </Text>
                ? This action cannot be undone.
              </Text>
            </View>

            <View className="w-full flex-row items-center justify-end gap-3 px-6">
              <TouchableOpacity
                disabled={isDeletingExpense}
                onPress={() => setLongPressExpense(null)}
                className="w-20 items-center justify-center py-2.5 rounded-xl bg-dark-tabIconDefault/20"
              >
                <Text
                  style={{ fontFamily: Fonts.ManropeBold }}
                  className="text-white"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteExpense()}
                disabled={isDeletingExpense}
                className="w-20 items-center justify-center py-2.5 rounded-xl bg-red-600"
              >
                {isDeletingExpense ? (
                  <ActivityIndicator size="small" color={Colors.dark.text} />
                ) : (
                  <Text
                    style={{ fontFamily: Fonts.ManropeBold }}
                    className="text-white"
                  >
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {filteredExpenses.length <= 0 && (
        <View className="items-center justify-center">
          <Text
            style={{ fontFamily: Fonts.ManropeRegular }}
            className="text-white text-lg"
          >
            You haven&apos;t added any expense yet. Press the plus button above
            to add your first expense.
          </Text>
        </View>
      )}
    </View>
  );
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface SpendingProps {
  item: Expense;
  index: number;
  setLongPressExpense: Dispatch<SetStateAction<Expense | null>>;
}

function Spending(props: SpendingProps) {
  const { item, index, setLongPressExpense } = props;

  const { data: category, isPending: isGettingCategory } = useQuery({
    queryKey: ["category", item.category.id],
    queryFn: () => item.category.fetch(),
  });

  return (
    <AnimatedTouchableOpacity
      onLongPress={() => setLongPressExpense(item)}
      entering={FadeInUp.duration(400).delay(index * 50)}
      className="flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-14 h-14 items-center justify-center bg-[#212121] rounded-full">
          <Ionicons name="arrow-up-outline" size={25} color="#fff" />
        </View>

        <View>
          <Text
            style={{ fontFamily: Fonts.ManropeSemiBold }}
            className="text-dark-text text-base text-wrap max-w-[200px]"
          >
            {item.title}
          </Text>
          <Text
            style={{ fontFamily: Fonts.ManropeRegular }}
            className="text-dark-tabIconDefault text-sm mt-1.5"
          >
            {isGettingCategory ? "..." : category?.name}
          </Text>
        </View>
      </View>

      <Text
        style={{ fontFamily: Fonts.ManropeBold }}
        className="text-white text-xl"
      >
        {formatMoney(item.amount)}
      </Text>
    </AnimatedTouchableOpacity>
  );
}
