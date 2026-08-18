import {useRouter} from 'expo-router';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {styles} from '../styles/login';
import {useAuthHeader} from '../hooks/useAuthHeader';

interface ChangePasswordValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
        if (!passwordRegex.test(values.newPassword)) {
            return Toast.show({
                type: 'error',
                text1: 'Password',
                text2: 'Minimum 8 characters, 1 number, 1 uppercase, 1 lowercase, 1 symbol'
            });
        }
        if (values.newPassword !== values.confirmPassword) {
            return Toast.show({type: 'error', text1: 'Confirm Password', text2: 'Passwords do not match'});
        }

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/password`, {
                body: JSON.stringify({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword
                }),
                method: 'PUT',
                headers: {'Content-Type': 'application/json', ...authHeader}
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
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
                </View>
            </TouchableWithoutFeedback>
            <Toast/>
        </KeyboardAvoidingView>
    );
}

export default ChangePassword;
