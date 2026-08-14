import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import {View, ActivityIndicator, TouchableOpacity} from 'react-native';
import {QueryClient, QueryClientProvider, useQuery} from '@tanstack/react-query';
import {Ionicons} from "@expo/vector-icons";
import {colors} from "../styles/colors";
import {styles} from "../styles/layout";
import {HeaderMenu} from "../components/HeaderMenu";
import {GatheringGroup} from "../constants/GatheringGroup";

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
        </QueryClientProvider>
    );
}

function RootLayoutNav() {
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = await SecureStore.getItemAsync('token');
            const beforeAuth = ['login', 'signup', 'forgot-password', 'reset-password'].includes(segments[0]);

            if (!storedToken) {
                setToken(null);
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
                    headers: { Authorization: `Bearer ${storedToken}` }
                });

                if (!response.ok) {
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('user');
                    setToken(null);
                    setTimeout(() => router.replace('/login'), 0);
                    setIsReady(true);
                    return;
                }

                setToken(storedToken);
            } catch {
                console.log('Error with token in layout')
            }

            setIsReady(true);
        };

        void checkAuth();
    }, [segments]);

    const { data: creatableGroups = [] } = useQuery<GatheringGroup[]>({
        queryKey: ['group-creatable'],
        enabled: !!token,
        queryFn: async () => {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/creatable`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                return data.response;
            }
            throw new Error(data.error);
        }
    });

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

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        router.replace('/login');
    };

    const handleEditAccount = async () => {
        const stored = await SecureStore.getItemAsync('user');
        const user = stored ? JSON.parse(stored) : null;
        if (!user) return;

        router.push({
            pathname: '/signup',
            params: {
                isEdit: 'true',
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                birthdate: user.birthdate,
                phone: user.phone,
                zipCode: user.zipCode,
            }
        });
    };

    if (!isReady) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack>
            <Stack.Screen
                name="(tabs)"
                options={({ navigation }) => {
                    const rootState = navigation.getState();
                    const tabsRoute = rootState?.routes[rootState.index];
                    const nestedTabState = tabsRoute?.state;
                    const activeTabIndex = nestedTabState?.index ?? 0;
                    const activeTab = nestedTabState?.routes[activeTabIndex]?.name;

                    return {
                        title: activeTab === 'profile' ? 'Profile' : activeTab === 'groups' ? 'Groups' : 'Gathering',
                        headerRight: () => {
                            if (activeTab === 'index') {
                                if (creatableGroups.length === 0) {
                                    return null;
                                }

                                return (
                                    <TouchableOpacity
                                        onPress={() => router.push('/new-event')}
                                        style={styles.newEvent}
                                    >
                                        <Ionicons name="add" size={20} color={colors.terracotta.primary} />
                                    </TouchableOpacity>
                                );
                            }

                            if (activeTab === 'groups') {
                                return (
                                    <TouchableOpacity
                                        onPress={() => router.push('/new-group')}
                                        style={styles.newEvent}
                                    >
                                        <Ionicons name="add" size={20} color={colors.terracotta.primary} />
                                    </TouchableOpacity>
                                );
                            }

                            if (activeTab === 'profile') {
                                return (
                                    <HeaderMenu
                                        items={[
                                            { key: 'edit', title: 'Edit Account', onSelect: handleEditAccount },
                                            { key: 'logout', title: 'Logout', destructive: true, onSelect: handleLogout },
                                        ]}
                                    />
                                );
                            }

                            return null;
                        }
                    }
                }}
            />
            <Stack.Screen name="new-group" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="new-event" options={{ headerShown: false }} />
            <Stack.Screen
                name="change-password"
                options={{
                    headerTitle: '',
                    headerBackButtonDisplayMode: 'minimal',
                    headerTransparent: true,
                    headerShadowVisible: false,
                }}
            />
            <Stack.Screen
                name="group/[id]"
                options={{
                    headerTitle: '',
                    headerBackButtonDisplayMode: 'minimal',
                }}
            />
            <Stack.Screen
                name="event/[id]"
                options={{
                    headerTitle: '',
                    headerBackButtonDisplayMode: 'minimal',
                }}
            />
        </Stack>
    );
}
