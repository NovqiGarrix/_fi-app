import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Slot } from "expo-router";

export default function OnboardingLayout() {

    const { data, isPending, isError } = useQuery({
        queryKey: ['onboardingComplete'],
        queryFn: () => AsyncStorage.getItem('onboardingComplete'),
    });

    if (isPending || isError) {
        return null; // or a loading spinner
    }

    if (data) {
        return <Redirect href="/home" />
    }

    return <Slot />
}