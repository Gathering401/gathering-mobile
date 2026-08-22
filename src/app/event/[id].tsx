import {useEffect, useState} from 'react';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useMutation, useQuery, useQueryClient, UseQueryResult} from '@tanstack/react-query';
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import dayjs from 'dayjs';
import {Event} from '../../constants/Event';
import {getRsvpLabelFor, getRsvpsForDropdown, Rsvp} from '../../constants/enums/Rsvp';
import {Role} from '../../constants/enums/Role';
import {styles} from "../../styles/event";
import {colors} from "../../styles/colors";
import {getRepetitionOptions, Repetition} from "../../constants/enums/Repetition";
import {useRsvpUpdate} from '../../hooks/useRsvpUpdate';
import {useAuthHeader} from '../../hooks/useAuthHeader';
import {HeaderMenu, HeaderMenuItem} from '../../components/HeaderMenu';
import Toast from "react-native-toast-message";

const rsvpSortOrder = [Rsvp.attending, Rsvp.maybe, Rsvp.pending, Rsvp.rejected];

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

const getRepetitionLabel = (value: Repetition): string => {
    if (value === Repetition.none) {
        return 'Just once';
    }
    const key = Object.keys(Repetition).find(k => Repetition[k as keyof typeof Repetition] === value);
    return getRepetitionOptions().find(o => o.value === key)?.label ?? 'Just once';
};

const EventDisplay = () => {
    const router = useRouter();
    const {id: eventId} = useLocalSearchParams();
    const params = useLocalSearchParams();
    const groupId = params.groupId;
    const queryClient = useQueryClient();
    const [user, setUser] = useState<any>(null);
    const [guestListOpened, setGuestListOpened] = useState(false);
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [cancelSeriesModalOpened, setCancelSeriesModalOpened] = useState(false);
    const [cancelConfirmOpened, setCancelConfirmOpened] = useState(false);
    const [showRsvpPicker, setShowRsvpPicker] = useState(false);
    const [showSeriesModal, setShowSeriesModal] = useState(false);

    const authHeader = useAuthHeader();

    useEffect(() => {
        SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    }, []);

    const {isLoading, data, error, refetch} = useQuery<Event>({
        queryKey: [`eventId-${eventId}`],
        enabled: !!authHeader.Authorization && !!groupId,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event?eventId=${eventId}&id=${groupId}`, {
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

    const event: Event = data as Event;

    const {mutate: updateNotifications} = useMutation({
        mutationFn: async (notifications: boolean) => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/notifications?id=${groupId}&eventId=${event.id}&notifications=${notifications}`, {
                method: 'PUT',
                headers: {...authHeader, 'Content-Type': 'application/json'},
                body: JSON.stringify({eventId: Number(eventId), notifications})
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }

            return notifications;
        },
        onSuccess: (notifications) => {
            void queryClient.invalidateQueries({queryKey: [`eventId-${eventId}`]});
            Toast.show({
                type: 'success',
                text1: 'Reminders',
                text2: `Reminders for this event turned ${notifications ? 'on' : 'off'}`
            });
        }
    });

    const {mutate: cancelEvent} = useMutation({
        mutationFn: async (seriesId?: number) => {
            const query = `eventId=${eventId}&id=${groupId}${seriesId ? `&seriesId=${seriesId}` : ''}`;
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event?${query}`, {
                method: 'DELETE',
                headers: authHeader
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({queryKey: ['events']});
            void queryClient.invalidateQueries({queryKey: [`groupId-${groupId}-all-events`]});
            void queryClient.invalidateQueries({queryKey: ['pendingInvitations']});
            void queryClient.invalidateQueries({queryKey: [`eventId-${eventId}`]});
            router.back();
        }
    });

    const {updateRsvp, seriesPromptVisible, confirmSeriesChoice, cancelSeriesPrompt} = useRsvpUpdate(() => refetch());

    useEffect(() => {
        if (error) {
            router.back();
        }
    }, [error]);

    if (isLoading || !user) {
        return <View style={styles.centered}><ActivityIndicator size="large"/></View>;
    }

    if (!event) {
        return null;
    }

    const myRsvp = event?.myRsvp;
    const isHost = event?.host?.userId === user.id;
    const isOwner = event.currentRole === Role.owner;
    const isAdmin = event.currentRole === Role.admin || isOwner;
    const canEdit = isHost || isAdmin;

    const sortedRsvps = [...(event?.rsvps ?? [])].sort((a, b) =>
        rsvpSortOrder.indexOf(a.rsvp) - rsvpSortOrder.indexOf(b.rsvp)
    );

    const handleOpenMaps = () => {
        const address = encodeURIComponent(event.location);
        const url = Platform.select({
            ios: `maps://?q=${address}`,
            android: `geo:0,0?q=${address}`,
            default: `https://maps.google.com/?q=${address}`
        });

        Linking.openURL(url).catch(() => {
            void Linking.openURL(`https://maps.google.com/?q=${address}`);
        });
    };

    const navigateToEdit = (seriesId?: number) => {
        router.push({
            pathname: '/new-event',
            params: {
                id: String(event.id),
                seriesId: seriesId ? String(seriesId) : undefined,
                name: event.name,
                description: event.description,
                location: event.location,
                cost: String(event.cost),
                date: event.date,
                repetition: String(event.repetition),
                groupId: String(event.groupId),
                editDateEnabled: seriesId ? 'false' : 'true',
            }
        });
    }

    const handleEditClick = () => {
        if (event.repetition === Repetition.none) {
            navigateToEdit();
        } else {
            setEditModalOpened(true);
        }
    }

    const handleCancelClick = () => {
        if (event.seriesId) {
            setCancelSeriesModalOpened(true);
        } else {
            setCancelConfirmOpened(true);
        }
    };

    const rsvpOptions = getRsvpsForDropdown();

    const menuItems: HeaderMenuItem[] = [];
    if (isHost) {
        menuItems.push({key: 'guestlist', title: 'Guest List', onSelect: () => setGuestListOpened(true)});
    }
    if (canEdit) {
        menuItems.push({key: 'edit', title: 'Edit Event', onSelect: handleEditClick});
        menuItems.push({key: 'cancel', title: 'Cancel Event', destructive: true, onSelect: handleCancelClick});
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => menuItems.length > 0 ? <HeaderMenu items={menuItems}/> : null
                }}
            />
            <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
                <View style={styles.titleWrap}>
                    <Text style={styles.title}>{event.name}</Text>
                    <Text style={styles.hostedBy}>Hosted by {event.host.fullName}</Text>
                </View>
                <View style={styles.dateChip}>
                    <Ionicons name="calendar-outline" size={18} color={colors.terracotta.text}/>
                    <Text style={styles.dateChipText}>{dayjs(event.date).format('ddd, MMM D [at] h:mm A')}</Text>
                </View>
                <View style={styles.iconRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleOpenMaps}>
                        <Ionicons name="navigate-outline" size={17} color={colors.terracotta.primary}/>
                        <Text style={styles.actionButtonLabel}>Directions</Text>
                    </TouchableOpacity>
                    {event.seriesDates.length > 0 && event.repetition !== Repetition.none && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => setShowSeriesModal(true)}>
                            <Ionicons name="repeat-outline" size={17} color={colors.terracotta.primary}/>
                            <Text style={styles.actionButtonLabel}>All Dates</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, event.myNotifications && styles.actionButtonActive]}
                        onPress={() => updateNotifications(!event.myNotifications)}
                    >
                        <Ionicons
                            name={event.myNotifications ? 'notifications' : 'notifications-outline'}
                            size={17}
                            color={event.myNotifications ? '#fff' : colors.terracotta.primary}
                        />
                        <Text
                            style={[styles.actionButtonLabel, event.myNotifications && styles.actionButtonLabelActive]}>Notify</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.infoCard}>
                    <Text style={styles.cardLabel}>What's happening?</Text>
                    <Text style={styles.cardValue}>{event.description}</Text>
                    <Text style={styles.cardLabel}>Price</Text>
                    <Text
                        style={[styles.cardValue, (myRsvp !== Rsvp.pending && myRsvp !== Rsvp.rejected) && {marginBottom: 0}]}>
                        {Number(event.cost) > 0 ? `$${Number(event.cost).toFixed(2)}` : 'Free'}
                    </Text>
                    {(myRsvp === Rsvp.pending || myRsvp === Rsvp.rejected) && (
                        <>
                            <Text style={styles.cardLabel}>How often</Text>
                            <Text
                                style={[styles.cardValue, {marginBottom: 0}]}>{getRepetitionLabel(event.repetition)}</Text>
                        </>
                    )}
                </View>
                <View style={styles.rsvpPillWrap}>
                    <TouchableOpacity
                        style={[styles.rsvpPill, {backgroundColor: rsvpColor(myRsvp ?? Rsvp.pending) + '22'}]}
                        onPress={() => setShowRsvpPicker(true)}
                    >
                        <Text style={[styles.rsvpPillText, {color: rsvpColor(myRsvp ?? Rsvp.pending)}]}>
                            {getRsvpLabelFor(myRsvp ?? Rsvp.pending)} ▾
                        </Text>
                    </TouchableOpacity>
                </View>
                <Modal visible={showRsvpPicker} transparent animationType="slide">
                    <TouchableWithoutFeedback onPress={() => setShowRsvpPicker(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => {
                            }}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Update RSVP</Text>
                                    {rsvpOptions.map((opt: { label: string; value: string }) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={styles.modalOption}
                                            onPress={() => {
                                                setShowRsvpPicker(false);
                                                if (Number(opt.value) !== myRsvp) {
                                                    updateRsvp(Number(groupId), Number(eventId), event.repetition, Number(opt.value) as Rsvp);
                                                }
                                            }}
                                        >
                                            <Text style={styles.modalOptionText}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity onPress={() => setShowRsvpPicker(false)}>
                                        <Text style={styles.modalCancel}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={editModalOpened} transparent animationType="slide">
                    <TouchableWithoutFeedback onPress={() => setEditModalOpened(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => {}}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Edit Event</Text>
                                    <Text style={styles.modalBody}>Would you like to edit the series or just this single
                                        event?</Text>
                                    <TouchableOpacity
                                        style={styles.modalButton}
                                        onPress={() => {
                                            setEditModalOpened(false);
                                            navigateToEdit();
                                        }}
                                    >
                                        <Text style={styles.modalButtonText}>This Event Only</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonPrimary]}
                                        onPress={() => {
                                            setEditModalOpened(false);
                                            navigateToEdit(event.seriesId);
                                        }}
                                    >
                                        <Text style={[styles.modalButtonText, {color: '#fff'}]}>Entire Series</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditModalOpened(false)}>
                                        <Text style={styles.modalCancel}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={cancelSeriesModalOpened} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Cancel Event</Text>
                            <Text style={styles.modalBody}>Would you like to cancel just this event or the entire
                                series?</Text>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => {
                                    setCancelSeriesModalOpened(false);
                                    cancelEvent(undefined);
                                }}
                            >
                                <Text style={styles.modalButtonText}>This Event Only</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDestructive]}
                                onPress={() => {
                                    setCancelSeriesModalOpened(false);
                                    cancelEvent(event.seriesId);
                                }}
                            >
                                <Text style={[styles.modalButtonText, {color: '#fff'}]}>Entire Series</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setCancelSeriesModalOpened(false)}>
                                <Text style={styles.modalCancel}>Nevermind</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <Modal visible={cancelConfirmOpened} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Cancel Event?</Text>
                            <Text style={styles.modalBody}>Are you sure you want to cancel this event?</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDestructive]}
                                onPress={() => {
                                    setCancelConfirmOpened(false);
                                    cancelEvent(undefined);
                                }}
                            >
                                <Text style={[styles.modalButtonText, {color: '#fff'}]}>Yes, Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setCancelConfirmOpened(false)}>
                                <Text style={styles.modalCancel}>Nevermind</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                {isHost && (
                    <Modal visible={guestListOpened} transparent animationType="slide"
                           onRequestClose={() => setGuestListOpened(false)}>
                        <TouchableWithoutFeedback onPress={() => setGuestListOpened(false)}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback onPress={() => {
                                }}>
                                    <View style={styles.guestModalContent}>
                                        <View style={styles.guestModalHeader}>
                                            <Text style={styles.modalTitle}>Guest List</Text>
                                            <TouchableOpacity onPress={() => setGuestListOpened(false)}>
                                                <Ionicons name="close" size={24} color="#333"/>
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView>
                                            {sortedRsvps.map(r => (
                                                <View key={r.userId} style={styles.guestRow}>
                                                    <Text>{r.fullName} ({r.username})</Text>
                                                    <View
                                                        style={[styles.rsvpBadge, {backgroundColor: rsvpColor(r.rsvp) + '22'}]}>
                                                        <Text
                                                            style={[styles.rsvpBadgeText, {color: rsvpColor(r.rsvp)}]}>
                                                            {getRsvpLabelFor(r.rsvp)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                )}
                <Modal visible={showSeriesModal} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setShowSeriesModal(false)}>
                        <View style={styles.seriesModalOverlay}>
                            <TouchableWithoutFeedback onPress={() => {
                            }}>
                                <View style={styles.seriesModalContent}>
                                    <Text style={styles.modalTitle}>Upcoming Dates</Text>
                                    <ScrollView>
                                        {event.seriesDates.map((date, index) => (
                                            <Text
                                                key={date}
                                                style={[styles.seriesDate, index === 0 && styles.seriesDateUpcoming]}
                                            >
                                                {dayjs(date).format(event.repetition === Repetition.weekly ? 'MMM DD, YYYY [at] h:mm A' : 'dddd MMM DD, YYYY [at] h:mm A')}
                                            </Text>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity onPress={() => setShowSeriesModal(false)}>
                                        <Text style={styles.modalClose}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={seriesPromptVisible} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={cancelSeriesPrompt}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => {
                            }}>
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
                                        <Text style={[styles.modalButtonText, {color: '#fff'}]}>All Upcoming
                                            Events</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={cancelSeriesPrompt}>
                                        <Text style={styles.modalCancel}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </ScrollView>
        </>
    );
}

export default EventDisplay;
