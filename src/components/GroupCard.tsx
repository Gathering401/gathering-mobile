import {GatheringGroup} from "../constants/GatheringGroup";
import {useState} from "react";
import {InviteStatus} from "../constants/enums/InviteStatus";
import {Role} from "../constants/enums/Role";
import {Text, TouchableOpacity, View} from "react-native";
import {styles} from "../styles/groupCard";

interface GroupCardProps {
    group: GatheringGroup;
    onPress: () => void;
    onInviteResponse?: (accepted: boolean) => Promise<void>;
    onJoin?: () => Promise<void>;
}

const GroupCard = ({group, onPress, onInviteResponse, onJoin}: GroupCardProps) => {
    const [responding, setResponding] = useState(false);

    const isPendingInvite = group.inviteStatus === InviteStatus.pending && group.invitedByGroup;
    const isPendingRequest = group.inviteStatus === InviteStatus.pending && !group.invitedByGroup;

    const handleResponse = async (accepted: boolean) => {
        if (!onInviteResponse) return;
        setResponding(true);
        try {
            await onInviteResponse(accepted);
        } finally {
            setResponding(false);
        }
    };

    const handleJoin = async () => {
        if (!onJoin) return;
        setResponding(true);
        try {
            await onJoin();
        } finally {
            setResponding(false);
        }
    };

    const isAdmin = group.role === Role.admin || group.role === Role.owner;

    const Bubbles = () => (
        <View style={styles.bubbleRow}>
            {group.pendingRsvpCount > 0 && (
                <View style={[styles.bubble, styles.bubbleBlue]}>
                    <Text style={styles.bubbleText}>{group.pendingRsvpCount}</Text>
                </View>
            )}
            {isAdmin && group.pendingJoinRequestCount > 0 && (
                <View style={[styles.bubble, styles.bubbleRed]}>
                    <Text style={styles.bubbleText}>{group.pendingJoinRequestCount}</Text>
                </View>
            )}
        </View>
    );

    if (onJoin) {
        const isRejected = ([InviteStatus.rejected_by_group, InviteStatus.rejected_by_user] as InviteStatus[]).includes(group.inviteStatus);
        const isPending = group.inviteStatus === InviteStatus.pending;

        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{group.name}</Text>
                        <Text style={styles.cardDescription}>{group.description}</Text>
                    </View>
                    {isRejected ? (
                        <View style={[styles.actionButton, styles.rejectedBadge]}>
                            <Text style={styles.rejectedBadgeText}>Rejected</Text>
                        </View>
                    ) : isPending ? (
                        <View style={[styles.actionButton, styles.pendingBadge]}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.joinButton]}
                            onPress={handleJoin}
                            disabled={responding}
                        >
                            <Text style={styles.joinButtonText}>Join</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    if (isPendingInvite) {
        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{group.name}</Text>
                        <Text style={styles.cardDescription}>{group.description}</Text>
                    </View>
                    <View style={styles.inviteActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.joinButton]}
                            onPress={() => handleResponse(true)}
                            disabled={responding}
                        >
                            <Text style={styles.joinButtonText}>Join</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleResponse(false)}
                            disabled={responding}
                        >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    if (isPendingRequest) {
        return (
            <View style={[styles.card, styles.cardMuted]}>
                <View style={styles.cardRow}>
                    <View style={styles.cardText}>
                        <Text style={[styles.cardTitle, styles.textMuted]}>{group.name}</Text>
                        <Text style={[styles.cardDescription, styles.textMuted]}>{group.description}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardRow}>
                <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{group.name}</Text>
                    <Text style={styles.cardDescription}>{group.description}</Text>
                </View>
                <View style={styles.bubbleRow}>
                    <Bubbles/>
                    {Boolean(group.public) && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Public</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default GroupCard;