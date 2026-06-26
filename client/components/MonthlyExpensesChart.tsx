import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { categoryCollection, expenseCollection } from '@/lib/db';
import Category from '@/model/Category.model';
import Expense from '@/model/Expense.model';
import { useExcludedCategoriesForExpenseChartFilter } from '@/stores/localState.store';
import { getStartOfMonth, getStartOfNextMonth } from '@/utils/date';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import React, { useMemo } from 'react';
import { PieChart } from 'react-native-gifted-charts';

export const MonthlyExpensesChart = withObservables([], () => ({
    categories: categoryCollection.query(),
    expenses: expenseCollection.query(
        Q.where('created_at', Q.between(getStartOfMonth(), getStartOfNextMonth()))
    )
}))(MonthlyExpensesChartComp) as React.ComponentType;

interface MonthlyExpensesChartProps {
    categories: Category[];
    expenses: Expense[];
}

function MonthlyExpensesChartComp({ categories, expenses }: MonthlyExpensesChartProps) {

    const excludedCategoryIds = useExcludedCategoriesForExpenseChartFilter();

    const filteredExpenses = useMemo(() => {
        return expenses.filter((exp) => !excludedCategoryIds.includes(exp.category.id));
    }, [expenses, excludedCategoryIds]);

    const pieData = useMemo(() => {
        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        const categoryAmounts = categories.map(category => {
            const amount = filteredExpenses
                .filter((expense) => expense.category.id === category.id)
                .reduce((sum, expense) => sum + expense.amount, 0);

            return {
                id: category.id,
                color: category.color,
                name: category.name,
                amount
            }
        });

        return categoryAmounts.map((category) => {
            const percentage = totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;

            return {
                value: percentage, color: category.color, text: `${percentage.toFixed(0)}%`
            }
        });
    }, [filteredExpenses, categories]);

    return (
        <PieChart
            donut
            textColor={Colors.dark.text}
            font={Fonts.ManropeExtraBold}
            textSize={14}
            innerRadius={35}
            data={pieData}
            showText
            radius={120}
            isAnimated
            paddingVertical={5}
        />
    );
};