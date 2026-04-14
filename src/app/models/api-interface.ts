export interface ApiInterface<T> {
    state: boolean;  // Indica si la operación fue exitosa o no
    message: string; // Mensaje de información o error
    error: string;   // Detalle del error, si existe
    timestamp: string; // Fecha y hora en que ocurrió la operación
    trace: string;  // Traza del error (si es necesario para depuración)
    data: T;      // Datos adicionales o resultado de la operación
    pageable: any;  // Información de paginación
}

