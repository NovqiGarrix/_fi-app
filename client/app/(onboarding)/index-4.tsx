import { Fonts } from '@/constants/Fonts'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import LottieView from 'lottie-react-native'
import { useEffect } from 'react'
import { BackHandler, Dimensions, Pressable, Text, View } from 'react-native'
import Animated, {
    FadeInUp,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'

export default function OnboardingDoneScreen() {
    const screenOpacity = useSharedValue(0)
    const translateY = useSharedValue(20)
    const buttonScale = useSharedValue(1)

    useEffect(() => {
        screenOpacity.value = withTiming(1, { duration: 400 })
        translateY.value = withTiming(0, { duration: 400 })

        // Android back should exit app on this final screen
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            BackHandler.exitApp()
            return true
        })

        return () => {
            sub.remove()
        }
    }, [screenOpacity, translateY])

    const screenStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
        transform: [{ translateY: translateY.value }],
    }))

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }))

    const handleContinue = async () => {
        buttonScale.value = withSequence(withSpring(1.05), withSpring(1))
        try {
            await AsyncStorage.setItem('onboardingComplete', 'true')
        } catch (error) {
            console.error('Failed to save onboarding completion:', error);
        }
        runOnJS(router.replace)('/home');
    }

    return (
        <Animated.View className="flex-1 bg-dark-background px-6 pt-14 pb-10 justify-between" style={screenStyle}>
            <Animated.View entering={FadeInUp.duration(400)} className="h-[89%] justify-center">
                <Text style={{ fontFamily: Fonts.ManropeExtraBold }} className="text-5xl text-dark-text">You&apos;re all set!</Text>
                <Text style={{ fontFamily: Fonts.ManropeSemiBold }} className="text-lg text-dark-tabIconDefault mt-2">
                    You can start tracking transactions right away. Let&apos;s build better financial habits together.
                </Text>
            </Animated.View>

            <View className="self-center absolute left-0">
                <LottieView
                    source={require('../../assets/Confetti.json')}
                    autoPlay
                    loop={false}
                    style={{ width: 500, height: Dimensions.get('window').height }}
                />
            </View>

            <Animated.View style={buttonStyle}>
                <Pressable
                    onPress={handleContinue}
                    className="rounded-xl py-4 items-center justify-center bg-dark-tint"
                    android_ripple={{ color: '#ffffff20' }}
                >
                    <Text style={{ fontFamily: Fonts.ManropeBold }} className="text-base text-dark-text tracking-wide">Start Using the App</Text>
                </Pressable>
            </Animated.View>
        </Animated.View>
    )
}
