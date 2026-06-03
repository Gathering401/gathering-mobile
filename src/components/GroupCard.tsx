import {GatheringGroup} from "../constants/GatheringGroup";
import {useState} from "react";
import {InviteStatus} from "../constants/enums/InviteStatus";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {styles} from "../styles/groupCard";

interface GroupCardProps {
    group: GatheringGroup;
    onPress: () => void;
    onInviteResponse?: (accepted: boolean) => Promise<void>;
}

const GroupCard = ({ group, onPress, onInviteResponse }: GroupCardProps) => {
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
                {group.public && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Public</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default GroupCard;