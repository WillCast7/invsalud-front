import { MenuInterface } from "./menu-interface";
import { NotificationInterface } from "./notifications/notification-interface";

export interface AuthInterface {
    jwt: string;
    username: string;
    names: string;
    menus: MenuInterface[];
    notifications: NotificationInterface[];
}

