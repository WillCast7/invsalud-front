// navbar-routes.config.ts

export type NavbarActionType =
  | 'OPEN_INGRESO_MODAL'
  | 'OPEN_SALIDA_MODAL';

export interface NavbarAction {
  label: string;
  action: NavbarActionType;
}
