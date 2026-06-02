import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import _ from 'lodash';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { GatheringGroup } from '../constants/GatheringGroup';
import { Repetition, getRepetitionOptions, getRepetitionByValue, getRepetitionById } from '../constants/enums/Repetition';

interface EventValues {
    name: string;
    description: string;
    location: string;
    cost: string;
    date: Date;
    repetition: Repetition;
    groupId: number | null;
}

const EventForm = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGroupPicker, setShowGroupPicker] = useState(false);
    const [showRepetitionPicker, setShowRepetitionPicker] = useState(false);

    const isEditing = !!params.id;
    const editDateEnabled = params.editDateEnabled === 'true';

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
        SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    }, []);

    const { control, handleSubmit, watch, setValue } = useForm<EventValues>({
        defaultValues: {
            name: (params.name as string) ?? '',
            description: (params.description as string) ?? '',
            location: (params.location as string) ?? '',
            cost: (params.cost as string) ?? '0',
            date: params.date ? new Date(params.date as string) : new Date(),
            repetition: params.repetition ? Number(params.repetition) as Repetition : Repetition.none,
            groupId: params.groupId ? Number(params.groupId) : null
        }
    });

    const selectedDate = watch('date');
    const selectedGroupId = watch('groupId');
    const selectedRepetition = watch('repetition');

    const { isLoading, data: myGroups = [] } = useQuery<GatheringGroup[]>({
        queryKey: ['groups'],
        enabled: !!token,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/my-groups`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });

    const mapValuesToEventPost = (values: EventValues) => {
        const dates = [];
        let interval: 'year' | 'month' | 'week' | undefined;
        let count: number;

        switch (values.repetition) {
            case Repetition.annually: interval = 'year'; count = 100; break;
            case Repetition.monthly: interval = 'month'; count = 60; break;
            case Repetition.weekly: interval = 'week'; count = 104; break;
            default: interval = undefined; count = 1; break;
        }

        for (let i = 0; i < count; i++) {
            dates.push(dayjs(values.date).add(i, interval).toISOString());
        }

        return {
            name: values.name,
            description: values.description,
            location: values.location,
            dates,
            groupId: values.groupId,
            hostId: user?.id,
            cost: Number(values.cost),
            repetition: values.repetition,
        };
    };

    const onSubmit = async (values: EventValues) => {
        if (!(/[A-Z0-9]{1,50}/i).test(values.name)) {
            return Toast.show({ type: 'error', text1: 'Name', text2: 'Event name cannot exceed 50 characters' });
        }
        if (!(/[A-Z0-9]{1,200}/i).test(values.description)) {
            return Toast.show({ type: 'error', text1: 'Description', text2: 'Event description cannot exceed 500 characters' });
        }
        if (!(/[A-Z0-9]{1,100}/i).test(values.location)) {
            return Toast.show({ type: 'error', text1: 'Location', text2: 'Event location cannot exceed 100 characters' });
        }
        if (dayjs(values.date).isBefore(dayjs().add(1, 'day'))) {
            return Toast.show({ type: 'error', text1: 'Date', text2: 'Event date must be in the future' });
        }

        let url: string;
        let method: string;
        let body: object;

        if (isEditing) {
            const queryParams = new URLSearchParams({
                id: String(values.groupId),
                eventId: String(params.id),
            });
            if (params.seriesId) queryParams.set('seriesId', String(params.seriesId));
            url = `${process.env.EXPO_PUBLIC_API_URL}/event?${queryParams.toString()}`;
            method = 'PUT';
            body = {
                id: Number(params.id),
                name: values.name,
                description: values.description,
                location: values.location,
                cost: Number(values.cost),
                date: editDateEnabled ? dayjs(values.date).toISOString() : undefined,
                repetition: values.repetition,
                group_id: values.groupId,
            };
        } else {
            url = `${process.env.EXPO_PUBLIC_API_URL}/event?id=${values.groupId}`;
            method = 'POST';
            body = mapValuesToEventPost(values);
        }

        const response = await fetch(url, {
            body: JSON.stringify(body),
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            router.replace({
                pathname: isEditing ? `/event/${params.id}` : `/event/${data.response.id}`,
                params: { groupId: String(values.groupId) }
            });
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.' });
        }
    };

    const repetitionOptions = getRepetitionOptions();
    const selectedGroup = myGroups.find(g => g.id === selectedGroupId);

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{isEditing ? 'Edit Event' : 'New Event'}</Text>

                {(['name', 'description', 'location'] as const).map((field) => (
                    <Controller
                        key={field}
                        control={control}
                        name={field}
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>{_.startCase(field)}</Text>
                                <TextInput
                                    style={[styles.input, field === 'description' && styles.textarea]}
                                    placeholder={_.startCase(field)}
                                    maxLength={field === 'name' ? 50 : field === 'description' ? 500 : 100}
                                    multiline={field === 'description'}
                                    numberOfLines={field === 'description' ? 4 : 1}
                                    value={value as string}
                                    onChangeText={onChange}
                                />
                            </View>
                        )}
                    />
                ))}

                <Controller
                    control={control}
                    name="cost"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Cost ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="decimal-pad"
                                value={String(value)}
                                onChangeText={onChange}
                            />
                        </View>
                    )}
                />

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.selectButton, (isEditing && !editDateEnabled) && styles.disabled]}
                        onPress={() => !(isEditing && !editDateEnabled) && setShowDatePicker(true)}
                    >
                        <Text style={{ color: '#333' }}>
                            {dayjs(selectedDate).format('MMM D, YYYY h:mm A')}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="datetime"
                            display="default"
                            minimumDate={new Date()}
                            onChange={(_, date) => {
                                setShowDatePicker(false);
                                if (date) setValue('date', date);
                            }}
                        />
                    )}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Repetition</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.selectButton, isEditing && styles.disabled]}
                        onPress={() => !isEditing && setShowRepetitionPicker(true)}
                    >
                        <Text style={{ color: '#333' }}>
                            {getRepetitionById(selectedRepetition) ?? 'Select repetition'}
                        </Text>
                    </TouchableOpacity>
                    <Modal visible={showRepetitionPicker} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Repetition</Text>
                                {repetitionOptions.map((opt: { label: string; value: string }) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            setValue('repetition', getRepetitionByValue(opt.value));
                                            setShowRepetitionPicker(false);
                                        }}
                                    >
                                        <Text style={styles.modalOptionText}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity onPress={() => setShowRepetitionPicker(false)}>
                                    <Text style={styles.modalCancel}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Group</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.selectButton, isEditing && styles.disabled]}
                        onPress={() => !isEditing && setShowGroupPicker(true)}
                    >
                        <Text style={{ color: selectedGroup ? '#333' : '#999' }}>
                            {isLoading ? 'Loading...' : selectedGroup?.name ?? 'Select a group'}
                        </Text>
                    </TouchableOpacity>
                    <Modal visible={showGroupPicker} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Select Group</Text>
                                {myGroups.map((g) => (
                                    <TouchableOpacity
                                        key={g.id}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            setValue('groupId', g.id);
                                            setShowGroupPicker(false);
                                        }}
                                    >
                                        <Text style={styles.modalOptionText}>{g.name}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
                                    <Text style={styles.modalCancel}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)}>
                        <Text style={styles.submitText}>{isEditing ? 'Save' : 'Submit'}</Text>
                    </TouchableOpacity>
                </View>

                <Toast />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
    textarea: { height: 100, textAlignVertical: 'top' },
    selectButton: { justifyContent: 'center' },
    disabled: { backgroundColor: '#f5f5f5', color: '#999' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 14, alignItems: 'center' },
    cancelText: { fontSize: 16, color: '#444' },
    submitButton: { flex: 1, backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalOptionText: { fontSize: 16 },
    modalCancel: { textAlign: 'center', color: '#228be6', marginTop: 16, fontSize: 16 },
});

export default EventForm;