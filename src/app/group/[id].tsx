import {useState, useEffect, useMemo, useCallback} from 'react';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {useFocusEffect} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import {useMutation, useQuery, useQueryClient, UseQueryResult} from '@tanstack/react-query';
import {
    View, Text, TouchableOpacity, ScrollView,
    ActivityIndicator, TextInput, Modal, Alert,
    Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform
} from 'react-native';
import {Ionicons, Feather} from '@expo/vector-icons';
import {GatheringGroup} from '../../constants/GatheringGroup';
import {getRoleById, getRoleByValue, getRoleOptions, Role} from '../../constants/enums/Role';
import {InviteStatus} from '../../constants/enums/InviteStatus';
import {getRsvpLabelFor, getRsvpsForDropdown, Rsvp} from '../../constants/enums/Rsvp';
import {styles} from "../../styles/group";
import {colors} from "../../styles/colors";
import dayjs from "dayjs";
import {useAuthHeader} from '../../hooks/useAuthHeader';
import {useRsvpUpdate} from '../../hooks/useRsvpUpdate';
import {HeaderMenu} from '../../components/HeaderMenu';
import Toast from "react-native-toast-message";

interface GroupEvent {
    id: number;
    name: string;
    description?: string;
    date: string;
    repetition: number;
    seriesId: number;
    myRsvp: Rsvp;
}

const rsvpColor = (rsvp: Rsvp | undefined): string => {
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

const GroupDisplay = () => {
    const router = useRouter();
    const {id: groupId} = useLocalSearchParams();
    const queryClient = useQueryClient();
    const [user, setUser] = useState<any>(null);
    const [membersPanelOpened, setMembersPanelOpened] = useState(false);
    const [invitePanelOpened, setInvitePanelOpened] = useState(false);
    const [searchMembers, setSearchMembers] = useState('');
    const [searchInvite, setSearchInvite] = useState('');
    const [debouncedInviteSearch, setDebouncedInviteSearch] = useState('');
    const [invitedUsers, setInvitedUsers] = useState<number[]>([]);
    const [rolePickerVisible, setRolePickerVisible] = useState(false);
    const [rolePickerMember, setRolePickerMember] = useState<any>(null);
    const [rsvpPickerEvent, setRsvpPickerEvent] = useState<any>(null);
    const [allEventsPanelOpened, setAllEventsPanelOpened] = useState(false);

    const authHeader = useAuthHeader();

    useEffect(() => {
        SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedInviteSearch(searchInvite), 250);
        return () => clearTimeout(timer);
    }, [searchInvite]);

    const {isLoading, data, error, refetch}: UseQueryResult = useQuery<{
        group: GatheringGroup,
        currentRole: Role,
        allowNotifications: boolean
    }>({
        queryKey: [`groupId-${groupId}`],
        enabled: !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group?id=${groupId}`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await response.json();
            if (data.success) {
                return {
                    group: data.response,
                    currentRole: data.currentRole,
                    allowNotifications: data.allowNotifications
                };
            }
            throw new Error(data.error);
        }
    });

    const groupResponse = data as {
        group: GatheringGroup;
        currentRole: Role;
        allowNotifications: boolean;
    }
    const group = groupResponse?.group as GatheringGroup;
    const currentRole = groupResponse?.currentRole as Role;
    const allowNotifications = groupResponse?.allowNotifications as boolean;

    const {data: allEvents = []}: UseQueryResult<GroupEvent[]> = useQuery<GroupEvent[]>({
        queryKey: [`groupId-${groupId}-all-events`],
        enabled: !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/all-events?id=${groupId}`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await response.json();
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const {mutate: removeMember} = useMutation({
        mutationFn: async (userId: number) => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/remove-member?id=${groupId}&userId=${userId}`, {
                method: 'DELETE',
                headers: authHeader
            });
            if (response.status === 204) await refetch();
        }
    });

    const {mutate: updateMember} = useMutation({
        mutationFn: async ({userId, role}: { userId: number, role: Role }) => {
            const query = role === Role.owner
                ? `change-owner?id=${groupId}&userId=${userId}`
                : `change-role?id=${groupId}&userId=${userId}&role=${role}`;
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/${query}`, {
                method: 'PUT',
                headers: authHeader
            });
            if (response.status === 204) {
                await refetch();
            }
        }
    });

    const {mutate: deleteGroup} = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group?id=${groupId}`, {
                method: 'DELETE',
                headers: authHeader
            });
            if (response.status !== 204) {
                throw new Error('Failed to delete group');
            }
        },
        onSuccess: () => router.replace('/(tabs)/groups')
    });

    const {data: searchData, isLoading: loadingSearch}: UseQueryResult = useQuery({
        queryKey: [`search-users-${groupId}-${debouncedInviteSearch}`],
        enabled: !!debouncedInviteSearch && !!authHeader.Authorization,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/search-users?id=${groupId}&username=${debouncedInviteSearch}`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await response.json();
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });
    const searchResults = searchData as {
        id: number;
        username: string;
        invite_status: number | null;
    }[];

    const {mutate: inviteUser} = useMutation({
        mutationFn: async (userId: number) => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/invite-user?id=${groupId}&userId=${userId}`, {
                method: 'POST',
                headers: authHeader
            });
            if (response.status === 204 || response.ok) {
                setInvitedUsers(prev => [...prev, userId]);
            } else {
                throw new Error('Failed to invite user');
            }
        }
    });

    const {mutate: respondToRequest} = useMutation({
        mutationFn: async ({userId, accepted}: { userId: number, accepted: boolean }) => {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/group/request-response?id=${groupId}&userId=${userId}&accepted=${accepted}`,
                {method: 'PUT', headers: authHeader}
            );
            if (response.ok) {
                await refetch();
            }
        }
    });

    const {mutate: updateNotificationPreference} = useMutation({
        mutationFn: async (enabled: boolean) => {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/group/notification-preference?id=${groupId}&enabled=${enabled}`,
                {method: 'PUT', headers: authHeader}
            );
            if (!response.ok) {
                throw new Error('Failed to update notification preference');
            }
        },
        onMutate: async (enabled: boolean) => {
            await queryClient.cancelQueries({queryKey: [`groupId-${groupId}`]});
            const previous = queryClient.getQueryData([`groupId-${groupId}`]);
            queryClient.setQueryData([`groupId-${groupId}`], (old: any) =>
                old ? {...old, allowNotifications: enabled} : old);
            return {previous};
        },
        onSuccess: (_data, enabled) => {
            Toast.show({
                type: 'success',
                text1: 'Notifications',
                text2: `New event notifications turned ${enabled ? 'on' : 'off'}`
            });
        },
        onError: (_err, _enabled, context) => {
            if (context?.previous) queryClient.setQueryData([`groupId-${groupId}`], context.previous);
        }
    });

    const {updateRsvp, seriesPromptVisible, confirmSeriesChoice, cancelSeriesPrompt} = useRsvpUpdate(async () => {
        if (rsvpPickerEvent) {
            await queryClient.invalidateQueries({queryKey: [`eventId-${rsvpPickerEvent.id}`]});
        }
        await queryClient.invalidateQueries({queryKey: ['events']});
        await refetch();
        setRsvpPickerEvent(null);
    });

    const pendingMembers = useMemo(() =>
        group?.members?.filter(m => m.inviteStatus === InviteStatus.pending && !m.invitedByGroup) ?? [], [group]);

    const activeMembers = useMemo(() =>
        group?.members?.filter(m => m.inviteStatus === InviteStatus.accepted) ?? [], [group]);

    const filteredModalMembers = useMemo(() => {
        const search = searchMembers.toLowerCase();
        return group?.members?.filter(m =>
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(search) ||
            m.username.toLowerCase().includes(search)
        ) ?? [];
    }, [group, searchMembers]);

    const attendingEvents = useMemo(() =>
        group?.events?.filter(e => e.myRsvp === Rsvp.attending) ?? [], [group]);

    const pendingInvitations = useMemo(() =>
        allEvents.filter(e => e.myRsvp === Rsvp.pending), [allEvents]);

    useEffect(() => {
        if (error) router.replace('/');
    }, [error]);

    useEffect(() => {
        if (!isLoading && !error && group && currentRole === undefined) router.replace('/');
    }, [isLoading, group, currentRole]);

    if (isLoading || !user) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{headerTitle: ''}}/>
                <ActivityIndicator size="large"/>
            </View>
        );
    }

    if (error) {
        return null;
    }

    const isOwner = currentRole === Role.owner;
    const isAdmin = currentRole === Role.admin || isOwner;
    const isCreator = currentRole === Role.creator || isAdmin;
    const hasOtherMembers = activeMembers.filter(m => m.role !== Role.owner).length > 0 || pendingMembers.length > 0;
    const ownerUsername = activeMembers.find(m => m.role === Role.owner)?.username;

    const menuItems = [
        ...(isAdmin ? [{
            key: 'edit',
            title: 'Edit Group',
            onSelect: () => router.push({
                pathname: '/new-group',
                params: {
                    id: String(group?.id),
                    name: group?.name,
                    description: group?.description,
                    public: String(group?.public)
                }
            })
        }] : []),
        ...(isOwner ? [{
            key: 'delete',
            title: 'Delete Group',
            destructive: true,
            onSelect: () => Alert.alert(
                `Delete ${group?.name}?`,
                'This will permanently delete the group and all of its events. This cannot be undone.',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Delete', style: 'destructive', onPress: () => deleteGroup()}
                ]
            )
        }] : [])
    ];

    const formatEventDate = (dateStr: string) => {
        const date = dayjs(dateStr);
        const sixMonthsFromNow = dayjs().add(6, 'month');
        const format = date.isBefore(sixMonthsFromNow) ? 'MMM D [at] h:mm A' : 'MMM D, YYYY [at] h:mm A';
        return date.format(format);
    };

    const confirmRemoveMember = (id: number, username: string) => {
        Alert.alert(
            `Remove ${username}?`,
            `Are you sure you want to remove ${username} from ${group?.name}?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Remove', style: 'destructive', onPress: () => removeMember(id)}
            ]
        );
    };

    const confirmChangeOwner = (userId: number, username: string) => {
        Alert.alert(
            `Make ${username} owner?`,
            'Are you sure? This will change your role to admin.',
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Confirm', onPress: () => updateMember({userId, role: Role.owner})}
            ]
        );
    };

    const closeInvitePanel = () => {
        setInvitePanelOpened(false);
        setSearchInvite('');
        setInvitedUsers([]);
    };

    const rsvpOptions = getRsvpsForDropdown();

    const renderMemberCard = (m: any) => {
        const isPending = m.inviteStatus === InviteStatus.pending;
        const isSelf = m.id === user.id;
        const canManageRole = !isPending && m.role !== Role.owner && !isSelf;

        return (
            <View key={m.id} style={styles.memberCard}>
                {isPending && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                )}
                <View style={styles.memberRow}>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                            {m.firstName} {m.lastName} {isSelf && '(you)'}
                        </Text>
                        {!isSelf && (
                            <Text style={styles.memberUsername}>{m.username}</Text>
                        )}
                    </View>
                    {!isSelf && (
                        <View style={styles.memberActions}>
                            {canManageRole && (
                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => {
                                        setRolePickerMember(m);
                                        setMembersPanelOpened(false);
                                        setTimeout(() => setRolePickerVisible(true), 300);
                                    }}
                                >
                                    <Text style={styles.selectButtonText}>
                                        {getRoleOptions(currentRole!).find((o: {
                                            label: string;
                                            value: string
                                        }) => o.value === getRoleById(m.role))!.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {isPending ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={() => respondToRequest({userId: m.id, accepted: true})}
                                    >
                                        <Text style={styles.buttonText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => respondToRequest({userId: m.id, accepted: false})}
                                    >
                                        <Text style={styles.removeText}>Decline</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => confirmRemoveMember(m.id, m.username)}
                                >
                                    <Text style={styles.removeText}>Remove</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderEventCard = (event: GroupEvent) => (
        <TouchableOpacity
            key={event.id}
            style={styles.modalEventCard}
            onPress={() => {
                setAllEventsPanelOpened(false);
                router.push(`/event/${event.id}?groupId=${group?.id}`);
            }}
        >
            <View style={{flex: 1}}>
                <Text style={styles.modalEventCardTitle}>{event.name}</Text>
                <Text style={styles.modalEventCardDate}>{formatEventDate(event.date)}</Text>
            </View>
            <TouchableOpacity
                style={[styles.rsvpPill, {backgroundColor: rsvpColor(event.myRsvp) + '22'}]}
                onPress={(e) => {
                    e.stopPropagation();
                    setAllEventsPanelOpened(false);
                    setTimeout(() => setRsvpPickerEvent(event), 300);
                }}
            >
                <Text style={[styles.rsvpPillText, {color: rsvpColor(event.myRsvp)}]}>
                    {getRsvpLabelFor(event.myRsvp)} ▾
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: '',
                    headerRight: () => menuItems.length > 0 ? <HeaderMenu items={menuItems}/> : null
                }}
            />
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.title}>{group?.name}</Text>
                    {!!ownerUsername && <Text style={styles.ledBy}>Led by {ownerUsername}</Text>}
                </View>
                {user?.expoPushToken && (
                    <TouchableOpacity
                        style={[styles.notifyButton, allowNotifications && styles.notifyButtonActive]}
                        onPress={() => updateNotificationPreference(!allowNotifications)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={allowNotifications ? 'Reminders on' : 'Reminders off'}
                    >
                        <Feather
                            name={allowNotifications ? 'bell' : 'bell-off'}
                            size={18}
                            color={allowNotifications ? '#fff' : colors.terracotta.primary}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {!!group?.description && (
                <Text style={styles.description}>{group.description}</Text>
            )}
            {hasOtherMembers && (
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>Members</Text>
                    {isAdmin && (
                        <View style={styles.actionIcons}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => {
                                    setMembersPanelOpened(false);
                                    setInvitePanelOpened(true);
                                }}
                            >
                                <Ionicons name="person-add-outline" size={15} color={colors.terracotta.primary}/>
                            </TouchableOpacity>
                            <View>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => setMembersPanelOpened(true)}
                                >
                                    <Ionicons name="people-outline" size={15} color={colors.terracotta.primary}/>
                                </TouchableOpacity>
                                {pendingMembers.length > 0 && (
                                    <View style={styles.iconBadge}>
                                        <Text style={styles.iconBadgeText}>{pendingMembers.length}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            )}
            {isAdmin && hasOtherMembers && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {activeMembers.filter(m => m.role !== Role.owner).map((m) => (
                        <View key={m.id} style={styles.memberChip}>
                            <Text
                                style={styles.memberChipName}>{m.firstName} {m.lastName} {m.id === user.id && '(you)'}</Text>
                            {m.id !== user.id && <Text style={styles.memberChipUsername}>{m.username}</Text>}
                        </View>
                    ))}
                </ScrollView>
            )}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Upcoming events</Text>
                <View style={styles.actionIcons}>
                    <View>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setAllEventsPanelOpened(true)}
                        >
                            <Ionicons name="list-outline" size={15} color={colors.terracotta.primary}/>
                        </TouchableOpacity>
                        {pendingInvitations.length > 0 && (
                            <View style={styles.iconBadge}>
                                <Text style={styles.iconBadgeText}>{pendingInvitations.length}</Text>
                            </View>
                        )}
                    </View>
                    {isCreator && (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push({pathname: '/new-event', params: {groupId: String(group?.id)}})}
                        >
                            <Text style={styles.buttonText}>+ New</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <ScrollView
                style={styles.eventsScroll}
                contentContainerStyle={styles.eventsScrollContent}
                nestedScrollEnabled
            >
                {attendingEvents.length > 0 ? (
                    attendingEvents.map((event) => (
                        <TouchableOpacity
                            key={event.id}
                            style={styles.eventCard}
                            onPress={() => router.push(`/event/${event.id}?groupId=${group?.id}`)}
                        >
                            <Text style={styles.eventName}>{event.name}</Text>
                            <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
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
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No upcoming events right now, get one planned!</Text>
                )}
            </ScrollView>
            <Modal visible={!!rsvpPickerEvent} transparent animationType="slide"
                   onRequestClose={() => setRsvpPickerEvent(null)}>
                <TouchableWithoutFeedback onPress={() => setRsvpPickerEvent(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Update RSVP</Text>
                                {rsvpOptions.map((opt: { label: string; value: string }) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            setRsvpPickerEvent(null);
                                            if (Number(opt.value) !== rsvpPickerEvent.myRsvp) {
                                                void updateRsvp(
                                                    Number(groupId),
                                                    rsvpPickerEvent.id,
                                                    rsvpPickerEvent.repetition,
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
            <Modal visible={membersPanelOpened} transparent animationType="slide"
                   onRequestClose={() => setMembersPanelOpened(false)}>
                <KeyboardAvoidingView
                    style={{flex: 1}}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={() => setMembersPanelOpened(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>All Members</Text>
                                    <ScrollView>
                                        {pendingMembers.length > 0 && (
                                            <Text style={styles.modalSectionLabel}>Pending Requests
                                                ({pendingMembers.length})</Text>
                                        )}
                                        {filteredModalMembers
                                            .filter(m => m.inviteStatus === InviteStatus.pending)
                                            .map(renderMemberCard)}
                                        <Text style={styles.modalSectionLabel}>Members</Text>
                                        {filteredModalMembers
                                            .filter(m => m.inviteStatus !== InviteStatus.pending && m.id !== user.id)
                                            .map(renderMemberCard)}
                                    </ScrollView>
                                    <View style={{position: 'relative', marginBottom: 12}}>
                                        <TextInput
                                            style={[styles.searchInput, {paddingRight: 36, marginBottom: 0}]}
                                            placeholder="Search members..."
                                            value={searchMembers}
                                            onChangeText={setSearchMembers}
                                        />
                                        {!!searchMembers && (
                                            <TouchableOpacity
                                                style={{position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center'}}
                                                onPress={() => setSearchMembers('')}
                                            >
                                                <Ionicons name="close-circle" size={18} color={colors.terracotta.text}/>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <TouchableOpacity style={styles.closeButton}
                                                      onPress={() => setMembersPanelOpened(false)}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
            <Modal
                visible={invitePanelOpened}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={closeInvitePanel}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalContainer}>
                        <View style={styles.fullScreenHeader}>
                            <Text style={styles.modalTitle}>Invite User</Text>
                            <TouchableOpacity onPress={closeInvitePanel}>
                                <Ionicons name="close" size={24} color={colors.terracotta.text}/>
                            </TouchableOpacity>
                        </View>
                        <View style={{position: 'relative', marginBottom: 12}}>
                            <TextInput
                                style={[styles.searchInput, {paddingRight: 36, marginBottom: 0}]}
                                placeholder="Search by username..."
                                value={searchInvite}
                                onChangeText={setSearchInvite}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {!!searchInvite && (
                                <TouchableOpacity
                                    style={{position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center'}}
                                    onPress={() => setSearchInvite('')}
                                >
                                    <Ionicons name="close-circle" size={18} color={colors.terracotta.text}/>
                                </TouchableOpacity>
                            )}
                        </View>
                        <ScrollView>
                            {loadingSearch && <ActivityIndicator style={{marginVertical: 8}}/>}
                            {!loadingSearch && searchResults?.map((u: {
                                id: number;
                                username: string;
                                invite_status: number | null;
                            }) => {
                                const alreadyInvited = u.invite_status !== null || invitedUsers.includes(u.id);
                                return (
                                    <View key={u.id} style={styles.inviteRow}>
                                        <Text>{u.username}</Text>
                                        <TouchableOpacity
                                            style={[styles.inviteButton, alreadyInvited && styles.inviteButtonDisabled]}
                                            disabled={alreadyInvited}
                                            onPress={() => inviteUser(u.id)}
                                        >
                                            <Text style={styles.inviteButtonText}>
                                                {alreadyInvited ? 'Invite Sent' : 'Send Invite'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                            {!loadingSearch && debouncedInviteSearch && !searchResults?.length && (
                                <Text style={styles.emptyText}>No users found</Text>
                            )}
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            <Modal visible={rolePickerVisible} transparent animationType="slide"
                   onRequestClose={() => {
                       setRolePickerVisible(false);
                       setRolePickerMember(null);
                   }}>
                <TouchableWithoutFeedback onPress={() => {
                    setRolePickerVisible(false);
                    setRolePickerMember(null);
                }}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Change Role</Text>
                                {getRoleOptions(currentRole!).map((opt: { label: string; value: string }) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            if (opt.value === 'owner') {
                                                confirmChangeOwner(rolePickerMember.id, rolePickerMember.username);
                                            } else {
                                                updateMember(
                                                    {userId: rolePickerMember.id, role: getRoleByValue(opt.value)},
                                                    {
                                                        onSuccess: () => {
                                                            setRolePickerVisible(false);
                                                            setRolePickerMember(null);
                                                            setTimeout(() => setMembersPanelOpened(true), 300);
                                                        }
                                                    }
                                                );
                                            }
                                            setRolePickerVisible(false);
                                            setRolePickerMember(null);
                                        }}
                                    >
                                        <Text style={styles.modalOptionText}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity onPress={() => {
                                    setRolePickerVisible(false);
                                    setRolePickerMember(null);
                                }}>
                                    <Text style={styles.modalCancel}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            <Modal visible={allEventsPanelOpened} transparent animationType="slide"
                   onRequestClose={() => setAllEventsPanelOpened(false)}>
                <TouchableWithoutFeedback onPress={() => setAllEventsPanelOpened(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>All Events</Text>
                                <Text style={styles.modalSectionLabel}>All events</Text>
                                <ScrollView
                                    style={styles.eventsList}
                                    scrollEnabled={allEvents?.length > 3}
                                    nestedScrollEnabled
                                >
                                    {allEvents?.map(renderEventCard)}
                                    {allEvents?.length === 0 && (
                                        <Text style={styles.emptyText}>No events in the next year.</Text>
                                    )}
                                </ScrollView>
                                <View style={styles.divider}/>
                                <Text style={styles.modalSectionLabel}>Pending invitations</Text>
                                <ScrollView
                                    style={styles.eventsList}
                                    scrollEnabled={pendingInvitations.length > 3}
                                    nestedScrollEnabled
                                >
                                    {pendingInvitations.map(renderEventCard)}
                                    {pendingInvitations.length === 0 && (
                                        <Text style={styles.emptyText}>No pending invitations.</Text>
                                    )}
                                </ScrollView>
                                <TouchableOpacity style={styles.closeButton}
                                                  onPress={() => setAllEventsPanelOpened(false)}>
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

export default GroupDisplay;
