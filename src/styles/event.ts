import {StyleSheet} from 'react-native';
import {colors} from './colors';

export const styles = StyleSheet.create({
    centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    screen: {flex: 1, backgroundColor: '#FAF7F2'},
    container: {padding: 20},
    titleWrap: {marginBottom: 16},
    title: {fontSize: 24, fontWeight: '500', marginBottom: 4, color: '#1a1a1a'},
    hostedBy: {fontSize: 14, color: '#5c5c58'},
    dateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.terracotta.lightFill,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 18
    },
    dateChipText: {fontSize: 15, color: colors.terracotta.text, fontWeight: '500'},
    iconRow: {flexDirection: 'row', gap: 8, marginBottom: 18},
    actionButton: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: colors.terracotta.primary,
        borderRadius: 12,
        paddingVertical: 9,
        backgroundColor: 'transparent'
    },
    actionButtonActive: {backgroundColor: colors.sage.primary, borderColor: colors.sage.primary},
    actionButtonLabel: {fontSize: 12, color: colors.terracotta.text},
    actionButtonLabelActive: {color: '#fff'},
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
        width: '100%',
        marginBottom: 24
    },
    cardLabel: {fontSize: 13, color: '#8a8a86', marginBottom: 6},
    cardValue: {fontSize: 15, color: '#1a1a1a', lineHeight: 22, marginBottom: 16},
    rsvpPillWrap: {alignItems: 'center'},
    rsvpPill: {borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12},
    rsvpPillText: {fontWeight: '500', fontSize: 16},
    seriesDate: {fontSize: 15, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', color: '#333'},
    seriesDateUpcoming: {fontWeight: 'bold'},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24},
    modalTitle: {fontSize: 18, fontWeight: '700', marginBottom: 12},
    modalBody: {fontSize: 14, color: '#555', marginBottom: 16},
    modalOption: {paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee'},
    modalOptionText: {fontSize: 16},
    modalButton: {
        borderWidth: 1,
        borderColor: colors.terracotta.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8
    },
    modalButtonPrimary: {backgroundColor: colors.sage.primary, borderColor: colors.sage.primary},
    modalButtonDestructive: {backgroundColor: '#fa5252', borderColor: '#fa5252'},
    modalButtonText: {fontSize: 15, fontWeight: '600'},
    modalCancel: {textAlign: 'center', color: '#8a8a86', marginTop: 16, fontSize: 16},
    modalClose: {textAlign: 'center', marginTop: 16, fontSize: 15, color: '#8a8a86'},
    guestModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 24,
        height: '50%'
    },
    guestModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    guestRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    rsvpBadge: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4},
    rsvpBadgeText: {fontSize: 12, fontWeight: '600'},
    seriesModalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 32},
    seriesModalContent: {backgroundColor: '#fff', borderRadius: 16, padding: 24, maxHeight: '40%'},
});
