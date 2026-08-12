import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useForm, Controller} from 'react-hook-form';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
    TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { GatheringGroup } from '../constants/GatheringGroup';
import { Repetition, getRepetitionOptions, getRepetitionByValue } from '../constants/enums/Repetition';
import {styles} from "../styles/new-event";
import {AddressAutocomplete, AddressAutocompleteHandle} from "../components/AddressAutoComplete";
import {SafeAreaView} from "react-native-safe-area-context";

interface EventValues {
    name: string;
    description: string;
    location: string;
    cost: string;
    date: Date | null;
    repetition: Repetition;
    groupId: number | null;
}

const EventForm = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const queryClient = useQueryClient();
    const scrollViewRef = useRef<ScrollView>(null);
    const locationRef = useRef<AddressAutocompleteHandle>(null);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGroupPicker, setShowGroupPicker] = useState(false);
    const [showRepetitionPicker, setShowRepetitionPicker] = useState(false);
    const [dateFieldY, setDateFieldY] = useState(0);

    const isEditing = !!params.id;
    const editDateEnabled = params.editDateEnabled === 'true';
    const businessInvitationId = params.businessInvitationId ? Number(params.businessInvitationId) : undefined;

    const locationDisabled = !!businessInvitationId;
    const dateDisabled = isEditing && !editDateEnabled;
    const repetitionDisabled = isEditing;
    const groupDisabled = isEditing || !!params.groupId;

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
        SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    }, []);

    useEffect(() => {
        if (showDatePicker) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: dateFieldY, animated: true });
            }, 100);
        }
    }, [showDatePicker, dateFieldY]);

    const { control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            name: (params.name as string) ?? '',
            description: (params.description as string) ?? '',
            location: (params.location as string) ?? '',
            cost: (params.cost as string) ?? '0',
            date: params.date ? new Date(params.date as string) : null,
            repetition: params.repetition ? Number(params.repetition) as Repetition : Repetition.none,
            groupId: params.groupId ? Number(params.groupId) : null
        }
    });

    const selectedDate = watch('date');
    const selectedGroupId = watch('groupId');
    const selectedRepetition = watch('repetition');

    const { isLoading, data: myGroups = [] } = useQuery<GatheringGroup[]>({
        queryKey: ['groups', 'creatable'],
        enabled: !!token,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/creatable`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                return data.response;
            }

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
            ...(businessInvitationId ? {businessInvitationId} : {})
        };
    };

    const { mutate: submitEvent, isPending } = useMutation({
        mutationFn: async (values: EventValues) => {
            let url: string;
            let method: string;
            let body: object;

            if (isEditing) {
                const queryParams = new URLSearchParams({
                    id: String(values.groupId),
                    eventId: String(params.id),
                });

                if (params.seriesId) {
                    queryParams.set('seriesId', String(params.seriesId));
                }

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
            if (!data.success) {
                throw new Error(data.error);
            }

            return {
                data,
                groupId: values.groupId
            }
        },
        onSuccess: async ({ data, groupId }) => {
            if (isEditing) {
                await queryClient.invalidateQueries({ queryKey: [`eventId-${params.id}`] });
                await queryClient.invalidateQueries({ queryKey: [`groupId-${groupId}`] });
                await queryClient.invalidateQueries({ queryKey: ['events'] });
            } else {
                await queryClient.invalidateQueries({ queryKey: [`groupId-${groupId}`] });
                await queryClient.invalidateQueries({ queryKey: ['events'] });
            }
            if (businessInvitationId) {
                await queryClient.invalidateQueries({ queryKey: ['activeInvitations'] });
            }
            router.replace({
                pathname: isEditing ? `/event/${params.id}` : `/event/${data.response.id}`,
                params: { groupId: String(groupId) }
            });
        },
        onError: () => {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Please try again.' });
        }
    });

    const onSubmit = (values: EventValues) => {
        if (!values.name.trim()) {
            return Toast.show({ type: 'error', text1: 'Name', text2: 'Event name is required' });
        }
        if (values.name.length > 50) {
            return Toast.show({ type: 'error', text1: 'Name', text2: 'Event name cannot exceed 50 characters' });
        }
        if (!values.description.trim()) {
            return Toast.show({ type: 'error', text1: 'Description', text2: 'Event description is required' });
        }
        if (values.description.length > 500) {
            return Toast.show({ type: 'error', text1: 'Description', text2: 'Event description cannot exceed 500 characters' });
        }
        if (!values.location.trim()) {
            return Toast.show({ type: 'error', text1: 'Location', text2: 'Event location is required' });
        }
        if (values.location.length > 100) {
            return Toast.show({ type: 'error', text1: 'Location', text2: 'Event location cannot exceed 100 characters' });
        }
        if (!values.date) {
            return Toast.show({ type: 'error', text1: 'Date', text2: 'Please select a date' });
        }
        if (dayjs(values.date).isBefore(dayjs().add(1, 'day'))) {
            return Toast.show({ type: 'error', text1: 'Date', text2: 'Event date must be in the future' });
        }
        submitEvent(values);
    }

    const repetitionOptions = getRepetitionOptions();
    const selectedGroup = myGroups.find(g => g.id === selectedGroupId);

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); locationRef.current?.blur(); }}>
                    <View style={{ flex: 1 }}>
                        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
                            <Text style={styles.title}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
                            <Text style={styles.legend}>* Required</Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Event Name<Text style={styles.required}> *</Text></Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Event Name"
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
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Description<Text style={styles.required}> *</Text></Text>
                                        <TextInput
                                            style={[styles.input, styles.textarea]}
                                            placeholder="Description"
                                            maxLength={500}
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
                                name="location"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Location<Text style={styles.required}> *</Text></Text>
                                        <AddressAutocomplete
                                            ref={locationRef}
                                            initialValue={value}
                                            disabled={locationDisabled}
                                            // error={errors.location?.message}
                                            onSelect={(lat, lng, address) => onChange(address)}
                                            onClear={() => onChange('')}
                                        />
                                    </View>
                                )}
                            />
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
                                            value={value}
                                            onChangeText={(text) => onChange(text.replace(/^0+(?=\d)/, ''))}
                                        />
                                    </View>
                                )}
                            />
                            <View
                                style={styles.fieldContainer}
                                onLayout={(e) => setDateFieldY(e.nativeEvent.layout.y)}
                            >
                                <Text style={styles.label}>Date<Text style={styles.required}> *</Text></Text>
                                <TouchableOpacity
                                    style={[styles.input, styles.selectButton, dateDisabled && styles.disabled]}
                                    disabled={dateDisabled}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={{ color: dateDisabled ? '#999' : selectedDate ? '#333' : '#999' }}>
                                        {selectedDate ? dayjs(selectedDate).format('MMM D, YYYY h:mm A') : 'Select date'}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <View>
                                        <DateTimePicker
                                            value={selectedDate ?? new Date()}
                                            mode="datetime"
                                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                            minimumDate={new Date()}
                                            minuteInterval={5}
                                            onChange={(_, date) => {
                                                if (date) {
                                                    setValue('date', date);
                                                }
                                            }}
                                        />
                                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowDatePicker(false)}>
                                            <Text style={styles.secondaryButtonText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Repetition</Text>
                                <TouchableOpacity
                                    style={[styles.input, styles.selectButton, repetitionDisabled && styles.disabled]}
                                    disabled={repetitionDisabled}
                                    onPress={() => setShowRepetitionPicker(true)}
                                >
                                    <Text style={{ color: repetitionDisabled ? '#999' : '#333' }}>
                                        {repetitionOptions.find(o => getRepetitionByValue(o.value) === selectedRepetition)?.label ?? 'Select repetition'}
                                    </Text>
                                </TouchableOpacity>
                                <Modal visible={showRepetitionPicker} transparent animationType="slide">
                                    <TouchableWithoutFeedback onPress={() => setShowRepetitionPicker(false)}>
                                        <View style={styles.modalOverlay}>
                                            <TouchableWithoutFeedback>
                                                <View style={styles.modalContent}>
                                                    <Text style={styles.modalTitle}>Repetition</Text>
                                                    {repetitionOptions.map((opt: { label: string; value: string }) => (
                                                        <TouchableOpacity
                                                            key={opt.value}
                                                            style={styles.modalOption}
                                                            onPress={() => {
                                                                setValue('repetition', getRepetitionByValue(opt.value) as Repetition);
                                                                setShowRepetitionPicker(false);
                                                            }}
                                                        >
                                                            <Text style={styles.modalOptionText}>{opt.label}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                    <TouchableOpacity onPress={() => setShowRepetitionPicker(false)}>
                                                        <Text style={styles.modalCancel}>Close</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            </View>
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Group<Text style={styles.required}> *</Text></Text>
                                <TouchableOpacity
                                    style={[styles.input, styles.selectButton, groupDisabled && styles.disabled]}
                                    disabled={groupDisabled}
                                    onPress={() => setShowGroupPicker(true)}
                                >
                                    <Text style={{ color: groupDisabled ? '#999' : selectedGroup ? '#333' : '#999' }}>
                                        {isLoading ? 'Loading...' : selectedGroup?.name ?? 'Select a group'}
                                    </Text>
                                </TouchableOpacity>
                                <Modal visible={showGroupPicker} transparent animationType="slide">
                                    <TouchableWithoutFeedback onPress={() => setShowGroupPicker(false)}>
                                        <View style={styles.modalOverlay}>
                                            <View style={styles.modalContent}>
                                                <Text style={styles.modalTitle}>Select Group</Text>
                                                {myGroups.map((g) => (
                                                    <TouchableOpacity
                                                        key={g.id}
                                                        style={styles.modalOption}
                                                        onPress={() => {
                                                            setValue('groupId', g.id as number);
                                                            setShowGroupPicker(false);
                                                        }}
                                                    >
                                                        <Text style={styles.modalOptionText}>{g.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                                <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
                                                    <Text style={styles.modalCancel}>Close</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            </View>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)} disabled={isPending}>
                                    {isPending
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.submitText}>{isEditing ? 'Save' : 'Submit'}</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                            <Toast />
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export default EventForm;
