import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class MenuService {
    public groupByFather(items: any[]): any[] {
        const groupedMenu = items.reduce((acc, currentItem) => {
            console.log("currentItem");
            console.log(currentItem);
            const { father } = currentItem;

            if (!acc[father]) {
                acc[father] = []; // Si no existe, inicializamos un array vacío para ese padre
            }

            acc[father].push(currentItem); // Agregamos el item al array correspondiente
            return acc;
        }, {});

        // Convertimos el objeto agrupado en un array de objetos
        return Object.keys(groupedMenu).map(father => ({
            father,
            nameFather: groupedMenu[father][0].nameFather, // Nombre del padre
            children: groupedMenu[father] // Los elementos hijos
        }));
    }
}