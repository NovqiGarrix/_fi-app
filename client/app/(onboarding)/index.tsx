import { Fonts } from '@/constants/Fonts'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'

export default function OnboardingWelcomeScreen() {
    const opacity = useSharedValue(0)
    const translateY = useSharedValue(20)
    const screenTranslateX = useSharedValue(0);
    const buttonScale = useSharedValue(1)
    const screenOpacity = useSharedValue(1)

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 400 })
        translateY.value = withTiming(0, { duration: 400 })
    }, [opacity, translateY]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
        transform: [{ translateX: screenTranslateX.value }]
    }));

    const introStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }))

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }))

    const handleContinue = () => {
        buttonScale.value = withSequence(withSpring(1.05), withSpring(1))
        screenOpacity.value = withDelay(50, withTiming(0, { duration: 220 }))
        screenTranslateX.value = withTiming(-24, { duration: 180 }, () => {
            runOnJS(router.push)('/(onboarding)/index-2');
        });
    }

    return (
        <Animated.View className="flex-1 justify-center px-6 pb-10 bg-[#1A1A1A]" style={containerStyle}>
            <Animated.View style={introStyle} className="space-y-6">
                <View className='h-[89%] justify-center'>
                    <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-5xl text-[#FCFCFC]">
                        Take control of your money.
                    </Text>

                    <Text style={{ fontFamily: Fonts.ManropeSemiBold }} className="text-xl mt-3 text-[#B1B1B1] leading-relaxed">
                        Track income and expenses, visualize where your money goes, and build better habits.
                    </Text>
                </View>

                <Animated.View style={buttonStyle} className="mt-8">
                    <Pressable
                        onPress={handleContinue}
                        className="rounded-xl py-4 items-center justify-center bg-dark-tint"
                        android_ripple={{ color: '#ffffff20' }}
                    >
                        <Text className="text-base font-bold text-dark-text tracking-wide">
                            Get Started
                        </Text>
                    </Pressable>
                </Animated.View>

            </Animated.View>
        </Animated.View>
    )
}
