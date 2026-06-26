import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, ToastAndroid, View } from 'react-native'
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'

import { Fonts } from '@/constants/Fonts'
import { incomeCollection } from '@/lib/db'
import { formatToRupiah, parseFromRupiah } from '@/utils/formatter'
import { addIncomeSchema, AddIncomeSchema } from '@/zod/income.zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDatabase } from '@nozbe/watermelondb/react'
import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Notifier, NotifierComponents } from 'react-native-notifier'

export default function OnboardingIncomeScreen() {

    const database = useDatabase();
    const [displayAmount, setDisplayAmount] = useState('');

    const screenOpacity = useSharedValue(1)
    const screenTranslateX = useSharedValue(0)
    const buttonScale = useSharedValue(1)

    const form = useForm<AddIncomeSchema>({
        resolver: zodResolver(addIncomeSchema),
        defaultValues: {
            title: '',
        }
    });

    const screenStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
        transform: [{ translateX: screenTranslateX.value }],
    }))

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }))

    useEffect(() => {
        screenOpacity.value = withTiming(1, { duration: 400 })
    }, [screenOpacity])

    const { mutateAsync: handleContinue, isPending: isContinuing } = useMutation({
        mutationKey: ['addIncome'],
        mutationFn: async (data: AddIncomeSchema) => {
            buttonScale.value = withSequence(withSpring(1.05), withSpring(1))

            await database.write(async () => {
                await incomeCollection.create((income) => {
                    income.title = data.title;
                    income.amount = data.amount;
                });
            });
        },
        onSuccess: () => {
            Notifier.showNotification({
                title: 'Success: Add Income',
                description: 'Income added successfully',
                Component: NotifierComponents.Alert,
                componentProps: {
                    alertType: "success"
                }
            });

            screenOpacity.value = withTiming(0, { duration: 280 }, () => {
                runOnJS(router.push)('/(onboarding)/index-4')
            })
        },
        onError: (error) => {
            Notifier.showNotification({
                title: 'Error: Add Income',
                description: error.message,
                Component: NotifierComponents.Alert,
                componentProps: {
                    alertType: "error"
                }
            });

            console.error(error);
        }
    })

    const handleSkip = () => {
        screenOpacity.value = withDelay(50, withTiming(0, { duration: 220 }));
        screenTranslateX.value = withTiming(-24, { duration: 220 }, () => {
            runOnJS(router.push)('/(onboarding)/index-4')
        });
    }

    return (
        <Animated.View className="flex-1 bg-[#1A1A1A] px-6 pt-14 pb-6" style={screenStyle}>
            <View>
                <Text style={{ fontFamily: Fonts.ManropeExtraBold }} className="text-5xl text-[#FCFCFC]">
                    Add your first income
                </Text>

                <Text style={{ fontFamily: Fonts.ManropeSemiBold }} className="text-lg mt-2 text-[#B1B1B1] leading-relaxed">
                    Optional, but it helps kickstart your tracking.
                </Text>

                <View className="mt-6 space-y-4">
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
                                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 mb-5"
                                    style={{ fontFamily: Fonts.ManropeRegular }}
                                    autoFocus
                                    returnKeyType="next"
                                    editable={!isContinuing}
                                />
                            )}
                        />
                    </View>
                    <View>
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
                                    placeholder="What is the amount?"
                                    placeholderTextColor="#9CA3AF"
                                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 mb-5"
                                    style={{ fontFamily: Fonts.ManropeRegular }}
                                    returnKeyType="done"
                                    editable={!isContinuing}
                                    onSubmitEditing={form.handleSubmit((data) => handleContinue(data))}
                                />
                            )}
                        />
                    </View>
                </View>
            </View>

            <View className="mt-auto gap-3">
                <Animated.View style={buttonStyle}>
                    <Pressable
                        disabled={isContinuing}
                        onPress={form.handleSubmit((data) => handleContinue(data))}
                        className={`rounded-xl py-4 items-center justify-center ${!isContinuing ? 'bg-[#723FEB]' : 'bg-[#723FEB55]'}`}
                        android_ripple={{ color: '#ffffff20' }}
                    >
                        <Text className="text-base font-bold text-[#FCFCFC] tracking-wide">Continue</Text>
                    </Pressable>
                </Animated.View>

                <Pressable onPress={handleSkip} className="mb-3 pt-1 items-center">
                    <Text className="text-[#B1B1B1]">Skip for now</Text>
                </Pressable>
            </View>
        </Animated.View>
    )
}
