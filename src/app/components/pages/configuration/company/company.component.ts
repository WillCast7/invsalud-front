import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RestApiService } from '../../../../services/rest-api.service';
import { AlertService } from '../../../../services/alerts.service';
import { CompanyInterface, CompanyInitializer } from '../../../../models/company-interface';
import { CompanyDialogComponent } from '../../../dialogs/config/company-dialog/company-dialog.component';
import { SizemodalInitializer } from '../../../../models/modal/sizemodal-interface';
import { NgxMaskPipe } from 'ngx-mask';
import { config } from '../../../../../environment/aurea';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatCardModule,
    NgxMaskPipe
  ],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css',
})
export class CompanyComponent implements OnInit {
  config = config;
  company = signal<CompanyInterface>(CompanyInitializer);
  title: string = 'Información de la Empresa';

  private readonly dialog = inject(MatDialog);

  constructor(
    private readonly restService: RestApiService,
    private readonly alertService: AlertService
  ) { }

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.restService.getRequest('/company').subscribe({
      next: (response) => {
        const companyData = response.data;
        this.company.set(companyData);

        if (companyData?.price === undefined || companyData?.price === null) {
          this.restService.getRequest('/recipes').subscribe({
            next: (recipeRes) => {
              const payload = recipeRes?.data || recipeRes;
              const recipeData = Array.isArray(payload) ? payload[0] : payload;
              if (recipeData && (recipeData.priceUnit !== undefined || recipeData.price !== undefined)) {
                this.company.update((c) => ({
                  ...c,
                  price: recipeData.priceUnit ?? recipeData.price ?? 0
                }));
              }
            }
          });
        }
      },
      error: (error) => {
        this.alertService.infoMixin.fire({
          icon: 'error',
          title: error.error?.message || 'Error al obtener la información de la empresa.'
        });
      }
    });
  }

  openEditModal() {
    const dialogRef: MatDialogRef<CompanyDialogComponent> = this.dialog.open(CompanyDialogComponent, {
      ...SizemodalInitializer,
      data: { data: this.company() }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.message) {
        this.alertService.infoMixin.fire({
          icon: result.success ? 'success' : 'warning',
          title: result.message
        });
      }
      this.getData();
    });
  }
}
