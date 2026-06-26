import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { database, incomeCollection } from "@/lib/db";
import Income from "@/model/Income.model";
import { getStartOfMonth, getStartOfNextMonth } from "@/utils/date";
import { formatMoney } from "@/utils/formatter";
import Fontisto from '@expo/vector-icons/Fontisto';
import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Modal, Text, ToastAndroid, TouchableOpacity, View } from "react-native";
import { Notifier, NotifierComponents } from "react-native-notifier";
import Animated, { FadeInRight } from "react-native-reanimated";
import { AddIncome } from "./AddIncome";

interface IncomesProps {
    incomes: Income[];
}

export const Incomes = withObservables([], () => ({
    incomes: incomeCollection.query(
        Q.sortBy('created_at', Q.desc),
        Q.where('created_at', Q.between(getStartOfMonth(), getStartOfNextMonth()))
    )
}))(IncomesComp) as React.ComponentType;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function IncomesComp({ incomes }: IncomesProps) {

    const [longPressIncome, setLongPressIncome] = useState<Income | null>(null)

    const { mutateAsync: deleteIncome, isPending: isDeletingIncome } = useMutation({
        mutationKey: ["deleteIncome", longPressIncome?.id],
        mutationFn: async () => {
            if (!longPressIncome) throw new Error("No expense selected");

            await database.write(async () => {
                const income = await incomeCollection.find(longPressIncome.id);
                if (!income) throw new Error("Income not found");

                await income.markAsDeleted(); // syncable
            });

        },
        onSuccess: () => {
            setLongPressIncome(null);
            setTimeout(() => {
                Notifier.showNotification({
                    title: 'Success: Delete Expense',
                    description: 'Expense deleted successfully',
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
    })

    return (
        <View>
            <View className="flex-row items-center justify-between mb-5">
                <Text style={{ fontFamily: Fonts.ManropeBold }} className='text-3xl text-dark-text'>My Income</Text>

                <AddIncome />
            </View>
            <FlatList
                data={incomes}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                style={{ flexGrow: 0 }}
                renderItem={({ item, index }) => (
                    <AnimatedTouchableOpacity onLongPress={() => setLongPressIncome(item)} entering={FadeInRight.duration(400).delay(index * 50)} className="p-7 mr-3 rounded-3xl min-w-[200px] bg-[#1E1E1E]">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="w-14 h-14 items-center justify-center border border-dark-tabIconDefault/20 bg-[#212121] rounded-full">
                                <Fontisto name="dollar" size={24} color="#fff" />
                            </View>

                            {/* <Ionicons name="ellipsis-horizontal" size={28} color="#fff" /> */}
                        </View>

                        <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-white text-lg mt-3">
                            {item.title}
                        </Text>
                        <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white text-2xl mt-1.5">
                            {formatMoney(item.amount)}
                        </Text>
                    </AnimatedTouchableOpacity>
                )}
            />

            <Modal transparent visible={!!longPressIncome} animationType="fade" onRequestClose={() => setLongPressIncome(null)}>
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full rounded-2xl bg-[#1c1c1c] py-6">
                        <View className='flex justify-between px-6 pb-4 mb-2'>
                            <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white text-left text-xl">
                                Delete this income?
                            </Text>
                            <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-dark-tabIconDefault text-lg">
                                Are you sure you want to delete <Text className="text-dark-text italic font-bold">{longPressIncome?.title} - {formatMoney(longPressIncome?.amount!)}</Text>? This action cannot be undone.
                            </Text>
                        </View>

                        <View className="w-full flex-row items-center justify-end gap-3 px-6">
                            <TouchableOpacity disabled={isDeletingIncome} onPress={() => setLongPressIncome(null)} className="w-20 items-center justify-center py-2.5 rounded-xl bg-dark-tabIconDefault/20">
                                <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteIncome()} disabled={isDeletingIncome} className="w-20 items-center justify-center py-2.5 rounded-xl bg-red-600">
                                {isDeletingIncome ? (
                                    <ActivityIndicator size="small" color={Colors.dark.text} />
                                ) : (
                                    <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white">
                                        Delete
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {incomes.length <= 0 && (
                <View className="items-center justify-center">
                    <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-white text-lg">
                        You haven&apos;t added any income yet. Press the plus button above to add your first income.
                    </Text>
                </View>
            )}
        </View>
    )

}