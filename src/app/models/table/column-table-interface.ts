export interface ColumnTableInterface {
  key: string;      // Nombre del campo en el objeto (ej: 'fullName')
  label: string;    // Título de la columna (ej: 'Nombre Completo')
  isSortable?: boolean; // Indica si la columna es ordenable 
  pipe?: 'date' | 'currency' | 'number' | 'status' | 'type'; // Tipo de pipe
  pipeArgs?: any; // Ej: 'dd/MM/yyyy' o 'USD'
}