import {useEffect, useState} from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import _ from 'lodash';
import dayjs from 'dayjs';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import {styles} from "../styles/signup";

interface SignUpValues {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const nameRegex = /^[a-z ,.'-]{2,64}$/i;
const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const SignUp = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(false);

    const isEdit = params.isEdit === 'true';
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    const { control, handleSubmit, getValues } = useForm<SignUpValues>({
        defaultValues: {
            username: (params.username as string) ?? '',
            email: (params.email as string) ?? '',
            firstName: (params.firstName as string) ?? '',
            lastName: (params.lastName as string) ?? '',
            birthdate: params.birthdate ? dayjs(params.birthdate as string).format('MM/DD/YYYY') : '',
            phone: (params.phone as string) ?? '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (values: SignUpValues) => {
        if (!emailRegex.test(values.email)) {
            return Toast.show({ type: 'error', text1: 'Email', text2: 'Invalid email address' });
        }
        if (!nameRegex.test(values.firstName)) {
            return Toast.show({ type: 'error', text1: 'First Name', text2: 'Invalid first name' });
        }
        if (!nameRegex.test(values.lastName)) {
            return Toast.show({ type: 'error', text1: 'Last Name', text2: 'Invalid last name' });
        }
        if (dayjs(values.birthdate).add(13, 'years').isAfter(dayjs())) {
            return Toast.show({ type: 'error', text1: 'Birthdate', text2: 'Must be older than 13 to sign up' });
        }
        if (!phoneRegex.test(values.phone)) {
            return Toast.show({ type: 'error', text1: 'Phone', text2: 'Format must be ###-###-####' });
        }
        if (!isEdit && !passwordRegex.test(values.password)) {
            return Toast.show({ type: 'error', text1: 'Password', text2: 'Minimum 8 characters, 1 number, 1 uppercase, 1 lowercase, 1 symbol' });
        }
        if (!isEdit && values.password !== values.confirmPassword) {
            return Toast.show({ type: 'error', text1: 'Confirm Password', text2: 'Passwords do not match' });
        }

        setLoading(true);
        try {
            const url = isEdit
                ? `${process.env.EXPO_PUBLIC_API_URL}/user`
                : `${process.env.EXPO_PUBLIC_API_URL}/signup`;

            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit
                ? _.pick(values, ['firstName', 'lastName', 'phone'])
                : _.omit(values, 'confirmPassword');

            const response = await fetch(url, {
                body: JSON.stringify(body),
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(isEdit && token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            const data = await response.json();

            if (data.success) {
                if (!isEdit) {
                    await SecureStore.setItemAsync('token', data.token);
                    await SecureStore.setItemAsync('user', JSON.stringify(data.response));
                } else {
                    const current = await SecureStore.getItemAsync('user');
                    const currentUser = current ? JSON.parse(current) : {};
                    await SecureStore.setItemAsync('user', JSON.stringify({ ...currentUser, ...body }));
                }
                router.replace(isEdit ? '/profile' : '/');
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.' });
            }
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{isEdit ? 'Edit Profile' : 'Sign Up'}</Text>

                {(['username', 'firstName', 'lastName', 'email', 'birthdate', 'phone'] as const).map((field) => (
                    <Controller
                        key={field}
                        control={control}
                        name={field as any}
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>{_.startCase(field)}</Text>
                                <TextInput
                                    style={isEdit && ['username', 'email', 'birthdate'].includes(field) ? styles.inputDisabled : styles.input}
                                    placeholder={field === 'phone' ? '###-###-####' : _.startCase(field)}
                                    autoCapitalize="none"
                                    keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
                                    editable={!(isEdit && (field === 'username' || field === 'email' || field === 'birthdate'))}
                                    value={value}
                                    onChangeText={field === 'phone' ? (v) => onChange(formatPhone(v)) : onChange}
                                />
                            </View>
                        )}
                    />
                ))}

                {!isEdit && (['password', 'confirmPassword'] as const).map((field) => (
                    <Controller
                        key={field}
                        control={control}
                        name={field as any}
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>{_.startCase(field)}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={_.startCase(field)}
                                    secureTextEntry
                                    value={value}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                ))}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Submitting...' : isEdit ? 'Save' : 'Submit'}</Text>
                </TouchableOpacity>

                {!isEdit && (
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.link}>Already have an account? Log in here</Text>
                    </TouchableOpacity>
                )}

                <Toast />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default SignUp;
