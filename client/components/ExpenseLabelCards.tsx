import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import { useMutation } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Notifier, NotifierComponents } from "react-native-notifier";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { categoryCollection, database, expenseCollection } from "@/lib/db";
import type Category from "@/model/Category.model";
import type Expense from "@/model/Expense.model";
import { getStartOfMonth, getStartOfNextMonth } from "@/utils/date";
import { formatMoney } from "@/utils/formatter";
import { textOn } from "@/utils/label-color";
import { CreateExpenseLabel } from "./CreateExpenseLabel";

interface ExpenseLabelCardsProps {
  categories: Category[];
  expenses: Expense[];
}

export const ExpenseLabelCards = withObservables([], () => ({
  categories: categoryCollection.query(),
  expenses: expenseCollection.query(
    Q.where("created_at", Q.between(getStartOfMonth(), getStartOfNextMonth())),
  ),
}))(ExpenseLabelCardsComp) as React.ComponentType;

function ExpenseLabelCardsComp({
  categories,
  expenses,
}: ExpenseLabelCardsProps) {
  const [longPressedCategory, setLongPressedCategory] =
    useState<Category | null>(null);

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation(
    {
      mutationKey: ["delete-category"],
      mutationFn: async () => {
        if (!longPressedCategory) throw new Error("No category selected");

        await database.write(async () => {
          const category = await categoryCollection.find(
            longPressedCategory.id,
          );
          if (!category) throw new Error("Category not found");

          await category.markAsDeleted();
        });

        return longPressedCategory.name;
      },
      onSuccess: (categoryName) => {
        setLongPressedCategory(null);
        setTimeout(() => {
          Notifier.showNotification({
            title: "Success: Delete Category",
            description: `${categoryName} deleted successfully`,
            Component: NotifierComponents.Alert,
            componentProps: {
              alertType: "success",
            },
          });
        }, 100);
      },
    },
  );

  return (
    <View className="flex-row mr-3">
      <CreateExpenseLabel />

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={{ flexGrow: 0 }}
        renderItem={({ item, index }) => (
          <ExpenseLabelCard
            item={item}
            index={index}
            expenses={expenses}
            setLongPressedCategory={setLongPressedCategory}
          />
        )}
      />

      <Modal
        transparent
        visible={!!longPressedCategory}
        animationType="fade"
        onRequestClose={() => setLongPressedCategory(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full rounded-2xl bg-[#1c1c1c] py-6">
            <View className="flex justify-between px-6 pb-4 mb-2">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-left text-xl"
              >
                Delete this category?
              </Text>
              <Text
                style={{ fontFamily: Fonts.ManropeRegular }}
                className="text-dark-tabIconDefault text-lg"
              >
                Are you sure you want to delete{" "}
                <Text className="text-dark-text italic font-bold">
                  {longPressedCategory?.name}
                </Text>
                ? This action cannot be undone.
              </Text>
            </View>

            <View className="w-full flex-row items-center justify-end gap-3 px-6">
              <TouchableOpacity
                disabled={isDeletingCategory}
                onPress={() => setLongPressedCategory(null)}
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
                onPress={() => deleteCategory()}
                disabled={isDeletingCategory}
                className="w-20 items-center justify-center py-2.5 rounded-xl bg-red-600"
              >
                {isDeletingCategory ? (
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
    </View>
  );
}

function ExpenseLabelCard({
  item,
  expenses,
  index,
  setLongPressedCategory,
}: {
  item: Category;
  expenses: Expense[];
  index: number;
  setLongPressedCategory: Dispatch<SetStateAction<Category | null>>;
}) {
  const amount = useMemo(
    () =>
      expenses
        .filter((ex) => ex.category.id === item.id)
        .reduce((prev, acc) => prev + acc.amount, 0),
    [expenses, item.id],
  );

  return (
    <TouchableOpacity
      onLongPress={() => setLongPressedCategory(item)}
      className="flex px-4 items-start justify-center mr-3 rounded-2xl min-w-[120px]"
      style={{ backgroundColor: item.color }}
    >
      <Text
        style={{ fontFamily: Fonts.ManropeRegular, color: textOn(item.color) }}
        className="text-base"
      >
        {item.name}
      </Text>
      <Text
        style={{ fontFamily: Fonts.ManropeBold, color: textOn(item.color) }}
        className="text-lg"
      >
        {formatMoney(amount)}
      </Text>
    </TouchableOpacity>
  );
}
