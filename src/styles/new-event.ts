import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
    legend: { fontSize: 13, color: '#CC3333', marginBottom: 16 },
    required: { color: '#CC3333' },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    input: {borderWidth: 1, borderColor: colors.sage.secondary, borderRadius: 8, padding: 10, fontSize: 16, color: colors.terracotta.text},
    textarea: { height: 100, textAlignVertical: 'top' },
    selectButton: { justifyContent: 'center' },
    disabled: { backgroundColor: colors.terracotta.lightFill },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: colors.terracotta.primary, borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: 'transparent' },
    cancelText: { fontSize: 16, color: colors.terracotta.primary },
    submitButton: { flex: 1, backgroundColor: colors.terracotta.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    secondaryButton: { borderWidth: 1, borderColor: colors.terracotta.primary, borderRadius: 8, padding: 12, alignItems: 'center', backgroundColor: 'transparent', marginTop: 8 },
    secondaryButtonText: { color: colors.terracotta.primary, fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalOptionText: { fontSize: 16 },
    modalCancel: { textAlign: 'center', color: colors.terracotta.primary, marginTop: 16, fontSize: 16 },
});
