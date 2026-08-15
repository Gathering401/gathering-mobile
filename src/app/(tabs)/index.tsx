import {useState, useEffect} from 'react';
import {useLocalSearchParams, useRouter} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Calendar, DateData} from 'react-native-calendars';
import {
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    View,
    Modal,
    Alert,
    TouchableWithoutFeedback,
    Dimensions
} from 'react-native';
import dayjs from 'dayjs';
import {styles, dotPending, dotResponded} from "../../styles";
import {colors} from "../../styles/colors";
import {Rsvp, getRsvpLabelFor, getRsvpsForDropdown} from "../../constants/enums/Rsvp";
import {useAuthHeader} from '../../hooks/useAuthHeader';
import {useRsvpUpdate} from '../../hooks/useRsvpUpdate';
import {CalendarEvent} from "../../constants/CalendarEvent";
import {BusinessInvitation} from "../../constants/BusinessInvitation";
import {PendingInvitation} from "../../constants/PendingInvitation";

const APP_OPEN_PROMPT_KEY = 'lastInvitationPromptShown';
const CARD_WIDTH = Dimensions.get('window').width * 0.4;

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
}

const formatInvitationDate = (dateStart: string | null, dateEnd: string | null): string => {
    if (!dateStart) {
        return 'Flexible dates';
    }
    if (!dateEnd || dateEnd === dateStart) {
        return `Available ${dayjs(dateStart).format('MMM D')}, but schedule anytime!`;
    }
    return `Available ${dayjs(dateStart).format('MMM D')} - ${dayjs(dateEnd).format('MMM D')}, but schedule anytime!`;
}

const Main = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [rsvpPickerEvent, setRsvpPickerEvent] = useState<CalendarEvent | null>(null);
    const [selectedInvitation, setSelectedInvitation] = useState<BusinessInvitation | null>(null);

    const params = useLocalSearchParams<{invitationId?: string}>();

    const authHeader = useAuthHeader();

    const selectedYear = dayjs(selectedDate).year();
    const selectedMonth = dayjs(selectedDate).month() + 1;

    const {isLoading, data: events = [], refetch} = useQuery<CalendarEvent[]>({
        queryKey: ['events', selectedYear, selectedMonth],
        enabled: !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/all?year=${selectedYear}&month=${selectedMonth}`, {
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

    const {isLoading: businessInvitationsLoading, data: businessInvitations = []} = useQuery<BusinessInvitation[]>({
        queryKey: ['businessInvitations'],
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

    const {isLoading: pendingInvitationsLoading, data: pendingInvitations = []} = useQuery<PendingInvitation[]>({
        queryKey: ['pendingInvitations'],
        enabled: !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/pending-invitations`, {
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
        if (businessInvitationsLoading || !businessInvitations.length) {
            return;
        }

        if (params.invitationId) {
            const tapped = businessInvitations.find(i => String(i.id) === params.invitationId);
            if (tapped) {
                setSelectedInvitation(tapped);
            }
            return;
        }

        const pushSlotInvitation = businessInvitations.find(i => i.slotPosition === 1);
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
    }, [businessInvitationsLoading, businessInvitations, params.invitationId]);

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
            await queryClient.invalidateQueries({queryKey: ['businessInvitations']});
            setSelectedInvitation(null);
        }
    });

    const {updateRsvp, seriesPromptVisible, confirmSeriesChoice, cancelSeriesPrompt} = useRsvpUpdate(async () => {
        if (rsvpPickerEvent) {
            await queryClient.invalidateQueries({queryKey: [`eventId-${rsvpPickerEvent.id}`]});
        }
        await queryClient.invalidateQueries({queryKey: ['pendingInvitations']});
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
            dots.push({key: 'pending', color: dotPending});
        }
        if (hasResponded) {
            dots.push({key: 'responded', color: dotResponded});
        }

        acc[key] = {dots, selected: key === selectedDate, selectedColor: colors.terracotta.primary};
        return acc;
    }, {});

    if (!markedDates[selectedDate]) {
        markedDates[selectedDate] = {selected: true, selectedColor: colors.terracotta.primary, dots: []};
    } else {
        markedDates[selectedDate].selected = true;
        markedDates[selectedDate].selectedColor = colors.terracotta.primary;
    }

    const selectedEvents = (eventsByDate[selectedDate] ?? [])
        .slice()
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    const formattedSelected = dayjs(selectedDate).format('MMMM D, YYYY');
    const rsvpOptions = getRsvpsForDropdown();

    const onMonthChange = (month: DateData) => {
        setSelectedDate(dayjs(`${month.year}-${month.month}-01`).format('YYYY-MM-DD'));
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" style={{marginTop: 40}}/>
            ) : (
                <>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        onMonthChange={onMonthChange}
                        markedDates={markedDates}
                        markingType="multi-dot"
                        theme={{
                            todayTextColor: colors.terracotta.primary,
                            selectedDayBackgroundColor: colors.terracotta.primary,
                            dotColor: colors.terracotta.primary,
                            arrowColor: colors.terracotta.primary,
                        }}
                    />
                    <Text style={styles.dateTitle}>{formattedSelected}</Text>
                    {selectedEvents.length === 0 ? (
                        <Text style={styles.emptyText}>No events on {formattedSelected}</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.contentContainer}
                        >
                            {selectedEvents.map((event) => (
                                <TouchableOpacity
                                    key={event.id}
                                    style={[styles.card, {width: CARD_WIDTH}]}
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
                            ))}
                        </ScrollView>
                    )}
                    <Modal visible={!!rsvpPickerEvent} transparent animationType="slide">
                        <TouchableWithoutFeedback onPress={() => setRsvpPickerEvent(null)}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={() => {}}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Update RSVP</Text>
                                        {rsvpOptions.map((opt: { label: string; value: string }) => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={styles.modalOption}
                                                onPress={() => {
                                                    setRsvpPickerEvent(null);
                                                    if (Number(opt.value) !== rsvpPickerEvent!.myRsvp) {
                                                        updateRsvp(
                                                            rsvpPickerEvent!.groupId,
                                                            rsvpPickerEvent!.id,
                                                            rsvpPickerEvent!.repetition,
                                                            Number(opt.value) as Rsvp
                                                        );
                                                    }
                                                }}
                                            >
                                                <Text style={styles.modalOptionText}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity onPress={() => setRsvpPickerEvent(null)}>
                                            <Text style={styles.modalCancel}>Close</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                    <Modal visible={seriesPromptVisible} transparent animationType="fade">
                        <TouchableWithoutFeedback onPress={cancelSeriesPrompt}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={() => {}}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Update RSVP</Text>
                                        <Text style={styles.modalBody}>Apply this change to just this event or all upcoming
                                            events in the series?</Text>
                                        <TouchableOpacity
                                            style={styles.modalButton}
                                            onPress={() => confirmSeriesChoice(false)}
                                        >
                                            <Text style={styles.modalButtonText}>Just This Event</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.modalButtonPrimary]}
                                            onPress={() => confirmSeriesChoice(true)}
                                        >
                                            <Text style={[styles.modalButtonText, {color: '#fff'}]}>All Upcoming Events</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={cancelSeriesPrompt}>
                                            <Text style={styles.modalCancel}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                    <Modal visible={!!selectedInvitation} transparent animationType="slide">
                        <TouchableWithoutFeedback onPress={() => setSelectedInvitation(null)}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={() => {}}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.cardGroupScroll}>
                                            {selectedInvitation?.businessName}
                                        </Text>
                                        <Text style={styles.modalTitle}>{selectedInvitation?.name}</Text>
                                        <Text style={styles.emptyText}>{selectedInvitation?.description}</Text>
                                        <Text style={[styles.cardTime, {marginTop: 12}]}>
                                            {selectedInvitation && formatInvitationDate(selectedInvitation.dateStart, selectedInvitation.dateEnd)}
                                        </Text>
                                        <View style={styles.modalButtonRow}>
                                            <TouchableOpacity
                                                style={styles.closeButtonOutline}
                                                onPress={() => setSelectedInvitation(null)}
                                            >
                                                <Text style={styles.closeButtonText}>Close</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.createEventButton}
                                                onPress={() => {
                                                    const invitation = selectedInvitation!;
                                                    setSelectedInvitation(null);
                                                    router.push({
                                                        pathname: '/new-event',
                                                        params: {
                                                            name: invitation.name,
                                                            description: invitation.description,
                                                            location: invitation.locationAddress,
                                                            cost: String(invitation.averageCost),
                                                            businessInvitationId: String(invitation.id)
                                                        }
                                                    });
                                                }}
                                            >
                                                <Text style={styles.submitText}>Create Event</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => {
                                                Alert.alert(
                                                    'Decline invitation?',
                                                    'You won\'t be asked about this invitation again.',
                                                    [
                                                        {text: 'Cancel', style: 'cancel'},
                                                        {
                                                            text: 'Decline',
                                                            style: 'destructive',
                                                            onPress: () => declineMutation.mutate(selectedInvitation!.id)
                                                        }
                                                    ]
                                                );
                                            }}
                                        >
                                            <Text style={styles.rejectionText}>Not interested, don't ask again</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                    <Text style={styles.dateTitle}>Pending Invitations</Text>
                    {pendingInvitationsLoading ? (
                        <ActivityIndicator size="small" style={{marginTop: 12}}/>
                    ) : pendingInvitations.length === 0 ? (
                        <Text style={styles.emptyText}>No pending invitations</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.contentContainer}
                        >
                            {pendingInvitations.map((invitation) => (
                                <TouchableOpacity
                                    key={invitation.eventId}
                                    style={[styles.card, {width: CARD_WIDTH}]}
                                    onPress={() => router.push({
                                        pathname: `/event/${invitation.eventId}`,
                                        params: {groupId: String(invitation.groupId)}
                                    })}
                                >
                                    <Text style={styles.cardTitle}>{invitation.eventName}</Text>
                                    <Text style={styles.cardGroup}>{invitation.groupName}</Text>
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.cardTime}>{dayjs(invitation.date).format('MMM D, h:mm A')}</Text>
                                        <TouchableOpacity
                                            style={[styles.rsvpPill, {backgroundColor: rsvpColor(invitation.rsvpStatus) + '22'}]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setRsvpPickerEvent({
                                                    id: invitation.eventId,
                                                    name: invitation.eventName,
                                                    description: invitation.description,
                                                    date: invitation.date,
                                                    groupId: invitation.groupId,
                                                    groupName: invitation.groupName,
                                                    myRsvp: invitation.rsvpStatus,
                                                    repetition: invitation.repetition,
                                                    seriesId: invitation.seriesId
                                                });
                                            }}
                                        >
                                            <Text style={[styles.rsvpPillText, {color: rsvpColor(invitation.rsvpStatus)}]}>
                                                {getRsvpLabelFor(invitation.rsvpStatus)} ▾
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    <Text style={styles.dateTitle}>Recommended Events</Text>
                    {businessInvitationsLoading ? (
                        <ActivityIndicator size="small" style={{marginTop: 12}}/>
                    ) : businessInvitations.length === 0 ? (
                        <Text style={styles.emptyText}>No invitations right now</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.contentContainer}
                        >
                            {businessInvitations.map((invitation) => (
                                <TouchableOpacity
                                    key={invitation.id}
                                    style={[styles.card, {width: CARD_WIDTH, borderLeftWidth: 4, borderLeftColor: colors.sage.primary}]}
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
                            ))}
                        </ScrollView>
                    )}
                </>
            )}
        </ScrollView>
    );
}

export default Main;
