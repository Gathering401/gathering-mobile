import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await SecureStore.getItemAsync('token');
            const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

            if (!token && !inAuthGroup) {
                setTimeout(() => router.replace('/login'), 0);
            } else if (token && inAuthGroup) {
                setTimeout(() => router.replace('/(tabs)'), 0);
            }

            setIsReady(true);
        };

        checkAuth();
    }, [segments]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Stack />
        </QueryClientProvider>
    );
}