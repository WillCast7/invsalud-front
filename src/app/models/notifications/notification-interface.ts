import { RecipientInitializer, RecipientInterface } from "./recipient-interface";

export interface NotificationInterface {
    id?: number;
    route: string;
    type: string;
    title: string;
    message: string;
    recipient: RecipientInterface;
}

export const NotificationInitializer: NotificationInterface = {
    id: 0,  
    route: '',
    type: '',
    title: '',
    message: '',
    recipient: RecipientInitializer
}