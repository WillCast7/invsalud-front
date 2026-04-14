export interface RecipientInterface {
    id?: number;
    notificationId: number;
    roleId: string;
    seenAt: Date;
    status: string;
    userId: number;
}

export const RecipientInitializer: RecipientInterface = {
    id: 0,  
    notificationId: 0,  
    roleId: '',
    seenAt: new Date,
    status: '',
    userId: 0
}