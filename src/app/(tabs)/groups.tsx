import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import { GatheringGroup } from '../../constants/GatheringGroup';
import GroupCard from "../../components/GroupCard";
import { styles } from "../../styles/groups";

const Groups = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [token, setToken] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const authHeader = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const { isLoading: joinedLoading, data: joinedGroups = [], error: joinedError } = useQuery<GatheringGroup[]>({
        queryKey: ['groups-my'],
        enabled: !!token,
        queryFn: async () => {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/my-groups`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await res.json();
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });

    const { isLoading: discoverLoading, data: discoverableGroups = [] } = useQuery<GatheringGroup[]>({
        queryKey: ['groups-available', debouncedSearch],
        enabled: !!token,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set('searchString', debouncedSearch);
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/group/available-groups?${params}`, {
                method: 'GET',
                headers: authHeader
            });
            const data = await res.json();
            if (data.success) {
                return data.response;
            }
            throw new Error(data.error);
        }
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['groups-my'] });
        await queryClient.invalidateQueries({ queryKey: ['groups-available'] });
        setRefreshing(false);
    };

    const handleInviteResponse = async (groupId: number, accepted: boolean) => {
        const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/group/invite-response?id=${groupId}&accepted=${accepted}`,
            { method: 'PUT', headers: authHeader }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        await queryClient.invalidateQueries({ queryKey: ['groups-my'], exact: true });
    };

    const handleJoin = async (groupId: number) => {
        const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/group/request-to-join?id=${groupId}`,
            { method: 'POST', headers: authHeader }
        );
        const data = await res.json();
        if (data.success) {
            const group = discoverableGroups.find(g => g.id === groupId);
            if (group?.public) {
                await queryClient.invalidateQueries({ queryKey: ['groups-my'] });
                await queryClient.invalidateQueries({ queryKey: ['groups-available'] });
                router.push(`/group/${groupId}`);
            } else {
                await queryClient.invalidateQueries({ queryKey: ['groups-available'] });
            }
        }
    };

    const filteredJoinedGroups = joinedGroups.filter(g =>
        g.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Groups</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/new-group')}>
                    <Text style={styles.buttonText}>New Group</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="Search groups..."
                value={search}
                onChangeText={setSearch}
            />

            {joinedLoading && <ActivityIndicator style={{ marginVertical: 8 }} />}
            {!!joinedError && <Text style={styles.errorText}>Failed to load your groups.</Text>}

            {filteredJoinedGroups.map((group) => (
                <GroupCard
                    key={group.id}
                    group={group}
                    onPress={() => router.push(`/group/${group.id}`)}
                    onInviteResponse={(accepted) => handleInviteResponse(group.id, accepted)}
                />
            ))}
            {!joinedLoading && filteredJoinedGroups.length === 0 && (
                <Text style={styles.emptyText}>
                    {debouncedSearch ? 'No joined groups match your search.' : 'No groups yet — create one to get started.'}
                </Text>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Join another group</Text>

            {discoverLoading && <ActivityIndicator style={{ marginVertical: 8 }} />}
            {discoverableGroups.map((group) => (
                <GroupCard
                    key={group.id}
                    group={group}
                    onPress={() => router.push(`/group/${group.id}`)}
                    onJoin={() => handleJoin(group.id)}
                />
            ))}
            {!discoverLoading && discoverableGroups.length === 0 && (
                <Text style={styles.emptyText}>
                    {debouncedSearch ? 'No groups found matching your search.' : 'No groups available to join.'}
                </Text>
            )}
        </ScrollView>
    );
};

export default Groups;
