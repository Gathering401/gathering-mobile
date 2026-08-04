import {useState} from 'react';
import {useRouter} from 'expo-router';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform
} from 'react-native';
import {styles} from '../styles/login';

interface ForgotPasswordValues {
    email: string;
}

const ForgotPassword = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const {control, handleSubmit} = useForm<ForgotPasswordValues>({
        defaultValues: {
            email: ''
        }
    });

    const onSubmit = async (values: ForgotPasswordValues) => {
        setLoading(true);
        try {
            await fetch(`${process.env.EXPO_PUBLIC_API_URL}/forgot-password`, {
                body: JSON.stringify(values),
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
            setSubmitted(true);
        } catch {
            Toast.show({type: 'error', text1: 'Something went wrong. Please try again.'});
        } finally {
            setLoading(false);
        }
    }

    if (submitted) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.label}>If there is an account with that email, a reset link is on its way.</Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text style={styles.link}>Back to log in</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Controller
                        control={control}
                        name="email"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="gathering_user@example.com"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
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
                        <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.replace('/login')}>
                        <Text style={styles.link}>Back to log in</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
            <Toast/>
        </KeyboardAvoidingView>
    );
}

export default ForgotPassword;
