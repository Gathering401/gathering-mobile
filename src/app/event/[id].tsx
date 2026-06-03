import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useMutation, useQuery, UseQueryResult} from '@tanstack/react-query';
import {
    View, Text, TouchableOpacity, ScrollView,
    ActivityIndicator, Modal, Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Event } from '../../constants/Event';
import { getRsvpLabelFor, getRsvpsForDropdown, Rsvp } from '../../constants/enums/Rsvp';
import { Role } from '../../constants/enums/Role';
import {styles} from "../../styles/event";

const rsvpSortOrder = [Rsvp.attending, Rsvp.maybe, Rsvp.pending, Rsvp.rejected];

const rsvpColor = (rsvp: Rsvp): string => {
    switch (rsvp) {
        case Rsvp.attending: return '#40c057';
        case Rsvp.maybe: return '#fab005';
        case Rsvp.rejected: return '#fa5252';
        default: return '#868e96';
    }
};

const EventDisplay = () => {
    const router = useRouter();
    const { id: eventId } = useLocalSearchParams();
    const params = useLocalSearchParams();
    const groupId = params.groupId;
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [guestListOpened, setGuestListOpened] = useState(false);
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [locationCopied, setLocationCopied] = useState(false);
    const [showRsvpPicker, setShowRsvpPicker] = useState(false);

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
        SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    }, []);

    const authHeader = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const { isLoading, data: event, error, refetch }: UseQueryResult = useQuery<Event>({
        queryKey: [`eventId-${eventId}`],
        enabled: !!token && !!groupId,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event?eventId=${eventId}&id=${groupId}`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await response.json();
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });

    const { mutate: updateRsvp } = useMutation({
        mutationFn: async (rsvp: Rsvp) => {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/event/rsvp?id=${groupId}&eventId=${eventId}&rsvp=${rsvp}`,
                { method: 'PUT', headers: authHeader }
            );
            if (response.status === 204) await refetch();
        }
    });

    useEffect(() => {
        if (error) router.replace('/');
    }, [error]);

    if (isLoading || !user) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (!event) return null;

    const myRsvp = event?.rsvps?.find(r => r.userId === user.id);
    const isHost = event?.host?.userId === user.id;
    const isOwner = event.currentRole === Role.owner;
    const isAdmin = event.currentRole === Role.admin || isOwner;
    const canEdit = isHost || isAdmin;

    const sortedRsvps = [...(event?.rsvps ?? [])].sort((a, b) =>
        rsvpSortOrder.indexOf(a.rsvp) - rsvpSortOrder.indexOf(b.rsvp)
    );

    const handleCopyLocation = () => {
        Clipboard.setString(event.location);
        setLocationCopied(true);
        setTimeout(() => setLocationCopied(false), 1500);
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
    };

    const handleEditClick = () => {
        if (!event.seriesId) {
            navigateToEdit();
        } else {
            setEditModalOpened(true);
        }
    };

    const rsvpOptions = getRsvpsForDropdown();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {canEdit && (
                <TouchableOpacity style={styles.editButton} onPress={handleEditClick}>
                    <Ionicons name="pencil-outline" size={14} color="#228be6" />
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.title}>{event.name}</Text>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>What for?</Text>
                <Text style={styles.detailValue}>{event.description}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>When?</Text>
                <Text style={styles.detailValue}>{dayjs(event.date).format('dddd MMM DD, YYYY [at] h:mm A')}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Where?</Text>
                <TouchableOpacity onPress={handleCopyLocation}>
                    <Text style={[styles.detailValue, styles.locationLink]}>{event.location}</Text>
                    {locationCopied && <Text style={styles.copiedLabel}>Copied!</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>{event.cost > 0 ? `$${event.cost.toFixed(2)}` : 'FREE'}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Repetition:</Text>
                <Text style={styles.detailValue}>{event.repetition}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hosted by:</Text>
                <Text style={styles.detailValue}>{event.host.fullName}</Text>
                {isHost && (
                    <TouchableOpacity style={styles.guestButton} onPress={() => setGuestListOpened(true)}>
                        <Text style={styles.guestButtonText}>Guest List</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.rsvpRow}>
                <Text style={styles.detailLabel}>My RSVP:</Text>
                <TouchableOpacity
                    style={[styles.rsvpButton, { backgroundColor: rsvpColor(myRsvp?.rsvp ?? Rsvp.pending) + '22' }]}
                    onPress={() => setShowRsvpPicker(true)}
                >
                    <Text style={[styles.rsvpButtonText, { color: rsvpColor(myRsvp?.rsvp ?? Rsvp.pending) }]}>
                        {getRsvpLabelFor(myRsvp?.rsvp ?? Rsvp.pending)} ▾
                    </Text>
                </TouchableOpacity>
            </View>

            {/* RSVP Picker Modal */}
            <Modal visible={showRsvpPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update RSVP</Text>
                        {rsvpOptions.map((opt: { label: string; value: string }) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={styles.modalOption}
                                onPress={() => {
                                    updateRsvp(Number(opt.value) as Rsvp);
                                    setShowRsvpPicker(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setShowRsvpPicker(false)}>
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Series Modal */}
            <Modal visible={editModalOpened} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Event</Text>
                        <Text style={styles.modalBody}>Would you like to edit the series or just this single event?</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => { setEditModalOpened(false); navigateToEdit(); }}
                        >
                            <Text style={styles.modalButtonText}>This Event Only</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonPrimary]}
                            onPress={() => { setEditModalOpened(false); navigateToEdit(event.seriesId); }}
                        >
                            <Text style={[styles.modalButtonText, { color: '#fff' }]}>Entire Series</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditModalOpened(false)}>
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Guest List Modal */}
            {canEdit && (
                <Modal visible={guestListOpened} animationType="slide" onRequestClose={() => setGuestListOpened(false)}>
                    <View style={styles.fullModalContainer}>
                        <Text style={styles.modalTitle}>Who's attending?</Text>
                        <ScrollView>
                            {sortedRsvps.map(r => (
                                <View key={r.userId} style={styles.guestRow}>
                                    <Text>{r.fullName} ({r.username})</Text>
                                    <View style={[styles.rsvpBadge, { backgroundColor: rsvpColor(r.rsvp) + '22' }]}>
                                        <Text style={[styles.rsvpBadgeText, { color: rsvpColor(r.rsvp) }]}>
                                            {getRsvpLabelFor(r.rsvp)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setGuestListOpened(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
        </ScrollView>
    );
};

export default EventDisplay;
