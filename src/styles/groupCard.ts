import {StyleSheet} from "react-native";
import {colors} from "./colors";

export const styles = StyleSheet.create({
    card: {borderWidth: 1, borderColor: colors.sage.lightFill, borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: '#fff'},
    cardMuted: {backgroundColor: colors.sage.lightFill, borderColor: colors.sage.lightFill},
    cardRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    cardText: {flex: 1},
    cardTitle: {fontSize: 16, fontWeight: '500', color: colors.terracotta.text},
    cardDescription: {fontSize: 13, color: colors.sage.text, marginTop: 2},
    textMuted: {color: colors.sage.secondary},
    badge: {backgroundColor: colors.sage.lightFill, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8},
    badgeText: {color: colors.sage.text, fontSize: 12, fontWeight: '500'},
    pendingBadge: {
        backgroundColor: colors.sage.lightFill,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8
    },
    pendingBadgeText: {color: colors.sage.text, fontSize: 12, fontWeight: '500'},
    inviteActions: {flexDirection: 'row', gap: 8, marginLeft: 8},
    actionButton: {borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6},
    joinButton: {backgroundColor: colors.terracotta.primary},
    joinButtonText: {color: '#fff', fontWeight: '600', fontSize: 13},
    rejectButton: {backgroundColor: '#CC3333'},
    rejectButtonText: {color: '#fff', fontWeight: '600', fontSize: 13},
    rejectedBadge: {
        backgroundColor: '#fff5f5',
        borderColor: '#CC3333',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    rejectedBadgeText: {color: '#CC3333', fontSize: 13},
    bubbleRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8},
    bubble: {
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5
    },
    bubbleBlue: {backgroundColor: colors.terracotta.primary},
    bubbleRed: {backgroundColor: '#CC3333'},
    bubbleText: {color: '#fff', fontSize: 11, fontWeight: '700'},
});
