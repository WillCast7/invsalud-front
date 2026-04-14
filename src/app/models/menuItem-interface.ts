import { MenuInterface } from "./menu-interface";

export interface MenuItemInterface {
    children: MenuInterface[];  // Indica si la operación fue exitosa o no
    father: string; // Mensaje de información o error
    nameFather: string; // Mensaje de información o error
}

