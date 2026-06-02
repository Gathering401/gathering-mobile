import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';

interface LogInValues {
    username: string;
    password: string;
}

const LogIn = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { control, handleSubmit } = useForm<LogInValues>({
        defaultValues: {
            username: '',
            password: ''
        }
    });

    const onSubmit = async (values: LogInValues) => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/login`, {
                body: JSON.stringify(values),
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                await SecureStore.setItemAsync('token', data.token);
                await SecureStore.setItemAsync('user', JSON.stringify(data.user));
                router.replace('/');
            } else {
                Toast.show({ type: 'error', text1: 'Invalid username or password' });
            }
        } catch {
            Toast.show({ type: 'error', text1: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Text style={styles.title}>Log In</Text>

            <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
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
                render={({ field: { onChange, value } }) => (
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

            <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Submit'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.link}>Don't have an account yet? Sign up here</Text>
            </TouchableOpacity>

            <Toast />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
    button: { backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    link: { marginTop: 16, textAlign: 'center', color: '#228be6' }
});

export default LogIn;
