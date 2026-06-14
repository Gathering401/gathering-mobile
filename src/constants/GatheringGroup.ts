import {GroupUser} from "./GroupUser";
import {Event} from "./Event";
import {InviteStatus} from "./enums/InviteStatus";
import {Role} from "./enums/Role";

export interface GatheringGroup {
    id?: number;
    name: string;
    description: string;
    public: boolean;
    members?: GroupUser[];
    events: Event[];
    inviteStatus: InviteStatus;
    invitedByGroup?: boolean;
    pendingRsvpCount: number;
    pendingJoinRequestCount: number;
    role: Role;
}
