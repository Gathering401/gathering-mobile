import {useEffect} from 'react';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform
} from 'react-native';
import {styles} from '../styles/login';

interface ResetPasswordValues {
    newPassword: string;
    confirmPassword: string;
}

const ResetPassword = () => {
    const router = useRouter();
    const {token} = useLocalSearchParams<{token: string}>();
    const {control, handleSubmit, watch} = useForm<ResetPasswordValues>({
        defaultValues: {
            newPassword: '',
            confirmPassword: ''
        }
    });

    useEffect(() => {
        if (!token) {
            router.replace('/login');
        }
    }, [token]);

    const onSubmit = async (values: ResetPasswordValues) => {
        if (values.newPassword !== values.confirmPassword) {
            Toast.show({type: 'error', text1: 'Passwords do not match'});
            return;
        }

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reset-password`, {
                body: JSON.stringify({token, newPassword: values.newPassword}),
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });

            const data = await response.json();

            if (data.success) {
                Toast.show({type: 'success', text1: 'Password reset successfully'});
                router.replace('/login');
            } else {
                Toast.show({type: 'error', text1: 'Invalid or expired reset link'});
            }
        } catch {
            Toast.show({type: 'error', text1: 'Something went wrong. Please try again.'});
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Text style={styles.title}>Reset Password</Text>
            <Controller
                control={control}
                name="newPassword"
                render={({field: {onChange, value}}) => (
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            secureTextEntry
                            value={value}
                            onChangeText={onChange}
                        />
                    </View>
                )}
            />
            <Controller
                control={control}
                name="confirmPassword"
                render={({field: {onChange, value}}) => (
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
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
            >
                <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
            <Toast/>
        </KeyboardAvoidingView>
    );
}

export default ResetPassword;
