import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DEFAULT_MONTHLY_BUDGET = 755400;

interface LocalStateStore {
    selectedCategoryForExpenseListFilter: string;
    excludedCategoriesForExpenseChartFilter: string[];
    excludedCategoriesForDailySpendings: string[];
    monthlyBudget: number;
    excludedCategoriesForMonthlyBudget: string[];

    setSelectedCategoryForExpenseListFilter: (categoryId: string) => void;
    setExcludedCategoriesForExpenseChartFilter: (categoryIds: string[]) => void;
    setExcludedCategoriesForDailySpendings: (categoryIds: string[]) => void;
    setMonthlyBudget: (amount: number) => void;
    setExcludedCategoriesForMonthlyBudget: (categoryIds: string[]) => void;
}

const useLocalStateStore = create(
    persist<LocalStateStore>(
        (set) => ({
            selectedCategoryForExpenseListFilter: 'all',
            excludedCategoriesForExpenseChartFilter: [],
            excludedCategoriesForDailySpendings: [],
            monthlyBudget: DEFAULT_MONTHLY_BUDGET,
            excludedCategoriesForMonthlyBudget: [],

            setSelectedCategoryForExpenseListFilter: (categoryId) => set(() => ({ selectedCategoryForExpenseListFilter: categoryId })),
            setExcludedCategoriesForExpenseChartFilter: (categoryIds) => set(() => ({ excludedCategoriesForExpenseChartFilter: categoryIds })),
            setExcludedCategoriesForDailySpendings: (categoryIds) => set(() => ({ excludedCategoriesForDailySpendings: categoryIds })),
            setMonthlyBudget: (amount) => set(() => ({ monthlyBudget: amount })),
            setExcludedCategoriesForMonthlyBudget: (categoryIds) => set(() => ({ excludedCategoriesForMonthlyBudget: categoryIds })),
        }),
        {
            name: "local-state-store",
            storage: createJSONStorage(() => ({
                getItem: AsyncStorage.getItem,
                setItem: AsyncStorage.setItem,
                removeItem: AsyncStorage.removeItem,
            }))
        }
    )
);

export const useSelectedCategoryForExpenseListFilter = () => useLocalStateStore((state) => state.selectedCategoryForExpenseListFilter);
export const useSetSelectedCategoryForExpenseListFilter = () => useLocalStateStore((state) => state.setSelectedCategoryForExpenseListFilter);
export const useSetExcludedCategoriesForExpenseChartFilter = () => useLocalStateStore((state) => state.setExcludedCategoriesForExpenseChartFilter);

export const useExcludedCategoriesForExpenseChartFilter = () => useLocalStateStore((state) => state.excludedCategoriesForExpenseChartFilter);

export const useExcludedCategoriesForDailySpendings = () => useLocalStateStore((state) => state.excludedCategoriesForDailySpendings);
export const useSetExcludedCategoriesForDailySpendings = () => useLocalStateStore((state) => state.setExcludedCategoriesForDailySpendings);

export const useMonthlyBudget = () => useLocalStateStore((state) => state.monthlyBudget);
export const useSetMonthlyBudget = () => useLocalStateStore((state) => state.setMonthlyBudget);

export const useExcludedCategoriesForMonthlyBudget = () => useLocalStateStore((state) => state.excludedCategoriesForMonthlyBudget);
export const useSetExcludedCategoriesForMonthlyBudget = () => useLocalStateStore((state) => state.setExcludedCategoriesForMonthlyBudget);
