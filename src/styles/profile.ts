import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.03)' },
    editButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4 },
    editText: { color: '#228be6', fontSize: 13 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
    username: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
    name: { fontSize: 16, marginBottom: 8 },
    field: { fontSize: 15, marginBottom: 4, color: '#444' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 16, gap: 4, marginLeft: 12 },
    logoutText: { color: '#fa5252', fontSize: 13 },
    topActions: { flexDirection: 'row', alignSelf: 'flex-end', marginBottom: 16 },
});