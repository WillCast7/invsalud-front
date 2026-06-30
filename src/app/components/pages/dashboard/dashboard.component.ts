import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RouterModule } from '@angular/router';
import { MenuItemInterface } from '../../../models/menuItem-interface';
import { MenuService } from '../../../services/menu.service';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CashSessionSummaryInterface } from '../../../models/cash-session-summary-interface';
import { ThirdPartyInterface } from '../../../models/inventory/thirdparty-interface';
import { ProductInterface } from '../../../models/inventory/product-interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    RouterModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatMenuModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly dialog = inject(MatDialog);
  private readonly menuService = inject(MenuService);
  private readonly restService = inject(RestApiService);
  private readonly alertService = inject(AlertService);

  menu: MenuItemInterface[] = [];
  logoUrl: string = '';
  monthlyIncomes: any[] = [];
  maxIncome: number = 1;
  paymentMethods: any[] = [];
  totalPaymentVolume: number = 0;
  paymentSegments: any[] = [];
  cashSessionSummary: CashSessionSummaryInterface | null = null;

  thirdParties: ThirdPartyInterface[] = [];
  products: ProductInterface[] = [];
  selectedThirdParty: number | null = null;
  selectedProduct: number | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  getMenuDescription(name: string): string {
    const descMap: Record<string, string> = {
      'Gestion': 'Operaciones y procesos',
      'Configuracion': 'Ajustes del sistema',
      'Administracion': 'Control y finanzas',
      'Caja': 'Caja diaria y movimientos',
    };
    return descMap[name] || 'Módulo de la aplicación';
  }

  getIconClass(name: string): string {
    const classMap: Record<string, string> = {
      'Gestion': 'icon-blue',
      'Configuracion': 'icon-purple',
      'Administracion': 'icon-yellow',
      'Caja': 'icon-cyan',
    };
    return classMap[name] || 'icon-default';
  }

  formatAmount(value: number): string {
    if (!value && value !== 0) return '$0';
    if (value >= 1_000_000) {
      return '$' + (value / 1_000_000).toFixed(1) + 'M';
    }
    if (value >= 1_000) {
      return '$' + (value / 1_000).toFixed(1) + 'K';
    }
    return '$' + value.toLocaleString();
  }

  getPaymentMethodColor(name: string): string {
    const colorMap: Record<string, string> = {
      'Efectivo': '#2563eb',
      'Tarjeta Crédito': '#f97316',
      'Tarjeta Débito': '#3b82f6',
      'Transferencia Bancaria': '#10b981',
      'PSE': '#0d9488',
      'Nequi': '#06b6d4',
      'Daviplata': '#ec4899',
      'Cheque': '#8b5cf6',
      'Addi': '#6366f1',
      'Sistecredito': '#f43f5e'
    };
    return colorMap[name] || '#64748b';
  }

  getPaymentMethodIcon(name: string): string {
    const iconMap: Record<string, string> = {
      'Efectivo': 'payments',
      'Tarjeta Crédito': 'credit_card',
      'Tarjeta Débito': 'credit_card',
      'Transferencia Bancaria': 'account_balance',
      'PSE': 'account_balance',
      'Nequi': 'account_balance_wallet',
      'Daviplata': 'account_balance_wallet',
      'Cheque': 'money_off',
      'Addi': 'price_check',
      'Sistecredito': 'price_check'
    };
    return iconMap[name] || 'info';
  }

  formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0';
    return '$' + value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  constructor() {
    this.getData();
    this.loadFiltersData();
  }

  loadFiltersData() {
    this.restService.getRequest('/thirdparty', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.thirdParties = res.pageable?.content || res.data?.content || res.data || [];
      }
    });

    this.restService.getRequest('/products', { page: 0, size: 1000 }).subscribe({
      next: (res) => {
        this.products = res.pageable?.content || res.data?.content || res.data || [];
      }
    });
  }

  onFilterChange() {
    this.getData();
  }

  getData() {
    const params: any = {};
    if (this.selectedThirdParty !== null && this.selectedThirdParty !== undefined) {
      params.thirdPartyId = this.selectedThirdParty;
    }
    if (this.selectedProduct !== null && this.selectedProduct !== undefined) {
      params.productId = this.selectedProduct;
    }
    if (this.startDate) {
      params.startDate = this.formatDate(this.startDate);
    }
    if (this.endDate) {
      params.endDate = this.formatDate(this.endDate);
    }

    this.restService.getRequest("/dashboard", params).subscribe({
      next: (objData) => {
        console.log(objData);
        if (objData && objData.data) {
          this.menu = this.menuService.groupByFather(objData.data.menu || []);
          this.logoUrl = objData.data.logoUrl || '';
          this.monthlyIncomes = objData.data.monthlyIncomes || [];

          this.cashSessionSummary = objData.data.summaries || objData.data.cashSessionSummary || null;
          const amounts = this.monthlyIncomes.map(item => item.amount || 0);
          this.maxIncome = Math.max(...amounts, 1);

          this.paymentMethods = objData.data.paymentMethods || [];

          const totalPaymentVolume = this.paymentMethods.reduce((sum, item) => sum + (item.amount || 0), 0);
          this.totalPaymentVolume = totalPaymentVolume;

          const r = 40;
          const circumference = 2 * Math.PI * r;

          if (totalPaymentVolume === 0) {
            this.paymentSegments = [{
              name: 'Sin ingresos',
              amount: 0,
              percentage: 0,
              dashArray: `${circumference}`,
              dashOffset: 0,
              rotation: -90,
              color: '#e2e8f0',
              icon: 'info'
            }];
          } else {
            let currentRotation = -90;
            this.paymentSegments = this.paymentMethods.map(item => {
              const amount = item.amount || 0;
              const rawPct = (amount / totalPaymentVolume) * 100;
              const percentage = rawPct % 1 === 0 ? rawPct : parseFloat(rawPct.toFixed(1));
              const dashOffset = circumference - (rawPct / 100) * circumference;
              const rotation = currentRotation;

              currentRotation += (percentage / 100) * 360;

              return {
                name: item.name,
                amount,
                percentage,
                dashArray: `${circumference}`,
                dashOffset,
                rotation,
                color: this.getPaymentMethodColor(item.name),
                icon: this.getPaymentMethodIcon(item.name)
              };
            });
          }
        }
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error.message,
        });
      },
      complete: () => console.info('transaction complete'),
    });
  }
}