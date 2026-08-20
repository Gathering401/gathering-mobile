import {useState, useEffect} from 'react';
import {useRouter, useLocalSearchParams} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useForm, Controller} from 'react-hook-form';
import {useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
    View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback,
    Switch, ScrollView, KeyboardAvoidingView, Keyboard, Platform
} from 'react-native';
import {styles} from '../styles/new-group';

interface GroupValues {
    name: string;
    description: string;
    public: boolean;
}

const GroupForm = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const queryClient = useQueryClient();
    const [token, setToken] = useState<string | null>(null);

    const isEditing = !!params.id;

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    const {control, handleSubmit} = useForm<GroupValues>({
        defaultValues: {
            name: (params.name as string) ?? '',
            description: (params.description as string) ?? '',
            public: params.public !== undefined ? params.public === 'true' : true
        }
    });

    const onSubmit = async (values: GroupValues) => {
        if (!(/[A-Z0-9]{1,50}/i).test(values.name)) {
            return Toast.show({type: 'error', text1: 'Name', text2: 'Group name cannot exceed 50 characters'});
        }
        if (!(/[A-Z0-9]{1,200}/i).test(values.description)) {
            return Toast.show({
                type: 'error',
                text1: 'Description',
                text2: 'Group description cannot exceed 200 characters'
            });
        }

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group`, {
            body: JSON.stringify(isEditing ? {id: Number(params.id), ...values} : values),
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            await queryClient.invalidateQueries({queryKey: ['groups-my']});
            if (isEditing) {
                router.back();
            } else {
                router.replace(`/group/${data.response.id}`);
            }
        } else {
            Toast.show({type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.'});
        }
    }

    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>{isEditing ? 'Edit Group' : 'New Group'}</Text>
                    <Text style={styles.legend}><Text style={styles.required}>*</Text> Required</Text>

                    <Controller
                        control={control}
                        name="name"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    maxLength={50}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    value={value}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                    <Controller
                        control={control}
                        name="description"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    placeholder="Description"
                                    maxLength={200}
                                    multiline
                                    numberOfLines={4}
                                    autoCapitalize="sentences"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                    <Controller
                        control={control}
                        name="public"
                        render={({field: {onChange, value}}) => (
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabel}>
                                    <Text style={styles.label}>Is public?</Text>
                                    <Text style={styles.hint}>
                                        {value
                                            ? 'Anyone can join'
                                            : 'Users must be invited or accepted'}
                                    </Text>
                                </View>
                                <Switch value={value} onValueChange={onChange}/>
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
                    <Toast/>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default GroupForm;
