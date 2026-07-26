export interface ActiveInvitation {
    id: number;
    name: string;
    description: string;
    businessName: string;
    dateStart: string | null;
    dateEnd: string | null;
    slotPosition: number;
    asPushNotification: boolean;
}
