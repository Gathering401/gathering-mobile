import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import {View, ActivityIndicator, TouchableOpacity} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {Ionicons} from "@expo/vector-icons";

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await SecureStore.getItemAsync('token');
            const beforeAuth = ['login', 'signup', 'forgot-password', 'reset-password'].includes(segments[0]);

            if (!token) {
                if (!beforeAuth) {
                    setTimeout(() => router.replace('/login'), 0);
                }
                setIsReady(true);
                return;
            }

            if (segments[0] === 'login') {
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
            }

            setIsReady(true);
        };

        void checkAuth();
    }, [segments]);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const invitationId = response.notification.request.content.data?.invitationId;
            if (invitationId) {
                router.push({
                    pathname: '/(tabs)',
                    params: {invitationId: String(invitationId)}
                });
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        const response = Notifications.getLastNotificationResponse();
        if (response) {
            const invitationId = response.notification.request.content.data?.invitationId;
            if (invitationId) {
                setTimeout(() => {
                    router.push({
                        pathname: '/(tabs)',
                        params: {invitationId: String(invitationId)}
                    });
                }, 0);
            }
            Notifications.clearLastNotificationResponse();
        }
    }, [isReady]);

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
