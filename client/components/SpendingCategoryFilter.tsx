import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { categoryCollection } from '@/lib/db';
import Category from '@/model/Category.model';
import { useSelectedCategoryForExpenseListFilter, useSetSelectedCategoryForExpenseListFilter } from '@/stores/localState.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { withObservables } from '@nozbe/watermelondb/react';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

export const SpendingCategoryFilter = withObservables([], () => ({
    categories: categoryCollection.query()
}))(SpendingCategoryFilterComp) as React.ComponentType;

interface SpendingCategoryFilterProps {
    categories: Category[]
}

function SpendingCategoryFilterComp({ categories }: SpendingCategoryFilterProps) {

    const filter = useSelectedCategoryForExpenseListFilter();
    const setFilter = useSetSelectedCategoryForExpenseListFilter();

    const [isOpen, setIsOpen] = useState(false);

    const filterOptions = useMemo(() => {
        return [
            { id: 'all', name: 'All Categories' },
            ...categories.map(cat => ({ id: cat.id, name: cat.name }))
        ]
    }, [categories]);

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
                            data={filterOptions}
                            showsVerticalScrollIndicator
                            keyExtractor={(item) => item.id}
                            renderItem={({ item: category }) => (
                                <TouchableOpacity
                                    key={category.id}
                                    className="py-3 px-6"
                                    onPress={() => {
                                        setFilter(category.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <Text className='text-white text-lg' style={[{ fontFamily: Fonts.ManropeSemiBold }, filter === category.id && { color: '#3AB879' }]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    )

}