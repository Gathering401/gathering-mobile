import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 32, fontWeight: '700' },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
    button: { backgroundColor: '#228be6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    buttonText: { color: '#fff', fontWeight: '600' },
    searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
    emptyText: { textAlign: 'center', color: '#888', marginVertical: 8 },
    errorText: { color: 'red', marginVertical: 8 },
});