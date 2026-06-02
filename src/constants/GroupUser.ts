import {Role} from "./enums/Role";
import {InviteStatus} from "./enums/InviteStatus";

export interface GroupUser {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: Role;
    inviteStatus: InviteStatus;
    invitedByGroup: boolean;
}
