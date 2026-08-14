import _ from "lodash";

export enum Rsvp {
    pending = 1,
    attending = 2,
    rejected = 3,
    maybe = 4,
}

export const getRsvpsForDropdown = () => {
    return Object.entries(Rsvp).filter(([_, value]) => typeof value !== "number").map(([key, value]) => ({ value: String(key), label: _.capitalize(String(value)) }));
}

export const getRsvpLabelFor = (rsvp: Rsvp | undefined) => {
    return _.capitalize(Object.entries(Rsvp).find(([_, value]) => value === rsvp)![0]);
}
