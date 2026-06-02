import {Rsvp} from "./enums/Rsvp";
import {Role} from "./enums/Role";
import {Repetition} from "./enums/Repetition";

export interface Event {
    id: number;
    name: string;
    description: string;
    date: string;
    groupId: number;
    cost: number;
    location: string;
    host: EventUser;
    rsvps: EventUser[];
    seriesId?: number;
    repetition: Repetition;
    currentRole: Role;
}

export interface EventUser {
    userId: number;
    rsvp: Rsvp;
    username: string;
    fullName: string;
}
