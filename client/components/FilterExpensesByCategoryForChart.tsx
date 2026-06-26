import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { categoryCollection, expenseCollection } from "@/lib/db";
import type Category from "@/model/Category.model";
import Expense from '@/model/Expense.model';
import { useExcludedCategoriesForExpenseChartFilter, useSetExcludedCategoriesForExpenseChartFilter } from '@/stores/localState.store';
import { getStartOfMonth, getStartOfNextMonth } from '@/utils/date';
import { formatMoney } from '@/utils/formatter';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

export const FilterExpensesByCategoryForChart = withObservables([], () => ({
    categories: categoryCollection.query(),
    expenses: expenseCollection.query(
        Q.where('created_at', Q.between(getStartOfMonth(), getStartOfNextMonth()))
    )
}))(FilterExpensesByCategoryForChartComp) as React.ComponentType;

interface FilterExpensesByCategoryForChartProps {
    categories: Category[];
    expenses: Expense[];
}

function FilterExpensesByCategoryForChartComp({ categories, expenses }: FilterExpensesByCategoryForChartProps) {

    const excludedCategoryIds = useExcludedCategoriesForExpenseChartFilter();
    const setExcludedCategoriesForExpenseChartFilter = useSetExcludedCategoriesForExpenseChartFilter();

    const [isOpen, setIsOpen] = useState(false);

    const filteredExpenses = useMemo(() => {
        return expenses.filter((exp) => !excludedCategoryIds.includes(exp.category.id));
    }, [expenses, excludedCategoryIds]);

    const categoryWithAmounts = useMemo(() => {
        return categories.map(category => {
            const amount = filteredExpenses
                .filter((expense) => expense.category.id === category.id)
                .reduce((sum, expense) => sum + expense.amount, 0);

            return {
                id: category.id,
                color: category.color,
                name: category.name,
                amount
            }
        })
    }, [categories, filteredExpenses]);

    function onSelect(categoryId: string) {
        if (excludedCategoryIds.includes(categoryId)) {
            setExcludedCategoriesForExpenseChartFilter(excludedCategoryIds.filter((id) => id !== categoryId));
        } else {
            setExcludedCategoriesForExpenseChartFilter([...excludedCategoryIds, categoryId]);
        }
    }

    return (
        <>
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                className='p-1.5 bg-dark-tabIconSelected rounded-full'
            >
                <Ionicons name='filter' size={16} color={Colors.dark.background} />
            </TouchableOpacity>

            <Modal transparent visible={isOpen} animationType="fade" onRequestClose={() => setIsOpen(false)}>
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full h-full max-h-[30rem] rounded-2xl bg-[#1c1c1c] py-6">
                        <View className='flex flex-row items-center justify-between px-6 pb-4 mb-2 border-b border-dark-tabIconDefault/20'>
                            <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white text-xl">
                                Filter Expenses by Category
                            </Text>

                            <TouchableOpacity hitSlop={5} onPress={() => setIsOpen(false)}>
                                <Ionicons name='close' size={24} color={Colors.dark.text} />
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
                                    <Ionicons name={!excludedCategoryIds.includes(category.id) ? 'radio-button-on' : 'radio-button-off'} size={20} color={!excludedCategoryIds.includes(category.id) ? '#3AB879' : Colors.dark.text} />
                                    <View className='flex-1 flex-row items-center justify-between'>
                                        <Text className='text-white text-lg' style={[{ fontFamily: Fonts.ManropeSemiBold }, !excludedCategoryIds.includes(category.id) && { color: '#3AB879' }]}>
                                            {category.name}
                                        </Text>

                                        <Text className='text-gray-400 text-sm' style={{ fontFamily: Fonts.ManropeSemiBold }}>
                                            {formatMoney(category.amount)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    )

}