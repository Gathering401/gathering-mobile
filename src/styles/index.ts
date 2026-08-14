import {StyleSheet} from 'react-native';
import {colors} from './colors';

export const dotPending = '#ef4444';
export const dotResponded = colors.terracotta.primary;

export const styles = StyleSheet.create({
    container: {paddingBottom: 40},
    contentContainer: {flexDirection: 'row', gap: 12, paddingHorizontal: 16},
    dateTitle: {fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 12, marginBottom: 8, color: colors.terracotta.text},
    emptyText: {textAlign: 'center', color: colors.sage.text, marginTop: 8},
    card: {
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff'
    },
    cardTitle: {fontSize: 15, fontWeight: '600', color: colors.terracotta.text},
    cardGroup: {fontSize: 13, color: colors.sage.text, marginTop: 2},
    cardGroupScroll: {fontSize: 13, marginTop: 2, color: colors.sage.primary, fontWeight: '600'},
    cardTime: {fontSize: 13, color: colors.sage.text},
    cardFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4},
    submitText: {color: '#fff', fontWeight: '600', fontSize: 16},
    rsvpPill: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4},
    rsvpPillText: {fontSize: 12, fontWeight: '600'},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24},
    modalTitle: {fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.terracotta.text},
    modalOption: {paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.sage.lightFill},
    modalOptionText: {fontSize: 16, color: colors.terracotta.text},
    modalCancel: {textAlign: 'center', color: colors.terracotta.primary, marginTop: 16, fontSize: 16},
    modalBody: {fontSize: 14, color: '#555', marginBottom: 16},
    modalButton: {
        borderWidth: 1,
        borderColor: colors.terracotta.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8
    },
    modalButtonPrimary: {backgroundColor: colors.sage.primary, borderColor: colors.sage.primary},
    modalButtonText: {fontSize: 15, fontWeight: '600'},
    rejectionText: {color: colors.sage.secondary, fontSize: 13, textDecorationLine: 'underline'},
    cancelButton: {marginTop: 28, alignSelf: 'center', padding: 8},
    modalButtonRow: {flexDirection: 'row', marginTop: 20, gap: 10},
    createEventButton: {flex: 0.65, backgroundColor: colors.terracotta.primary, borderRadius: 8, padding: 14, alignItems: 'center'},
    closeButtonOutline: {
        flex: 0.35,
        borderWidth: 1.5,
        borderColor: colors.terracotta.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14
    },
    closeButtonText: {color: colors.terracotta.primary, fontWeight: '600', fontSize: 16},
    secondaryButton: {
        borderWidth: 1.5,
        borderColor: colors.terracotta.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20
    },
    secondaryButtonText: {color: colors.terracotta.primary, fontWeight: '600', fontSize: 16}
});
