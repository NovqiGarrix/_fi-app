import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { database } from '@/lib/db';
import Category from '@/model/Category.model';
import { nextLabelColor } from '@/utils/label-color';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';

export function CreateExpenseLabel() {

    const queryClient = useQueryClient();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [labelName, setLabelName] = useState('');

    const { mutateAsync, isPending } = useMutation({
        mutationKey: ['createExpenseLabel'],
        mutationFn: async () => {

            if (!labelName.trim()) {
                throw new Error('Label name cannot be empty');
            }

            const collection = database.get<Category>('categories');

            const categories = await collection.query().fetch();
            const usedColors = new Set(categories.map(cat => cat.color));

            const color = nextLabelColor(usedColors);

            await database.write(async () => {
                await collection.create((category) => {
                    category.name = labelName;
                    category.color = color;
                })
            });

        },
        onError: (error) => {
            console.error('Error creating label:', error);
            ToastAndroid.show(error.message, ToastAndroid.LONG);
        },
        onSuccess: async () => {
            setLabelName('');
            setShowCreateModal(false);
            await queryClient.refetchQueries({ queryKey: ['categories'] });
        }
    });

    return (
        <>
            <TouchableOpacity disabled={isPending} onPress={() => setShowCreateModal(true)} className="px-4 h-20 items-start justify-center mr-3 rounded-2xl bg-[#242424]">
                <AntDesign name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal transparent visible={showCreateModal} animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full rounded-2xl bg-[#1c1c1c] p-4">
                        <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white text-xl mb-2">
                            New Label
                        </Text>
                        <TextInput
                            value={labelName}
                            onChangeText={setLabelName}
                            placeholder="Label name"
                            placeholderTextColor="#9CA3AF"
                            className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 mb-5"
                            style={{ fontFamily: Fonts.ManropeRegular }}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={() => mutateAsync()}
                        />
                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                className="px-4 py-2.5 rounded-xl bg-neutral-800"
                                onPress={() => {
                                    setShowCreateModal(false)
                                    setLabelName('');
                                }}
                                disabled={isPending}
                            >
                                <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-white">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-20 justify-center flex-row items-center py-2.5 rounded-xl bg-dark-text"
                                onPress={() => mutateAsync()}
                                disabled={!labelName.trim() || isPending}
                            >
                                {isPending ? (
                                    <ActivityIndicator size="small" color={Colors.dark.background} />
                                ) : (
                                    <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-black">Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    )

}