import {StyleSheet} from 'react-native';
import {colors} from './colors';

export const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FAF7F2'},
    inner: {flex: 1, justifyContent: 'center'},
    title: {fontSize: 28, fontWeight: '700', marginBottom: 24, color: colors.terracotta.text},
    fieldContainer: {marginBottom: 16},
    label: {fontSize: 14, fontWeight: '500', marginBottom: 4, color: colors.sage.text},
    input: {borderWidth: 1, borderColor: colors.sage.secondary, borderRadius: 8, padding: 10, fontSize: 16, color: colors.terracotta.text},
    button: {backgroundColor: colors.terracotta.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8},
    buttonText: {color: '#fff', fontWeight: '600', fontSize: 16},
    link: {marginTop: 16, textAlign: 'center', color: colors.terracotta.primary},
    checkboxRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16},
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {backgroundColor: colors.terracotta.primary, borderColor: colors.terracotta.primary},
    checkboxCheckmark: {color: '#fff', fontSize: 14, fontWeight: '700'},
    checkboxLabel: {fontSize: 14, color: colors.sage.text}
});
