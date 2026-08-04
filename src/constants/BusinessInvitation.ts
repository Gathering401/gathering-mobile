export interface BusinessInvitation {
    id: number;
    name: string;
    description: string;
    businessName: string;
    dateStart: string | null;
    dateEnd: string | null;
    slotPosition: number;
    asPushNotification: boolean;
    locationAddress: string;
    averageCost: number;
}
