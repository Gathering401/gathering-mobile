import {Rsvp} from "./enums/Rsvp";

export interface PendingInvitation {
    eventId: number;
    groupId: number;
    rsvpStatus: Rsvp;
    eventName: string;
    date: string;
    groupName: string;
}
