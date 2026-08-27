import {useEffect, useState} from 'react';
import {useRouter, useLocalSearchParams} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {useForm, Controller} from 'react-hook-form';
import Toast, {BaseToast, ErrorToast} from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import _ from 'lodash';
import dayjs from 'dayjs';
import {
    View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard,
    KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import {styles} from "../styles/signup";
import {colors} from "../styles/colors";
import {usePushToken} from "../hooks/usePushToken";

interface SignUpValues {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    birthdate?: Date;
    phone: string;
    zipCode: string;
    password: string;
    confirmPassword: string;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const nameRegex = /^[a-z ,.'-]{2,64}$/i;
const usernameRegex = /^[a-zA-Z0-9_.]{3,50}$/;
const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
const zipCodeRegex = /^\d{5}$/;

const nameFields = ['username', 'firstName', 'lastName'];
const capitalizeFirstOnly = ['firstName', 'lastName'];
const maxLengths: Record<string, number> = {
    username: 50,
    firstName: 64,
    lastName: 64,
    email: 254,
    phone: 12,
    zipCode: 5
};

const datePickerFallback = dayjs().subtract(13, 'years').toDate();

const toastConfig = {
    error: (props: any) => (
        <ErrorToast {...props} text1NumberOfLines={2} text2NumberOfLines={0}/>
    ),
    success: (props: any) => (
        <BaseToast {...props} text1NumberOfLines={2} text2NumberOfLines={0}/>
    )
};

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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const {registerPushToken} = usePushToken();

    const isEdit = params.isEdit === 'true';
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    const {control, handleSubmit} = useForm<SignUpValues>({
        defaultValues: {
            username: (params.username as string) ?? '',
            email: (params.email as string) ?? '',
            firstName: (params.firstName as string) ?? '',
            lastName: (params.lastName as string) ?? '',
            birthdate: params.birthdate ? dayjs(params.birthdate as string).toDate() : undefined,
            phone: (params.phone as string) ?? '',
            zipCode: (params.zipCode as string) ?? '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (values: SignUpValues) => {
        if (!usernameRegex.test(values.username)) {
            return Toast.show({
                type: 'error',
                text1: 'Username',
                text2: 'Username must be 3-50 characters and may only contain letters, numbers, underscores, and periods'
            });
        }
        if (!emailRegex.test(values.email)) {
            return Toast.show({type: 'error', text1: 'Email', text2: 'Invalid email address'});
        }
        if (!nameRegex.test(values.firstName)) {
            return Toast.show({type: 'error', text1: 'First Name', text2: 'Invalid first name'});
        }
        if (!nameRegex.test(values.lastName)) {
            return Toast.show({type: 'error', text1: 'Last Name', text2: 'Invalid last name'});
        }
        if (!values.birthdate) {
            return Toast.show({type: 'error', text1: 'Birthdate', text2: 'Birthdate is required'});
        }
        if (dayjs().diff(dayjs(values.birthdate), 'years') < 13) {
            return Toast.show({type: 'error', text1: 'Birthdate', text2: 'Must be older than 13 to sign up'});
        }
        if (!phoneRegex.test(values.phone)) {
            return Toast.show({type: 'error', text1: 'Phone', text2: 'Format must be ###-###-####'});
        }
        if (!zipCodeRegex.test(values.zipCode)) {
            return Toast.show({type: 'error', text1: 'Zip Code', text2: 'Please enter a valid 5 digit zip code'});
        }
        if (!isEdit && !passwordRegex.test(values.password)) {
            return Toast.show({
                type: 'error',
                text1: 'Password',
                text2: 'Minimum 8 characters, 1 number, 1 uppercase, 1 lowercase, 1 symbol'
            });
        }
        if (!isEdit && values.password !== values.confirmPassword) {
            return Toast.show({type: 'error', text1: 'Confirm Password', text2: 'Passwords do not match'});
        }
        if (!isEdit && !termsAccepted) {
            return Toast.show({
                type: 'error',
                text1: 'Terms',
                text2: 'You must accept the Terms of Service and Privacy Policy to continue'
            });
        }

        setLoading(true);
        try {
            const url = isEdit
                ? `${process.env.EXPO_PUBLIC_API_URL}/user`
                : `${process.env.EXPO_PUBLIC_API_URL}/signup`;

            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit
                ? _.pick(values, ['firstName', 'lastName', 'phone', 'zipCode'])
                : _.omit(values, 'confirmPassword');

            const response = await fetch(url, {
                body: JSON.stringify(body),
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(isEdit && token ? {'Authorization': `Bearer ${token}`} : {})
                }
            });

            const data = await response.json();

            if (data.success) {
                if (!isEdit) {
                    await SecureStore.setItemAsync('token', data.token);
                    await SecureStore.setItemAsync('user', JSON.stringify(data.response));
                    await registerPushToken(data.token);
                } else {
                    const current = await SecureStore.getItemAsync('user');
                    const currentUser = current ? JSON.parse(current) : {};
                    await SecureStore.setItemAsync('user', JSON.stringify({...currentUser, ...body}));
                }
                router.replace(isEdit ? '/profile' : '/');
            } else {
                Toast.show({type: 'error', text1: 'Error', text2: data.error || 'Something went wrong. Please try again.'});
            }
        } catch {
            Toast.show({type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.'});
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field: keyof Omit<SignUpValues, 'birthdate'>, disabled = false) => (
        <Controller
            key={field}
            control={control}
            name={field}
            render={({field: {onChange, value}}) => (
                <View>
                    <Text style={styles.label}>{_.startCase(field)} <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={disabled ? styles.inputDisabled : styles.input}
                        placeholder={field === 'phone' ? '###-###-####' : field === 'zipCode' ? '#####' : _.startCase(field)}
                        autoCapitalize={capitalizeFirstOnly.includes(field) ? 'words' : 'none'}
                        autoCorrect={!nameFields.includes(field)}
                        keyboardType={field === 'email'
                            ? 'email-address' : field === 'phone'
                                ? 'phone-pad' : field === 'zipCode'
                                    ? 'number-pad' : 'default'}
                        editable={!disabled}
                        value={value}
                        onChangeText={field === 'phone' ? (v) => onChange(formatPhone(v)) : onChange}
                        maxLength={maxLengths[field]}
                    />
                </View>
            )}
        />
    );

    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>{isEdit ? 'Edit Profile' : 'Sign Up'}</Text>
                    <Text style={styles.legend}><Text style={styles.required}>*</Text> Required</Text>

                    <View style={styles.fieldContainer}>
                        {renderField('username', isEdit)}
                    </View>
                    <View style={styles.row}>
                        <View style={styles.halfField}>{renderField('firstName')}</View>
                        <View style={styles.halfField}>{renderField('lastName')}</View>
                    </View>
                    <View style={styles.fieldContainer}>
                        {renderField('email', isEdit)}
                    </View>
                    <Controller
                        control={control}
                        name="birthdate"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Birthdate <Text style={styles.required}>*</Text></Text>
                                <TouchableOpacity
                                    style={isEdit ? styles.inputDisabled : styles.input}
                                    onPress={() => !isEdit && setShowDatePicker(true)}
                                    disabled={isEdit}
                                >
                                    <Text style={{
                                        fontSize: 16,
                                        color: value ? (isEdit ? colors.terracotta.secondary : colors.terracotta.text) : colors.sage.secondary
                                    }}>
                                        {value ? dayjs(value).format('MM/DD/YYYY') : 'Select your birthdate'}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && Platform.OS === 'ios' && (
                                    <Modal visible={showDatePicker} transparent animationType="slide">
                                        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
                                            <View style={styles.modalOverlay}>
                                                <TouchableWithoutFeedback>
                                                    <View style={styles.modalContent}>
                                                        <DateTimePicker
                                                            value={value ?? datePickerFallback}
                                                            mode="date"
                                                            display="spinner"
                                                            onChange={(_, date) => {
                                                                if (date) onChange(date);
                                                            }}
                                                        />
                                                        <TouchableOpacity
                                                            style={styles.secondaryButton}
                                                            onPress={() => setShowDatePicker(false)}
                                                        >
                                                            <Text style={styles.secondaryButtonText}>Done</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </Modal>
                                )}
                                {showDatePicker && Platform.OS !== 'ios' && (
                                    <DateTimePicker
                                        value={value ?? datePickerFallback}
                                        mode="date"
                                        display="default"
                                        onChange={(_, date) => {
                                            setShowDatePicker(false);
                                            if (date) onChange(date);
                                        }}
                                    />
                                )}
                            </View>
                        )}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfField}>{renderField('phone')}</View>
                        <View style={styles.halfField}>{renderField('zipCode')}</View>
                    </View>

                    {!isEdit && (
                        <>
                            <Controller
                                control={control}
                                name="password"
                                render={({field: {onChange, value}}) => (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Password <Text
                                            style={styles.required}>*</Text></Text>
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
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({field: {onChange, value}}) => (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Confirm Password <Text
                                            style={styles.required}>*</Text></Text>
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
                            <View style={styles.checkboxRow}>
                                <TouchableOpacity
                                    style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                                    onPress={() => setTermsAccepted((prev) => !prev)}
                                >
                                    {termsAccepted && <Text style={styles.checkboxCheckmark}>✓</Text>}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>
                                    I agree to the{' '}
                                    <Text
                                        style={styles.checkboxLink}
                                        onPress={() => WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/terms.html`)}
                                    >
                                        Terms of Service
                                    </Text>
                                    {' '}and{' '}
                                    <Text
                                        style={styles.checkboxLink}
                                        onPress={() => WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/privacy.html`)}
                                    >
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </View>
                        </>
                    )}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSubmit(onSubmit)}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Submitting...' : isEdit ? 'Save' : 'Submit'}</Text>
                    </TouchableOpacity>
                    {isEdit ? (
                        <>
                            <TouchableOpacity onPress={() => router.push('/change-password')}>
                                <Text style={styles.editLink}>Change Password</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.editLink}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.link}>Already have an account? Log in here</Text>
                        </TouchableOpacity>
                    )}
                    <Toast config={toastConfig}/>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default SignUp;
