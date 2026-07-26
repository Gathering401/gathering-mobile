import {useState, useEffect} from 'react';
import {useLocalSearchParams, useRouter} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Calendar} from 'react-native-calendars';
import {Text, TouchableOpacity, ScrollView, ActivityIndicator, View, Modal} from 'react-native';
import dayjs from 'dayjs';
import {styles} from "../../styles";
import {Rsvp, getRsvpLabelFor, getRsvpsForDropdown} from "../../constants/enums/Rsvp";
import {Repetition} from "../../constants/enums/Repetition";
import {useAuthHeader} from '../../hooks/useAuthHeader';
import {useRsvpUpdate} from '../../hooks/useRsvpUpdate';
import {CalendarEvent} from "../../constants/CalendarEvent";
import {ActiveInvitation} from "../../constants/ActiveInvitation";

const APP_OPEN_PROMPT_KEY = 'lastInvitationPromptShown';

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

const formatInvitationDate = (dateStart: string | null, dateEnd: string | null): string => {
    if (!dateStart) {
        return 'Flexible dates';
    }
    if (!dateEnd || dateEnd === dateStart) {
        return dayjs(dateStart).format('MMM D');
    }
    return `${dayjs(dateStart).format('MMM D')} - ${dayjs(dateEnd).format('MMM D')}`;
};

const Main = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [rsvpPickerEvent, setRsvpPickerEvent] = useState<CalendarEvent | null>(null);
    const [selectedInvitation, setSelectedInvitation] = useState<ActiveInvitation | null>(null);

    const params = useLocalSearchParams<{invitationId?: string}>();

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

    const {isLoading: invitationsLoading, data: invitations = []} = useQuery<ActiveInvitation[]>({
        queryKey: ['activeInvitations'],
        enabled: !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/invitations`, {
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

    useEffect(() => {
        if (invitationsLoading || !invitations.length) {
            return;
        }

        if (params.invitationId) {
            const tapped = invitations.find(i => String(i.id) === params.invitationId);
            if (tapped) {
                setSelectedInvitation(tapped);
            }
            return;
        }

        const pushSlotInvitation = invitations.find(i => i.slotPosition === 1);
        if (!pushSlotInvitation) {
            return;
        }

        const today = dayjs().format('YYYY-MM-DD');
        const expectedKey = `${today}:${pushSlotInvitation.id}`;

        SecureStore.getItemAsync(APP_OPEN_PROMPT_KEY).then((lastShownKey) => {
            if (lastShownKey === expectedKey) {
                return;
            }
            setSelectedInvitation(pushSlotInvitation);
            SecureStore.setItemAsync(APP_OPEN_PROMPT_KEY, expectedKey);
        });
    }, [invitationsLoading, invitations, params.invitationId]);

    const declineMutation = useMutation({
        mutationFn: async (businessInvitationId: number) => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/invitations/decline`, {
                method: 'PUT',
                headers: {...authHeader, 'Content-Type': 'application/json'},
                body: JSON.stringify({businessInvitationId})
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['activeInvitations']});
            setSelectedInvitation(null);
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
                    <Modal visible={!!selectedInvitation} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.cardGroupScroll}>
                                    {selectedInvitation?.businessName}
                                </Text>
                                <Text style={styles.modalTitle}>{selectedInvitation?.name}</Text>
                                <Text style={styles.emptyText}>{selectedInvitation?.description}</Text>
                                <Text style={[styles.cardTime, {marginTop: 12}]}>
                                    {selectedInvitation && formatInvitationDate(selectedInvitation.dateStart, selectedInvitation.dateEnd)}
                                </Text>
                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={() => {
                                        const invitation = selectedInvitation!;
                                        setSelectedInvitation(null);
                                        router.push({
                                            pathname: '/new-event',
                                            params: {
                                                name: invitation.name,
                                                description: invitation.description,
                                                businessInvitationId: String(invitation.id)
                                            }
                                        });
                                    }}
                                >
                                    <Text style={styles.submitText}>Create Event</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => declineMutation.mutate(selectedInvitation!.id)}
                                >
                                    <Text style={[styles.modalOptionText, {color: '#fa5252'}]}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSelectedInvitation(null)}>
                                    <Text style={styles.modalCancel}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                    <Text style={styles.dateTitle}>Recommended Events</Text>
                    {invitationsLoading ? (
                        <ActivityIndicator size="small" style={{marginTop: 12}}/>
                    ) : invitations.length === 0 ? (
                        <Text style={styles.emptyText}>No invitations right now</Text>
                    ) : (
                        invitations.map((invitation) => (
                            <TouchableOpacity
                                key={invitation.id}
                                style={[styles.card, {borderLeftWidth: 4, borderLeftColor: '#12b886'}]}
                                onPress={() => setSelectedInvitation(invitation)}
                            >
                                <Text style={styles.cardGroupScroll}>
                                    {invitation.businessName}
                                </Text>
                                <Text style={styles.cardTitle}>{invitation.name}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardTime}>
                                        {formatInvitationDate(invitation.dateStart, invitation.dateEnd)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </>
            )}
        </ScrollView>
    );
}

export default Main;
