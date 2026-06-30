import { Routes } from '@angular/router';
import { DashboardComponent } from './components/pages/dashboard/dashboard.component';
import { PublicChangePasswordComponent } from './components/pages/configuration/public-change-password/public-change-password.component';
import { AccountComponent } from './components/pages/configuration/account/account.component';
import { ConfigParamsComponent } from './components/pages/management/config-params/config-params.component';
import { UserComponent } from './components/pages/management/user/user.component';
import { ThirdPartyComponent } from './components/pages/management/third-party/third-party.component';
import { PrimaryComponent } from './components/pages/management/primary/primary.component';
import { ResolutionsComponent } from './components/pages/management/resolutions/resolutions.component';
import { InventoryComponent } from './components/pages/inventory/inventory/inventory.component';
import { InventoryExpiredComponent } from './components/pages/inventory/inventory-expired/inventory-expired.component';
import { OrdersComponent } from './components/pages/inventory/orders/orders.component';
import { SalesComponent } from './components/pages/inventory/sales/sales.component';
import { PurchasingComponent } from './components/pages/inventory/purchasing/purchasing.component';
import { BillTemplatesComponent } from './components/pages/configuration/bill-templates/bill-templates.component';
import { ReportsComponent } from './components/pages/reports/reports.component';
import { CompanyComponent } from './components/pages/configuration/company/company.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent, title: "Dashboard" },
    { path: 'reset-password', component: PublicChangePasswordComponent, title: "Restablecer contraseña" },
    { path: 'configuracion/micuenta', component: AccountComponent, title: "Mi cuenta" },
    { path: 'configuracion/parametrosconfiguracion', component: ConfigParamsComponent, title: "Parametros de configuracion" },
    { path: 'configuracion/plantillafacturas', component: BillTemplatesComponent, title: "Plantillas de Facturas" },
    { path: 'administracion/terceros', component: ThirdPartyComponent, title: "Terceros" },
    { path: 'administracion/usuarios', component: UserComponent, title: "Usuarios" },
    { path: 'administracion/primarios', component: PrimaryComponent, title: "Primarios" },
    { path: 'administracion/resoluciones', component: ResolutionsComponent, title: "Resoluciones" },
    { path: 'inventario/gestion', component: InventoryComponent, title: "Inventario" },
    { path: 'inventario/gestion/vencidos', component: InventoryExpiredComponent, title: "Inventario Vencido" },
    { path: 'gestion/cotizaciones', component: OrdersComponent, title: "Cotizaciones" },
    { path: 'gestion/salidas', component: SalesComponent, title: "Salidas" },
    { path: 'gestion/ingresos', component: PurchasingComponent, title: "Ingresos" },
    { path: 'administracion/reportes', component: ReportsComponent, title: "Reportes" },
    { path: 'configuracion/empresa', component: CompanyComponent, title: "Empresa" },
    { path: '**', redirectTo: '', pathMatch: 'full', title: "Dashboard" }
];
