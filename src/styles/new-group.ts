import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 8, color: colors.terracotta.text },
    legend: { fontSize: 12, color: colors.sage.text, marginBottom: 16 },
    required: { color: '#CC3333' },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: colors.sage.text },
    hint: { fontSize: 12, color: colors.sage.text, marginTop: 4 },
    input: {
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: colors.terracotta.text,
    },
    textarea: { height: 100, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    switchLabel: { flex: 1, marginRight: 12 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.terracotta.primary,
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    cancelText: { color: colors.terracotta.primary, fontWeight: '600', fontSize: 16 },
    submitButton: {
        flex: 1,
        backgroundColor: colors.terracotta.primary,
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
