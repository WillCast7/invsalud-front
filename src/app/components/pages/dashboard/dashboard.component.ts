import { Component, inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RestApiService } from '../../../services/rest-api.service';
import { AlertService } from '../../../services/alerts.service';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { RouterModule } from '@angular/router';
import { MenuItemInterface } from '../../../models/menuItem-interface';
import { MenuService } from '../../../services/menu.service';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CashSessionSummaryInterface } from '../../../models/cash-session-summary-interface';
import { ThirdPartyInterface } from '../../../models/inventory/thirdparty-interface';
import { ProductInterface } from '../../../models/inventory/product-interface';
import { SessionService } from '../../../services/session.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatAutocompleteModule,
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
  private readonly sessionService = inject(SessionService);

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
  filteredThirdParties: ThirdPartyInterface[] = [];
  filteredProducts: ProductInterface[] = [];

  private searchThirdPartySub?: Subscription;
  private searchProductSub?: Subscription;

  thirdPartyCtrl = new FormControl<string | ThirdPartyInterface>('');
  productCtrl = new FormControl<string | ProductInterface>('');

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

  normalizeMonthlyIncomes(backendIncomes: any[]): any[] {
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthMap: Record<number, number> = {};

    (backendIncomes || []).forEach(item => {
      let monthIdx = -1;
      if (typeof item.month === 'number') {
        monthIdx = item.month >= 1 && item.month <= 12 ? item.month - 1 : item.month;
      } else if (typeof item.month === 'string') {
        const mStr = item.month.toLowerCase().trim();
        if (mStr.startsWith('ene') || mStr.startsWith('jan') || mStr === '1' || mStr === '01') monthIdx = 0;
        else if (mStr.startsWith('feb') || mStr === '2' || mStr === '02') monthIdx = 1;
        else if (mStr.startsWith('mar') || mStr === '3' || mStr === '03') monthIdx = 2;
        else if (mStr.startsWith('abr') || mStr.startsWith('apr') || mStr === '4' || mStr === '04') monthIdx = 3;
        else if (mStr.startsWith('may') || mStr === '5' || mStr === '05') monthIdx = 4;
        else if (mStr.startsWith('jun') || mStr === '6' || mStr === '06') monthIdx = 5;
        else if (mStr.startsWith('jul') || mStr === '7' || mStr === '07') monthIdx = 6;
        else if (mStr.startsWith('ago') || mStr.startsWith('aug') || mStr === '8' || mStr === '08') monthIdx = 7;
        else if (mStr.startsWith('sep') || mStr.startsWith('set') || mStr === '9' || mStr === '09') monthIdx = 8;
        else if (mStr.startsWith('oct') || mStr === '10') monthIdx = 9;
        else if (mStr.startsWith('nov') || mStr === '11') monthIdx = 10;
        else if (mStr.startsWith('dic') || mStr.startsWith('dec') || mStr === '12') monthIdx = 11;
      }

      if (monthIdx >= 0 && monthIdx < 12) {
        monthMap[monthIdx] = (monthMap[monthIdx] || 0) + (Number(item.amount) || 0);
      }
    });

    return monthLabels.map((label, idx) => ({
      month: label,
      amount: monthMap[idx] || 0
    }));
  }

  getBarWidth(): number {
    return 22;
  }

  getBarX(index: number): number {
    const colWidth = 660 / 12;
    const barW = this.getBarWidth();
    return 30 + index * colWidth + (colWidth - barW) / 2;
  }

  getBarCenterX(index: number): number {
    const colWidth = 660 / 12;
    return 30 + index * colWidth + colWidth / 2;
  }

  getBarHeight(amount: number): number {
    if (!this.maxIncome || this.maxIncome <= 0 || !amount) return 0;
    return (amount / this.maxIncome) * 95;
  }

  getBarY(amount: number): number {
    return 130 - this.getBarHeight(amount);
  }

  getBarValY(amount: number): number {
    return Math.max(16, this.getBarY(amount) - 6);
  }

  get showFullDashboard(): boolean {
    const rId = this.sessionService.roleId;
    return rId === 1 || rId === 2 || rId === 3;
  }

  constructor() {
    this.monthlyIncomes = this.normalizeMonthlyIncomes([]);
    this.getData();
    if (this.showFullDashboard) {
      this.loadFiltersData();
    }
  }

  loadFiltersData() {
    this.setupFilterListeners();
  }

  getFilterLength(value: any): number {
    if (!value) return 0;
    if (typeof value === 'string') return value.trim().length;
    return 3;
  }

  findThirdParties(event?: any) {
    const rawVal = typeof event === 'string' ? event : (event?.target?.value ?? (typeof this.thirdPartyCtrl.value === 'string' ? this.thirdPartyCtrl.value : ''));
    const query = (rawVal || '').trim();

    if (this.searchThirdPartySub) {
      this.searchThirdPartySub.unsubscribe();
    }

    if (query.length < 3) {
      this.filteredThirdParties = [];
      return;
    }

    this.searchThirdPartySub = this.restService.getRequest('/thirdparty/' + encodeURIComponent(query)).subscribe({
      next: (res) => {
        this.filteredThirdParties = res.data || [];
      },
      error: () => {
        this.filteredThirdParties = [];
      }
    });
  }

  findProducts(event?: any) {
    const rawVal = typeof event === 'string' ? event : (event?.target?.value ?? (typeof this.productCtrl.value === 'string' ? this.productCtrl.value : ''));
    const query = (rawVal || '').trim();

    if (this.searchProductSub) {
      this.searchProductSub.unsubscribe();
    }

    if (query.length < 3) {
      this.filteredProducts = [];
      return;
    }

    this.searchProductSub = this.restService.getRequest('/products', { page: 0, size: 20, searchValue: query }).subscribe({
      next: (res) => {
        this.filteredProducts = res.pageable?.content || res.data?.content || res.data || [];
      },
      error: () => {
        this.filteredProducts = [];
      }
    });
  }

  setupFilterListeners() {
    this.thirdPartyCtrl.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        if (this.selectedThirdParty !== null) {
          this.selectedThirdParty = null;
          this.getData();
        }
        if (!value.trim() || value.trim().length < 3) {
          this.filteredThirdParties = [];
        }
      }
    });

    this.productCtrl.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        if (this.selectedProduct !== null) {
          this.selectedProduct = null;
          this.getData();
        }
        if (!value.trim() || value.trim().length < 3) {
          this.filteredProducts = [];
        }
      }
    });
  }

  displayThirdParty = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.fullName || '';
  };

  displayProduct = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || '';
  };

  onThirdPartySelected(event: MatAutocompleteSelectedEvent) {
    const tp = event.option.value as ThirdPartyInterface;
    this.selectedThirdParty = tp ? tp.id : null;
    this.getData();
  }

  onProductSelected(event: MatAutocompleteSelectedEvent) {
    const p = event.option.value as ProductInterface;
    this.selectedProduct = p ? p.id : null;
    this.getData();
  }

  clearThirdParty(event?: Event) {
    if (event) event.stopPropagation();
    if (this.searchThirdPartySub) {
      this.searchThirdPartySub.unsubscribe();
    }
    this.thirdPartyCtrl.setValue('');
    this.selectedThirdParty = null;
    this.filteredThirdParties = [];
    this.getData();
  }

  clearProduct(event?: Event) {
    if (event) event.stopPropagation();
    if (this.searchProductSub) {
      this.searchProductSub.unsubscribe();
    }
    this.productCtrl.setValue('');
    this.selectedProduct = null;
    this.filteredProducts = [];
    this.getData();
  }

  clearDateRange(event?: Event) {
    if (event) event.stopPropagation();
    this.startDate = null;
    this.endDate = null;
    this.getData();
  }

  onDateChange() {
    if ((this.startDate && this.endDate) || (!this.startDate && !this.endDate)) {
      this.getData();
    }
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
          this.monthlyIncomes = this.normalizeMonthlyIncomes(objData.data.monthlyIncomes || []);

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