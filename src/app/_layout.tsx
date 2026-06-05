import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {View, ActivityIndicator, TouchableOpacity} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {Ionicons} from "@expo/vector-icons";

const queryClient = new QueryClient();

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await SecureStore.getItemAsync('token');
            const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

            if (!token) {
                if (!inAuthGroup) setTimeout(() => router.replace('/login'), 0);
                setIsReady(true);
                return;
            }

            if (inAuthGroup) {
                setTimeout(() => router.replace('/(tabs)'), 0);
                setIsReady(true);
                return;
            }

            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) {
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('user');
                    setTimeout(() => router.replace('/login'), 0);
                }
            } catch {
                // Network error — fail open
            }

            setIsReady(true);
        };

        void checkAuth();
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
            <Stack>
                <Stack.Screen
                    name="(tabs)"
                    options={({ navigation }) => ({
                        title: 'Gathering',
                        headerRight: () => {
                            const state = navigation.getState();
                            const activeTab = state?.routes[state.index]?.state?.routes[
                            state?.routes[state.index]?.state?.index ?? 0
                                ]?.name;

                            if (activeTab !== 'index') return null;

                            return (
                                <TouchableOpacity
                                    onPress={() => router.push('/new-event')}
                                    style={{ marginRight: 16 }}
                                >
                                    <Ionicons name="add" size={26} color="#228be6" />
                                </TouchableOpacity>
                            );
                        }
                    })}
                />
            </Stack>
        </QueryClientProvider>
    );
}