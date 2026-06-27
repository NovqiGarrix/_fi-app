import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDatabase } from "@nozbe/watermelondb/react";
import { Picker as RNPickerSelect } from "@react-native-picker/picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Notifier, NotifierComponents } from "react-native-notifier";
import { z } from "zod";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { categoryCollection, expenseCollection } from "@/lib/db";
import { formatToRupiah, parseFromRupiah } from "@/utils/formatter";

const addExpenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be a positive number"),
  categoryId: z.string(),
});

type AddExpenseSchema = z.infer<typeof addExpenseSchema>;

export function AddExpense() {
  const database = useDatabase();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [displayAmount, setDisplayAmount] = useState("");

  const form = useForm<AddExpenseSchema>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryCollection.query().fetch(),
  });

  useEffect(() => {
    if (categories?.length) {
      form.setValue("categoryId", categories[0].id);
    }
  }, [categories, form]);

  useEffect(() => {
    if (!showCreateModal) {
      setDisplayAmount("");
    }
  }, [showCreateModal]);

  const { mutateAsync: addExpense, isPending } = useMutation({
    mutationKey: ["addExpense"],
    mutationFn: async (data: AddExpenseSchema) => {
      await database.write(async () => {
        await expenseCollection.create((expense) => {
          expense.title = data.title;
          expense.amount = data.amount;
          expense.category.id = data.categoryId;
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-spendings"] });
      form.reset();
      setDisplayAmount("");
      setShowCreateModal(false);
      setTimeout(() => {
        Notifier.showNotification({
          title: "Success: Add Expense",
          description: "Expense added successfully",
          Component: NotifierComponents.Alert,
          componentProps: { alertType: "success" },
        });
      }, 100);
    },
    onError: (error) => {
      console.error(error);
      ToastAndroid.show(error.message, ToastAndroid.LONG);
    },
  });

  return (
    <>
      <TouchableOpacity onPress={() => setShowCreateModal(true)} hitSlop={5}>
        <Ionicons name="add-circle" size={32} color={Colors.dark.text} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={showCreateModal}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full rounded-2xl bg-[#1c1c1c] p-6">
            <View className="mb-3">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-xl mb-3"
              >
                Category
              </Text>

              <Controller
                control={form.control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <RNPickerSelect
                    selectedValue={value}
                    onValueChange={onChange}
                    itemStyle={{ color: Colors.dark.text }}
                    style={{ color: Colors.dark.text, marginTop: -13 }}
                    dropdownIconColor={Colors.dark.text}
                    mode="dropdown"
                  >
                    {categories?.map((category) => (
                      <RNPickerSelect.Item
                        key={category.id}
                        label={category.name}
                        value={category.id}
                      />
                    ))}
                  </RNPickerSelect>
                )}
              />
              {form.formState.errors.categoryId ? (
                <Text
                  style={{ fontFamily: Fonts.ManropeRegular }}
                  className="text-red-400 mt-1"
                >
                  {form.formState.errors.categoryId.message}
                </Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-xl mb-3"
              >
                Expense
              </Text>
              <Controller
                control={form.control}
                name="title"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="What is this expense for?"
                    placeholderTextColor="#9CA3AF"
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3"
                    style={{ fontFamily: Fonts.ManropeRegular }}
                    autoFocus
                    returnKeyType="next"
                    editable={!isPending}
                  />
                )}
              />
              {form.formState.errors.title ? (
                <Text
                  style={{ fontFamily: Fonts.ManropeRegular }}
                  className="text-red-400 mt-1"
                >
                  {form.formState.errors.title.message}
                </Text>
              ) : null}
            </View>

            <View className="mb-8">
              <Text
                style={{ fontFamily: Fonts.ManropeBold }}
                className="text-white text-xl mb-3"
              >
                Amount
              </Text>
              <Controller
                control={form.control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={displayAmount}
                    onChangeText={(amountInRupiah) => {
                      if (!value && amountInRupiah === "0") {
                        ToastAndroid.show(
                          "Amount cannot be zero",
                          ToastAndroid.SHORT,
                        );
                        return;
                      }

                      const numericValue = parseFromRupiah(amountInRupiah);
                      setDisplayAmount(formatToRupiah(numericValue));
                      onChange(numericValue);
                    }}
                    placeholder="How much did you spend?"
                    placeholderTextColor="#9CA3AF"
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3"
                    style={{ fontFamily: Fonts.ManropeRegular }}
                    returnKeyType="done"
                    editable={!isPending}
                    keyboardType="numeric"
                    onSubmitEditing={form.handleSubmit((data) =>
                      addExpense(data),
                    )}
                  />
                )}
              />
              {form.formState.errors.amount ? (
                <Text
                  style={{ fontFamily: Fonts.ManropeRegular }}
                  className="text-red-400 mt-1"
                >
                  {form.formState.errors.amount.message}
                </Text>
              ) : null}
            </View>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="px-4 py-2.5 rounded-xl bg-neutral-800"
                onPress={() => {
                  setShowCreateModal(false);
                  form.reset();
                }}
                disabled={isPending}
              >
                <Text
                  style={{ fontFamily: Fonts.ManropeBold }}
                  className="text-white"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-20 items-center justify-center py-2.5 rounded-xl bg-dark-text"
                onPress={form.handleSubmit((data) => addExpense(data))}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.dark.background}
                  />
                ) : (
                  <Text
                    style={{ fontFamily: Fonts.ManropeBold }}
                    className="text-black"
                  >
                    Add
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
