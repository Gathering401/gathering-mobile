import {StyleSheet} from "react-native";
import {colors} from "./colors";

export const styles = StyleSheet.create({
    container: {flexGrow: 1, justifyContent: 'center', padding: 24},
    title: {fontSize: 28, fontWeight: '700', marginBottom: 24, color: colors.terracotta.text},
    fieldContainer: {marginBottom: 16},
    row: {flexDirection: 'row', gap: 12, marginBottom: 16},
    halfField: {flex: 1},
    label: {fontSize: 14, fontWeight: '500', marginBottom: 4, color: colors.sage.text},
    required: {color: '#CC3333'},
    legend: {fontSize: 12, color: colors.sage.text, marginBottom: 16},
    input: {borderWidth: 1, borderColor: colors.sage.secondary, borderRadius: 8, padding: 10, fontSize: 16, color: colors.terracotta.text},
    button: {backgroundColor: colors.terracotta.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8},
    buttonText: {color: '#fff', fontWeight: '600', fontSize: 16},
    link: {marginTop: 16, textAlign: 'center', color: colors.terracotta.primary},
    editLink: {marginTop: 16, textAlign: 'center', color: colors.terracotta.primary, fontSize: 17},
    inputDisabled: {
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: colors.terracotta.lightFill,
        color: colors.terracotta.secondary
    },
    secondaryButton: {borderWidth: 1, borderColor: colors.terracotta.primary, borderRadius: 8, padding: 12, alignItems: 'center', backgroundColor: 'transparent', marginTop: 8},
    secondaryButtonText: {color: colors.terracotta.primary, fontSize: 16, fontWeight: '600'},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24},
    checkboxRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16},
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2
    },
    checkboxChecked: {backgroundColor: colors.terracotta.primary, borderColor: colors.terracotta.primary},
    checkboxCheckmark: {color: '#fff', fontSize: 14, fontWeight: '700'},
    checkboxLabel: {flex: 1, fontSize: 14, color: colors.sage.text},
    checkboxLink: {color: colors.terracotta.primary, fontWeight: '600'}
});
