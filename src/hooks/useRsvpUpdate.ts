import {Alert} from 'react-native';
import {useAuthHeader} from './useAuthHeader';
import {Rsvp} from '../constants/enums/Rsvp';
import {Repetition} from '../constants/enums/Repetition';

export const useRsvpUpdate = (onSuccess: () => void) => {
    const authHeader = useAuthHeader();

    const updateRsvp = async (groupId: number, eventId: number, repetition: Repetition, rsvp: Rsvp) => {
        const fire = async (applyToSeries: boolean) => {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/event/rsvp?id=${groupId}&eventId=${eventId}&rsvp=${rsvp}&applyToSeries=${applyToSeries}`,
                {method: 'PUT', headers: authHeader}
            );
            if (!response.ok) throw new Error('Failed to update RSVP');
            onSuccess();
        };

        if (repetition !== Repetition.none) {
            Alert.alert(
                'Update RSVP',
                'Apply this change to just this event or all upcoming events in the series?',
                [
                    {text: 'Just this event', onPress: () => fire(false)},
                    {text: 'All upcoming events', onPress: () => fire(true)}
                ]
            );
        } else {
            await fire(false);
        }
    }

    return {updateRsvp}
}
