import {GroupUser} from "./GroupUser";
import {Event} from "./Event";

export interface GatheringGroup {
    id?: number;
    name: string;
    description: string;
    public: boolean;
    members?: GroupUser[];
    events: Event[];
}
