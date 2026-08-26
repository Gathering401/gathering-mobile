import {useState} from 'react';
import {useRouter} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform
} from 'react-native';
import {styles} from "../styles/login";
import {usePushToken} from "../hooks/usePushToken";

interface LogInValues {
    username: string;
    password: string;
}

const LogIn = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [staySignedIn, setStaySignedIn] = useState(false);
    const {control, handleSubmit} = useForm<LogInValues>({
        defaultValues: {
            username: '',
            password: ''
        }
    });
    const {registerPushToken} = usePushToken();

    const onSubmit = async (values: LogInValues) => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/login`, {
                body: JSON.stringify({...values, staySignedIn}),
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });

            const data = await response.json();

            if (data.success) {
                await SecureStore.setItemAsync('token', data.token);
                await SecureStore.setItemAsync('user', JSON.stringify(data.user));
                if (data.refreshToken) {
                    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
                } else {
                    await SecureStore.deleteItemAsync('refreshToken');
                }
                await registerPushToken(data.token);
                router.replace('/');
            } else {
                Toast.show({type: 'error', text1: 'Invalid username or password'});
            }
        } catch {
            Toast.show({type: 'error', text1: 'Something went wrong. Please try again.'});
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <Text style={styles.title}>Log In</Text>
                    <Controller
                        control={control}
                        name="username"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Username</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                    <Controller
                        control={control}
                        name="password"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    secureTextEntry
                                    value={value}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                    <View style={styles.checkboxRow}>
                        <TouchableOpacity
                            style={[styles.checkbox, staySignedIn && styles.checkboxChecked]}
                            onPress={() => setStaySignedIn((prev) => !prev)}
                        >
                            {staySignedIn && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel}>Stay signed in</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSubmit(onSubmit)}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Submit'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                        <Text style={styles.link}>Forgot your password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.link}>Don't have an account yet? Sign up here</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
            <Toast/>
        </KeyboardAvoidingView>
    );
}

export default LogIn;
