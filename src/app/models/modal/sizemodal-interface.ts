export interface SizemodalInterface<T> {
    width: string;   // Ajusta el ancho al 80% de la pantalla
    height?: string;  // Ajusta la altura al 80% de la pantalla
    maxWidth: string; // Asegúrate de que no exceda el ancho de la ventana
    maxHeight: string; // Traza del error (si es necesario para depuración)
    data: T;      // Datos adicionales o resultado de la operación
}

export const SizemodalInitializer: SizemodalInterface<any> ={
    width: '90%',
    maxWidth: '90vw',
    maxHeight: '100%',
    data: null

}