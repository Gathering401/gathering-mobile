import {useState} from 'react';
import {useAuthHeader} from './useAuthHeader';
import {Rsvp} from '../constants/enums/Rsvp';
import {Repetition} from '../constants/enums/Repetition';

export const useRsvpUpdate = (onSuccess: () => void) => {
    const authHeader = useAuthHeader();
    const [pendingRsvp, setPendingRsvp] = useState<{groupId: number; eventId: number; rsvp: Rsvp} | null>(null);

    const fire = async (groupId: number, eventId: number, rsvp: Rsvp, applyToSeries: boolean) => {
        const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/event/rsvp?id=${groupId}&eventId=${eventId}&rsvp=${rsvp}&applyToSeries=${applyToSeries}`,
            {method: 'PUT', headers: authHeader}
        );
        if (!response.ok) {
            throw new Error('Failed to update RSVP');
        }
        onSuccess();
    };

    const updateRsvp = (groupId: number, eventId: number, repetition: Repetition, rsvp: Rsvp) => {
        if (repetition !== Repetition.none) {
            setTimeout(() => setPendingRsvp({groupId, eventId, rsvp}), 300);
        } else {
            void fire(groupId, eventId, rsvp, false);
        }
    }

    const confirmSeriesChoice = (applyToSeries: boolean) => {
        if (!pendingRsvp) return;
        const {groupId, eventId, rsvp} = pendingRsvp;
        setPendingRsvp(null);
        void fire(groupId, eventId, rsvp, applyToSeries);
    };

    const cancelSeriesPrompt = () => setPendingRsvp(null);

    return {updateRsvp, seriesPromptVisible: !!pendingRsvp, confirmSeriesChoice, cancelSeriesPrompt};
}
