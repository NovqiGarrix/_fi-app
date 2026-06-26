import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface LocalStateStore {
    selectedCategoryForExpenseListFilter: string;
    excludedCategoriesForExpenseChartFilter: string[];
    excludedCategoriesForDailySpendings: string[];

    setSelectedCategoryForExpenseListFilter: (categoryId: string) => void;
    setExcludedCategoriesForExpenseChartFilter: (categoryIds: string[]) => void;
    setExcludedCategoriesForDailySpendings: (categoryIds: string[]) => void;
}

const useLocalStateStore = create(
    persist<LocalStateStore>(
        (set) => ({
            selectedCategoryForExpenseListFilter: 'all',
            excludedCategoriesForExpenseChartFilter: [],
            excludedCategoriesForDailySpendings: [],

            setSelectedCategoryForExpenseListFilter: (categoryId) => set(() => ({ selectedCategoryForExpenseListFilter: categoryId })),
            setExcludedCategoriesForExpenseChartFilter: (categoryIds) => set(() => ({ excludedCategoriesForExpenseChartFilter: categoryIds })),
            setExcludedCategoriesForDailySpendings: (categoryIds) => set(() => ({ excludedCategoriesForDailySpendings: categoryIds })),
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
