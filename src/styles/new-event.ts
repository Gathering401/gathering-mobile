import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
    textarea: { height: 100, textAlignVertical: 'top' },
    selectButton: { justifyContent: 'center' },
    disabled: { backgroundColor: '#f5f5f5', color: '#999' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 14, alignItems: 'center' },
    cancelText: { fontSize: 16, color: '#444' },
    submitButton: { flex: 1, backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalOptionText: { fontSize: 16 },
    modalCancel: { textAlign: 'center', color: '#228be6', marginTop: 16, fontSize: 16 },
});