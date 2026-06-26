import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { incomeCollection } from "@/lib/db";
import { formatToRupiah, parseFromRupiah } from "@/utils/formatter";
import { addIncomeSchema, type AddIncomeSchema } from "@/zod/income.zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDatabase } from "@nozbe/watermelondb/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Modal, Text, TextInput, ToastAndroid, TouchableOpacity, View } from "react-native";
import { Notifier, NotifierComponents } from "react-native-notifier";

export function AddIncome() {

    const database = useDatabase();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [displayAmount, setDisplayAmount] = useState('');

    useEffect(() => {
        setDisplayAmount('');
    }, [showCreateModal]);

    const form = useForm<AddIncomeSchema>({
        resolver: zodResolver(addIncomeSchema),
        defaultValues: {
            title: '',
        }
    });

    const { mutateAsync: addIncome, isPending } = useMutation({
        mutationKey: ['addIncome'],
        mutationFn: async (data: AddIncomeSchema) => {

            await database.write(async () => {

                await incomeCollection.create((income) => {
                    income.title = data.title;
                    income.amount = data.amount;
                });

            });

        },
        onSuccess: () => {
            form.reset();
            setShowCreateModal(false);
            setDisplayAmount('');
            setTimeout(() => {
                Notifier.showNotification({
                    title: 'Success: Add Income',
                    description: 'Income added successfully',
                    Component: NotifierComponents.Alert,
                    componentProps: {
                        alertType: "success"
                    }
                })
            }, 100);
        },
        onError: (error) => {
            console.error(error);
            ToastAndroid.show(error.message, ToastAndroid.LONG);
        }
    });

    return (
        <>
            <TouchableOpacity onPress={() => setShowCreateModal(true)} hitSlop={5}>
                <Ionicons name="add-circle" size={32} color={Colors.dark.text} />
            </TouchableOpacity>

            <Modal transparent visible={showCreateModal} animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full rounded-2xl bg-[#1c1c1c] p-6">
                        <View>
                            <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white text-xl mb-3">
                                Income Source
                            </Text>
                            <Controller
                                control={form.control}
                                name="title"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Where is this income coming from?"
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
                                <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-red-400 mt-1">{form.formState.errors.title.message}</Text>
                            ) : null}
                        </View>
                        <View className="mt-4">
                            <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white text-xl mb-3">
                                Amount
                            </Text>
                            <Controller
                                control={form.control}
                                name="amount"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        value={displayAmount}
                                        onChangeText={(amountInRupiah) => {
                                            if (!value && amountInRupiah === '0') {
                                                ToastAndroid.show('Amount cannot be zero', ToastAndroid.SHORT);
                                                return;
                                            }

                                            const numericValue = parseFromRupiah(amountInRupiah);
                                            setDisplayAmount(formatToRupiah(numericValue));
                                            onChange(numericValue)
                                        }}
                                        placeholder="How much did you earn?"
                                        placeholderTextColor="#9CA3AF"
                                        className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3"
                                        style={{ fontFamily: Fonts.ManropeRegular }}
                                        returnKeyType="done"
                                        keyboardType="numeric"
                                        editable={!isPending}
                                        onSubmitEditing={form.handleSubmit((data) => addIncome(data))}
                                    />
                                )}
                            />

                            {form.formState.errors.amount ? (
                                <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-red-400 mt-1">{form.formState.errors.amount.message}</Text>
                            ) : null}
                        </View>
                        <View className="flex-row justify-end gap-3 mt-5">
                            <TouchableOpacity
                                className="px-4 py-2.5 rounded-xl bg-neutral-800"
                                onPress={() => {
                                    setShowCreateModal(false);
                                    form.reset();
                                }}
                                disabled={isPending}
                            >
                                <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-20 items-center justify-center py-2.5 rounded-xl bg-dark-text"
                                onPress={form.handleSubmit((data) => addIncome(data))}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <ActivityIndicator size="small" color={Colors.dark.background} />
                                ) : (
                                    <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-black">Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </>
    )

}