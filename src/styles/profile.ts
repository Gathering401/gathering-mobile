import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 20 },
    name: { fontSize: 19, fontWeight: '500', color: colors.terracotta.text },
    username: { fontSize: 13, color: colors.sage.text, marginTop: 2 },
    rows: { borderTopWidth: 0.5, borderTopColor: colors.sage.secondary },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.sage.secondary
    },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { fontSize: 13, color: colors.sage.text },
    rowValue: { fontSize: 14, color: colors.terracotta.text },
});
