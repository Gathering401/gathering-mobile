import {useState} from 'react';
import {useRouter} from 'expo-router';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Calendar} from 'react-native-calendars';
import {Text, TouchableOpacity, ScrollView, ActivityIndicator, View, Modal} from 'react-native';
import dayjs from 'dayjs';
import {styles} from "../../styles";
import {Rsvp, getRsvpLabelFor, getRsvpsForDropdown} from "../../constants/enums/Rsvp";
import {Repetition} from "../../constants/enums/Repetition";
import {useAuthHeader} from '../../hooks/useAuthHeader';
import {useRsvpUpdate} from '../../hooks/useRsvpUpdate';

interface CalendarEvent {
    id: number;
    name: string;
    description: string;
    date: string;
    groupId: number;
    groupName: string;
    myRsvp: Rsvp;
    repetition: Repetition;
    seriesId: number;
}

const rsvpColor = (rsvp: Rsvp): string => {
    switch (rsvp) {
        case Rsvp.attending:
            return '#40c057';
        case Rsvp.maybe:
            return '#fab005';
        case Rsvp.rejected:
            return '#fa5252';
        default:
            return '#868e96';
    }
};

const Main = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [rsvpPickerEvent, setRsvpPickerEvent] = useState<CalendarEvent | null>(null);

    const authHeader = useAuthHeader();

    const {isLoading, data: events = [], refetch} = useQuery<CalendarEvent[]>({
        queryKey: ['events'],
        enabled: !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/all`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await response.json();
            if (data.success) {
                return data.response;
            }
            throw new Error(data.error);
        }
    });

    const {updateRsvp} = useRsvpUpdate(async () => {
        if (rsvpPickerEvent) {
            await queryClient.invalidateQueries({queryKey: [`eventId-${rsvpPickerEvent.id}`]});
        }
        await refetch();
        setRsvpPickerEvent(null);
    });

    const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        const key = dayjs(event.date).format('YYYY-MM-DD');
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(event);
        return acc;
    }, {});

    const markedDates = Object.keys(eventsByDate).reduce<Record<string, any>>((acc, key) => {
        const dayEvents = eventsByDate[key];
        const hasPending = dayEvents.some(e => e.myRsvp === Rsvp.pending);
        const hasResponded = dayEvents.some(e => e.myRsvp !== Rsvp.pending);

        const dots = [];
        if (hasPending) {
            dots.push({key: 'pending', color: '#ef4444'});
        }
        if (hasResponded) {
            dots.push({key: 'responded', color: '#228be6'});
        }

        acc[key] = {dots, selected: key === selectedDate, selectedColor: '#228be6'};
        return acc;
    }, {});

    if (!markedDates[selectedDate]) {
        markedDates[selectedDate] = {selected: true, selectedColor: '#228be6', dots: []};
    } else {
        markedDates[selectedDate].selected = true;
        markedDates[selectedDate].selectedColor = '#228be6';
    }

    const selectedEvents = (eventsByDate[selectedDate] ?? [])
        .slice()
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    const formattedSelected = dayjs(selectedDate).format('MMMM D, YYYY');
    const rsvpOptions = getRsvpsForDropdown();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" style={{marginTop: 40}}/>
            ) : (
                <>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        markingType="multi-dot"
                        theme={{
                            todayTextColor: '#228be6',
                            selectedDayBackgroundColor: '#228be6',
                            dotColor: '#228be6',
                            arrowColor: '#228be6',
                        }}
                    />
                    <Text style={styles.dateTitle}>{formattedSelected}</Text>
                    {selectedEvents.length === 0 ? (
                        <Text style={styles.emptyText}>No events on {formattedSelected}</Text>
                    ) : (
                        selectedEvents.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                style={styles.card}
                                onPress={() => router.push({
                                    pathname: `/event/${event.id}`,
                                    params: {groupId: String(event.groupId)}
                                })}
                            >
                                <Text style={styles.cardTitle}>{event.name}</Text>
                                <Text style={styles.cardGroup}>{event.groupName}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardTime}>{dayjs(event.date).format('h:mm A')}</Text>
                                    <TouchableOpacity
                                        style={[styles.rsvpPill, {backgroundColor: rsvpColor(event.myRsvp) + '22'}]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setRsvpPickerEvent(event);
                                        }}
                                    >
                                        <Text style={[styles.rsvpPillText, {color: rsvpColor(event.myRsvp)}]}>
                                            {getRsvpLabelFor(event.myRsvp)} ▾
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                    <Modal visible={!!rsvpPickerEvent} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Update RSVP</Text>
                                {rsvpOptions.map((opt: { label: string; value: string }) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={styles.modalOption}
                                        onPress={() => updateRsvp(
                                            rsvpPickerEvent!.groupId,
                                            rsvpPickerEvent!.id,
                                            rsvpPickerEvent!.repetition,
                                            Number(opt.value) as Rsvp
                                        )}
                                    >
                                        <Text style={styles.modalOptionText}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity onPress={() => setRsvpPickerEvent(null)}>
                                    <Text style={styles.modalCancel}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </>
            )}
        </ScrollView>
    );
}

export default Main
