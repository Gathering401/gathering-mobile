import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
    iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'flex-end' },
    menu: {
        marginTop: 100,
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    item: { paddingVertical: 14, paddingHorizontal: 16 },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: '#eee' },
    itemText: { fontSize: 15, color: colors.terracotta.text },
    itemTextDestructive: { fontSize: 15, color: '#e03131' },
});
