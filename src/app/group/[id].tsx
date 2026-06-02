import { useState, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet,
    ActivityIndicator, TextInput, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GatheringGroup as GroupType } from '../../constants/GatheringGroup';
import { getRoleById, getRoleByValue, getRoleOptions, Role } from '../../constants/enums/Role';
import { InviteStatus } from '../../constants/enums/InviteStatus';

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

    const { isLoading, data: group, error, refetch } = useQuery<GroupType>({
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

    const { data: searchResults, isLoading: loadingSearch } = useQuery({
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
        if (error) router.replace('/');
    }, [error]);

    useEffect(() => {
        if (!isLoading && user && !activeMembers.find(m => m.id === user.id)) {
            router.replace('/');
        }
    }, [isLoading, activeMembers]);

    if (isLoading || !user) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (error) return null;

    const currentMember = activeMembers.find(m => m.id === user.id);
    if (!currentMember) return null;

    const isOwner = currentMember.role === Role.owner;
    const isAdmin = currentMember.role === Role.admin || isOwner;
    const isCreator = currentMember.role === Role.creator || isAdmin;
    const hasOtherMembers = activeMembers.filter(m => m.role !== Role.owner).length > 0 || pendingMembers.length > 0;

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

            {activeMembers.length > 0 && (
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
                        onPress={() => router.push('/new-event')}
                    >
                        <Text style={styles.buttonText}>+ New Event</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Members Modal */}
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

            {/* Invite Modal */}
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

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: 16, alignItems: 'center' },
    editButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 16, gap: 4 },
    editText: { color: '#228be6', fontSize: 13 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    description: { fontSize: 16, color: '#555', marginBottom: 8, textAlign: 'center' },
    owner: { fontSize: 14, color: '#888', marginBottom: 16 },
    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    button: { backgroundColor: '#228be6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    outlineButton: { borderWidth: 1, borderColor: '#228be6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    outlineButtonText: { color: '#228be6', fontSize: 13 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, alignSelf: 'flex-start' },
    eventsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 16 },
    memberChip: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginRight: 8, minWidth: 120 },
    memberChipName: { fontSize: 13, fontWeight: '500' },
    memberChipUsername: { fontSize: 11, color: '#666' },
    memberCard: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
    pendingBadge: { backgroundColor: '#fee2e2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
    pendingText: { color: '#ef4444', fontSize: 11, fontWeight: '600' },
    memberName: { fontSize: 15, fontWeight: '500' },
    memberUsername: { fontSize: 13, color: '#666' },
    roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    roleChip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
    roleChipActive: { backgroundColor: '#228be6', borderColor: '#228be6' },
    roleChipText: { fontSize: 12, color: '#444' },
    roleChipTextActive: { color: '#fff' },
    removeButton: { marginTop: 8, borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 6, alignItems: 'center' },
    removeText: { color: '#ef4444', fontSize: 13 },
    modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
    modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
    modalSectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, marginTop: 8 },
    searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
    inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    inviteButton: { backgroundColor: '#228be6', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
    inviteButtonDisabled: { backgroundColor: '#ccc' },
    inviteButtonText: { color: '#fff', fontSize: 13 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 16 },
    closeButton: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
    closeButtonText: { fontSize: 16, color: '#333' },
});

export default GroupDisplay;