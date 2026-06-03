import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    hint: { fontSize: 12, color: '#666', marginTop: 2 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
    textarea: { height: 100, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    switchLabel: { flex: 1, marginRight: 12 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 14, alignItems: 'center' },
    cancelText: { fontSize: 16, color: '#444' },
    submitButton: { flex: 1, backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});