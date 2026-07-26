import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
    container: {paddingBottom: 40},
    dateTitle: {fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 12, marginBottom: 8},
    emptyText: {textAlign: 'center', color: '#888', marginTop: 8},
    card: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff'
    },
    cardTitle: {fontSize: 15, fontWeight: '600'},
    cardGroup: {fontSize: 13, color: '#666', marginTop: 2},
    cardGroupScroll: {fontSize: 13, marginTop: 2, color: '#12b886', fontWeight: '600'},
    cardTime: {fontSize: 13, color: '#444'},
    cardFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4},
    submitText: {color: '#fff', fontWeight: '600', fontSize: 16},
    rsvpPill: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4},
    rsvpPillText: {fontSize: 12, fontWeight: '600'},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24},
    modalTitle: {fontSize: 18, fontWeight: '700', marginBottom: 12},
    modalOption: {paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee'},
    modalOptionText: {fontSize: 16},
    modalCancel: {textAlign: 'center', color: '#228be6', marginTop: 16, fontSize: 16},
    submitButton: {
        flex: 1,
        backgroundColor: '#228be6',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 20
    },
    rejectionText: {color: '#adb5bd', fontSize: 13, textDecorationLine: 'underline'},
    cancelButton: {marginTop: 28, alignSelf: 'center', padding: 8},
    modalButtonRow: {flexDirection: 'row', marginTop: 20, gap: 10},
    createEventButton: {flex: 0.65, backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center'},
    closeButtonOutline: {
        flex: 0.35,
        borderWidth: 1.5,
        borderColor: '#228be6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14
    },
    closeButtonText: {color: '#228be6', fontWeight: '600', fontSize: 16}
});