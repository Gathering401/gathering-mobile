import {Rsvp} from "./enums/Rsvp";
import {Repetition} from "./enums/Repetition";

export interface PendingInvitation {
    eventId: number;
    groupId: number;
    rsvpStatus: Rsvp;
    eventName: string;
    description: string;
    date: string;
    groupName: string;
    repetition: Repetition;
    seriesId: number;
}
