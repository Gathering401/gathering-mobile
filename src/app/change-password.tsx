import {useRouter} from 'expo-router';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {styles} from '../styles/login';
import {useAuthHeader} from '../hooks/useAuthHeader';

interface ChangePasswordValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const ChangePassword = () => {
    const router = useRouter();
    const authHeader = useAuthHeader();
    const {control, handleSubmit} = useForm<ChangePasswordValues>({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (values: ChangePasswordValues) => {
        if (values.newPassword !== values.confirmPassword) {
            Toast.show({type: 'error', text1: 'Passwords do not match'});
            return;
        }

        try {
            const headers = await authHeader();
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/password`, {
                body: JSON.stringify({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword
                }),
                method: 'PUT',
                headers: {'Content-Type': 'application/json', ...headers}
            });

            const data = await response.json();

            if (data.success) {
                await SecureStore.deleteItemAsync('token');
                await SecureStore.deleteItemAsync('user');
                router.replace('/login');
            } else {
                Toast.show({type: 'error', text1: 'Current password is incorrect'});
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
            <Text style={styles.title}>Change Password</Text>
            <Controller
                control={control}
                name="currentPassword"
                render={({field: {onChange, value}}) => (
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Current Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            secureTextEntry
                            value={value}
                            onChangeText={onChange}
                        />
                    </View>
                )}
            />
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
                <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <Toast/>
        </KeyboardAvoidingView>
    );
}

export default ChangePassword;
