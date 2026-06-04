import { useState, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useMutation, useQuery, UseQueryResult} from '@tanstack/react-query';
import {
    View, Text, TouchableOpacity, ScrollView,
    ActivityIndicator, TextInput, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GatheringGroup } from '../../constants/GatheringGroup';
import { getRoleById, getRoleByValue, getRoleOptions, Role } from '../../constants/enums/Role';
import { InviteStatus } from '../../constants/enums/InviteStatus';
import {styles} from "../../styles/group";
import dayjs from "dayjs";

const GroupDisplay = () => {
    const router = useRouter();
    const { id: groupId } = useLocalSearchParams();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [currentRole, setCurrentRole] = useState<Role>();
    const [membersPanelOpened, setMembersPanelOpened] = useState(false);
    const [invitePanelOpened, setInvitePanelOpened] = useState(false);
    const [searchMembers, setSearchMembers] = useState('');
    const [searchInvite, setSearchInvite] = useState('');
    const [debouncedInviteSearch, setDebouncedInviteSearch] = useState('');
    const [invitedUsers, setInvitedUsers] = useState<number[]>([]);

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
        SecureStore.getItemAsync('user').then(u => u && setUser(JSON.parse(u)));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedInviteSearch(searchInvite), 250);
        return () => clearTimeout(timer);
    }, [searchInvite]);

    const authHeader = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const { isLoading, data: group, error, refetch }: UseQueryResult = useQuery<GatheringGroup>({
        queryKey: [`groupId-${groupId}`],
        enabled: !!token,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group?id=${groupId}`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await response.json();
            if (data.success) {
                setCurrentRole(data.currentRole);
                return data.response;
            }
            throw new Error(data.error);
        }
    });

    const { mutate: removeMember } = useMutation({
        mutationFn: async (userId: number) => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/remove-member?id=${groupId}&userId=${userId}`, {
                method: 'DELETE',
                headers: authHeader
            });
            if (response.status === 204) await refetch();
        }
    });

    const { mutate: updateMember } = useMutation({
        mutationFn: async ({ userId, role }: { userId: number, role: Role }) => {
            const query = role === Role.owner
                ? `change-owner?id=${groupId}&userId=${userId}`
                : `change-role?id=${groupId}&userId=${userId}&role=${role}`;
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/${query}`, {
                method: 'PUT',
                headers: authHeader
            });
            if (response.status === 204) await refetch();
        }
    });

    const { data: searchResults, isLoading: loadingSearch }: UseQueryResult = useQuery({
        queryKey: [`search-users-${groupId}-${debouncedInviteSearch}`],
        enabled: !!debouncedInviteSearch && !!token,
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

    const { mutate: inviteUser } = useMutation({
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

    useEffect(() => {
        if (error) {
            router.replace('/');
        }
    }, [error]);

    useEffect(() => {
        if (!isLoading && !error && group && currentRole === undefined) {
            router.replace('/');
        }
    }, [isLoading, group, currentRole]);

    if (isLoading || !user) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (error) return null;

    const isOwner = currentRole === Role.owner;
    const isAdmin = currentRole === Role.admin || isOwner;
    const isCreator = currentRole === Role.creator || isAdmin;
    const hasOtherMembers = activeMembers.filter(m => m.role !== Role.owner).length > 0 || pendingMembers.length > 0;

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
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeMember(id) }
            ]
        );
    };

    const confirmChangeOwner = (userId: number, username: string) => {
        Alert.alert(
            `Make ${username} owner?`,
            'Are you sure? This will change your role to admin.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => updateMember({ userId, role: Role.owner }) }
            ]
        );
    };

    const renderMemberCard = (m: any) => {
        const isPending = m.inviteStatus === InviteStatus.pending;
        const roleOptions = getRoleOptions(currentRole!);

        return (
            <View key={m.id} style={styles.memberCard}>
                {isPending && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                )}
                <Text style={styles.memberName}>
                    {m.firstName} {m.lastName} {m.id === user.id && '(you)'}
                </Text>
                {m.id !== user.id && (
                    <Text style={styles.memberUsername}>{m.username}</Text>
                )}
                {!isPending && m.role !== Role.owner && m.id !== user.id && (
                    <View style={styles.roleRow}>
                        {roleOptions.map((opt: { label: string; value: string }) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.roleChip, getRoleById(m.role) === opt.value && styles.roleChipActive]}
                                onPress={() => {
                                    if (opt.value === 'owner') {
                                        confirmChangeOwner(m.id, m.username);
                                    } else {
                                        updateMember({ userId: m.id, role: getRoleByValue(opt.value) });
                                    }
                                }}
                            >
                                <Text style={[styles.roleChipText, getRoleById(m.role) === opt.value && styles.roleChipTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {m.id !== user.id && (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => confirmRemoveMember(m.id, m.username)}
                    >
                        <Text style={styles.removeText}>{isPending ? 'Decline' : 'Remove'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {isAdmin && (
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push({
                        pathname: '/new-group',
                        params: {
                            id: String(group?.id),
                            name: group?.name,
                            description: group?.description,
                            public: String(group?.public)
                        }
                    })}
                >
                    <Ionicons name="pencil-outline" size={14} color="#228be6" />
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{group?.name}</Text>
            <Text style={styles.description}>{group?.description}</Text>
            <Text style={styles.owner}>
                Owned by {activeMembers.find(m => m.role === Role.owner)?.username}
            </Text>
            {isAdmin && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => { setMembersPanelOpened(false); setInvitePanelOpened(true); }}
                    >
                        <Text style={styles.buttonText}>+ Invite User</Text>
                    </TouchableOpacity>
                    {hasOtherMembers && (
                        <TouchableOpacity
                            style={styles.outlineButton}
                            onPress={() => setMembersPanelOpened(true)}
                        >
                            <Text style={styles.outlineButtonText}>
                                View All {pendingMembers.length > 0 && `(${pendingMembers.length} pending)`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            {isAdmin && activeMembers.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {activeMembers.filter(m => m.role !== Role.owner).map((m) => (
                            <View key={m.id} style={styles.memberChip}>
                                <Text style={styles.memberChipName}>{m.firstName} {m.lastName} {m.id === user.id && '(you)'}</Text>
                                {m.id !== user.id && <Text style={styles.memberChipUsername}>{m.username}</Text>}
                            </View>
                        ))}
                    </ScrollView>
                </>
            )}
            <View style={styles.eventsRow}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                {isCreator && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push({ pathname: '/new-event', params: { groupId: String(group?.id) } })}
                    >
                        <Text style={styles.buttonText}>+ New Event</Text>
                    </TouchableOpacity>
                )}
            </View>
            {group?.events?.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {group.events.map((event) => (
                        <TouchableOpacity
                            key={event.id}
                            style={styles.eventCard}
                            onPress={() => router.push(`/event/${event.id}`)}
                        >
                            <Text style={styles.eventName}>{event.name}</Text>
                            {!!event.description && (
                                <Text style={styles.eventDescription}>{event.description}</Text>
                            )}
                            <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <Text style={styles.emptyText}>No upcoming events right now, get one planned!</Text>
            )}
            <Modal visible={membersPanelOpened} animationType="slide" onRequestClose={() => setMembersPanelOpened(false)}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>All Members</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search members..."
                        value={searchMembers}
                        onChangeText={setSearchMembers}
                    />
                    <ScrollView>
                        {pendingMembers.length > 0 && (
                            <Text style={styles.modalSectionLabel}>Pending Requests ({pendingMembers.length})</Text>
                        )}
                        {filteredModalMembers
                            .filter(m => m.inviteStatus === InviteStatus.pending)
                            .map(renderMemberCard)}
                        <Text style={styles.modalSectionLabel}>Members</Text>
                        {filteredModalMembers
                            .filter(m => m.inviteStatus !== InviteStatus.pending && m.id !== user.id)
                            .map(renderMemberCard)}
                    </ScrollView>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setMembersPanelOpened(false)}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
            <Modal
                visible={invitePanelOpened}
                animationType="slide"
                onRequestClose={() => { setInvitePanelOpened(false); setSearchInvite(''); setInvitedUsers([]); }}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Invite User</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by username..."
                        value={searchInvite}
                        onChangeText={setSearchInvite}
                    />
                    <ScrollView>
                        {loadingSearch && <ActivityIndicator style={{ marginVertical: 8 }} />}
                        {!loadingSearch && searchResults?.map((u: { id: number; username: string; invite_status: number | null }) => {
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
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => { setInvitePanelOpened(false); setSearchInvite(''); setInvitedUsers([]); }}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default GroupDisplay;
