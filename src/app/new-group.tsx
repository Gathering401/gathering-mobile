import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity,
    Switch, StyleSheet, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';

interface GroupValues {
    name: string;
    description: string;
    public: boolean;
}

const GroupForm = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [token, setToken] = useState<string | null>(null);

    const isEditing = !!params.id;

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    const { control, handleSubmit } = useForm<GroupValues>({
        defaultValues: {
            name: (params.name as string) ?? '',
            description: (params.description as string) ?? '',
            public: params.public === 'true' ? true : params.public === 'false' ? false : true
        }
    });

    const onSubmit = async (values: GroupValues) => {
        if (!(/[A-Z0-9]{1,50}/i).test(values.name)) {
            return Toast.show({ type: 'error', text1: 'Name', text2: 'Group name cannot exceed 50 characters' });
        }
        if (!(/[A-Z0-9]{1,200}/i).test(values.description)) {
            return Toast.show({ type: 'error', text1: 'Description', text2: 'Group description cannot exceed 200 characters' });
        }

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group`, {
            body: JSON.stringify(isEditing ? { id: Number(params.id), ...values } : values),
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            router.replace(isEditing ? `/group/${params.id}` : `/group/${data.response.id}`);
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.' });
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{isEditing ? 'Edit Group' : 'New Group'}</Text>

                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                maxLength={50}
                                value={value}
                                onChangeText={onChange}
                            />
                        </View>
                    )}
                />

                <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                placeholder="Description"
                                maxLength={200}
                                multiline
                                numberOfLines={4}
                                value={value}
                                onChangeText={onChange}
                            />
                        </View>
                    )}
                />

                <Controller
                    control={control}
                    name="public"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Text style={styles.label}>Is public?</Text>
                                <Text style={styles.hint}>
                                    {value
                                        ? 'Anyone can join and cannot be banned.'
                                        : 'Users must be invited or accepted, and cannot rejoin if removed.'}
                                </Text>
                            </View>
                            <Switch value={value} onValueChange={onChange} />
                        </View>
                    )}
                />

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit(onSubmit)}
                    >
                        <Text style={styles.submitText}>{isEditing ? 'Save' : 'Submit'}</Text>
                    </TouchableOpacity>
                </View>

                <Toast />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    hint: { fontSize: 12, color: '#666', marginTop: 2 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
    textarea: { height: 100, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    switchLabel: { flex: 1, marginRight: 12 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 14, alignItems: 'center' },
    cancelText: { fontSize: 16, color: '#444' },
    submitButton: { flex: 1, backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default GroupForm;