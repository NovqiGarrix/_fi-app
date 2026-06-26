import { Colors } from '@/constants/Colors'
import { Fonts } from '@/constants/Fonts'
import { categoryCollection } from '@/lib/db'
import { DEFAULT_CATEGORIES, RawCategory } from '@/utils/constants'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useDatabase } from '@nozbe/watermelondb/hooks'
import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Notifier, NotifierComponents } from 'react-native-notifier'
import Animated, {
    FadeInUp,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
    ZoomOut,
} from 'react-native-reanimated'

export default function OnboardingCategories() {
    const database = useDatabase()

    const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_CATEGORIES.map((c) => c.name)))

    const screenOpacity = useSharedValue(1)
    const screenTranslateX = useSharedValue(0)
    const buttonScale = useSharedValue(1)

    const containerStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
        transform: [{ translateX: screenTranslateX.value }],
    }))

    const onToggle = useCallback((id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const allSelected = useMemo(() => selected.size === DEFAULT_CATEGORIES.length && DEFAULT_CATEGORIES.length > 0, [selected])
    const noneSelected = useMemo(() => selected.size === 0, [selected])

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set())
        } else {
            setSelected(new Set(DEFAULT_CATEGORIES.map((c) => c.name)))
        }
    }

    const { mutateAsync: handleContinue, isPending: isContinuing } = useMutation({
        mutationKey: ['saveInitialCategories'],
        mutationFn: async () => {
            if (noneSelected) return

            buttonScale.value = withSequence(withSpring(1.05), withSpring(1))

            const selectedCategories: typeof DEFAULT_CATEGORIES = [];

            DEFAULT_CATEGORIES.forEach((category) => {
                if (selected.has(category.name)) {
                    selectedCategories.push(category);
                }
            });

            await database.write(async () => {
                await database.batch(
                    selectedCategories.map((category) => {
                        return categoryCollection.prepareCreate((c) => {
                            c.name = category.name;
                            c.color = category.color;
                        })
                    })
                );
            });
        },
        onSuccess: () => {
            Notifier.showNotification({
                title: `Success: Save categories`,
                description: `You categories has been saved`,
                Component: NotifierComponents.Alert,
                componentProps: { alertType: "success" }
            })
            screenOpacity.value = withTiming(0, { duration: 280 })
            screenTranslateX.value = withTiming(-24, { duration: 280 }, () => {
                runOnJS(router.push)('/(onboarding)/index-3')
            })
        },
        onError: (error) => {
            Notifier.showNotification({
                title: `Error: Save categories`,
                description: error.message,
                Component: NotifierComponents.Alert,
                componentProps: { alertType: "error" }
            })
        }
    })

    const handleSkip = () => {
        screenOpacity.value = withTiming(0, { duration: 220 })
        screenTranslateX.value = withTiming(-24, { duration: 220 }, () => {
            runOnJS(router.push)('/(onboarding)/index-3')
        })
    }

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }))

    const renderItem = ({ item, index }: { item: RawCategory; index: number }) => {
        const isActive = selected.has(item.name)
        return (
            <Animated.View
                entering={FadeInUp.duration(400).delay(index * 50)}
                className="w-1/2"
            >
                <CategoryTile
                    name={item.name}
                    active={isActive}
                    onPress={() => onToggle(item.name)}
                />
            </Animated.View>
        )
    }

    return (
        <Animated.View className="flex-1 bg-[#1A1A1A] px-6 pt-14 pb-6" style={containerStyle}>
            <Text style={{ fontFamily: Fonts.ManropeExtraBold }} className="text-5xl text-[#FCFCFC]">Choose your expense categories</Text>
            <Text style={{ fontFamily: Fonts.ManropeSemiBold }} className="text-lg text-dark-tabIconDefault mt-2">
                Pre-selected for a quick start. You can change these anytime.
            </Text>

            <View className="flex-row items-center justify-between mt-4">
                <Pressable disabled={isContinuing} onPress={toggleAll}>
                    <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-[#97E0F7] font-semibold disabled:opacity-70">
                        {allSelected ? 'Deselect all' : 'Select all'}
                    </Text>
                </Pressable>
                <Text style={{ fontFamily: Fonts.ManropeRegular }} className="text-[#B1B1B1]">{selected.size} selected</Text>
            </View>

            <FlatList
                className="mt-4"
                data={DEFAULT_CATEGORIES}
                renderItem={renderItem}
                keyExtractor={(item) => item.name}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
            />

            <View className="mt-auto gap-3">
                <Animated.View style={buttonStyle}>
                    <Pressable
                        onPress={() => handleContinue()}
                        className={`rounded-xl py-4 items-center justify-center ${noneSelected ? 'bg-[#723FEB55]' : 'bg-[#723FEB]'}`}
                        android_ripple={{ color: '#ffffff20' }}
                        disabled={isContinuing}
                    >
                        <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-lg text-dark-text tracking-wide">Continue</Text>
                    </Pressable>
                </Animated.View>

                <Pressable disabled={isContinuing} onPress={handleSkip} className="mb-3 items-center">
                    <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-dark-tabIconDefault">Skip for now</Text>
                </Pressable>
            </View>
        </Animated.View>
    )
}

function CategoryTile({
    name,
    active,
    onPress,
}: {
    name: string
    active: boolean
    onPress: () => void
}) {
    // Press micro-interaction
    const scale = useSharedValue(1)
    const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
    const onPressIn = () => { scale.value = withSpring(0.98, { damping: 14 }) }
    const onPressOut = () => { scale.value = withSpring(1, { damping: 14 }) }

    return (
        <Animated.View style={rStyle}>
            <Pressable
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                className={`rounded-2xl mr-2.5 mb-3 px-4 py-5 border
          ${active ? 'bg-[#723FEB33] border-[#723FEB]' : 'bg-[#2A2A2A] border-[#3A3A3A]'}
        `}
            >
                <View className="flex-row items-center justify-between">
                    <Text style={{ fontFamily: Fonts.ManropeRegular }} className={`text-base text-dark-text`}>
                        {name}
                    </Text>
                    <View className={`w-5 h-5 rounded-md items-center justify-center
            ${active ? 'bg-[#723FEB]' : 'bg-transparent border border-[#4B4B4B]'}
          `}>
                        {active && (
                            <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                                <Ionicons name='checkmark' size={14} color={Colors.dark.text} />
                            </Animated.View>
                        )}
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    )
}
