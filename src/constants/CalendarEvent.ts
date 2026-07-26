import {Rsvp} from "./enums/Rsvp";
import {Repetition} from "./enums/Repetition";

export interface CalendarEvent {
    id: number;
    name: string;
    description: string;
    date: string;
    groupId: number;
    groupName: string;
    myRsvp: Rsvp;
    repetition: Repetition;
    seriesId: number;
}
