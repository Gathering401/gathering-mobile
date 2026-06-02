import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from '@tanstack/react-query';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GatheringGroup } from '../../constants/GatheringGroup';

const GroupCard = ({ group, onPress }: { group: GatheringGroup; onPress: () => void }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardRow}>
            <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{group.name}</Text>
                <Text style={styles.cardDescription}>{group.description}</Text>
            </View>
            {group.public && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Public</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);

const Groups = () => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

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
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });

    const filteredJoinedGroups = joinedGroups.filter(g =>
        g.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
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

const styles = StyleSheet.create({
    container: { padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 32, fontWeight: '700' },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
    button: { backgroundColor: '#228be6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    buttonText: { color: '#fff', fontWeight: '600' },
    searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
    card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: '#fff' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    cardDescription: { fontSize: 13, color: '#666', marginTop: 2 },
    badge: { backgroundColor: '#dbe9ff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
    badgeText: { color: '#228be6', fontSize: 12, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
    emptyText: { textAlign: 'center', color: '#888', marginVertical: 8 },
    errorText: { color: 'red', marginVertical: 8 },
});

export default Groups;