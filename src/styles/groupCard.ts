import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    card: {borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: '#fff'},
    cardMuted: {backgroundColor: '#f5f5f5', borderColor: '#e0e0e0'},
    cardRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    cardText: {flex: 1},
    cardTitle: {fontSize: 16, fontWeight: '600'},
    cardDescription: {fontSize: 13, color: '#666', marginTop: 2},
    textMuted: {color: '#aaa'},
    badge: {backgroundColor: '#dbe9ff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8},
    badgeText: {color: '#228be6', fontSize: 12, fontWeight: '500'},
    pendingBadge: {
        backgroundColor: '#e8e8e8',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8
    },
    pendingBadgeText: {color: '#888', fontSize: 12, fontWeight: '500'},
    inviteActions: {flexDirection: 'row', gap: 8, marginLeft: 8},
    actionButton: {borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6},
    joinButton: {backgroundColor: '#2f9e44'},
    joinButtonText: {color: '#fff', fontWeight: '600', fontSize: 13},
    rejectButton: {backgroundColor: '#e03131'},
    rejectButtonText: {color: '#fff', fontWeight: '600', fontSize: 13},
    rejectedBadge: {
        backgroundColor: '#fff5f5',
        borderColor: '#fa5252',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    rejectedBadgeText: {
        color: '#fa5252',
        fontSize: 13,
    },
});