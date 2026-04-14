import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RecipeInterface } from '../../models/inventory/recipe-interface';

@Component({
  selector: 'app-recipe-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    @if (recipeData) {
      <div class="row w-100 m-0 mt-3 p-0">
        <div class="col-md-4 mb-3">
          <mat-card class="shadow-sm border-0 bg-light h-100">
            <mat-card-content class="d-flex align-items-center p-4">
               <mat-icon color="primary" class="me-3" style="font-size: 3rem; width: 3rem; height: 3rem;">inventory_2</mat-icon>
               <div>
                 <p class="text-muted mb-1 fw-bold">Unidades Disponibles</p>
                 <h2 class="mb-0 text-primary fw-bold fs-1">{{ recipeData.availableUnits }}</h2>
               </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-4 mb-3">
          <mat-card class="shadow-sm border-0 bg-light h-100">
            <mat-card-content class="d-flex align-items-center p-4">
               <mat-icon color="accent" class="me-3" style="font-size: 3rem; width: 3rem; height: 3rem;">archive</mat-icon>
               <div>
                 <p class="text-muted mb-1 fw-bold">Unidades Historicas Totales</p>
                 <h2 class="mb-0 fw-bold fs-1" style="color: #6c757d;">{{ recipeData.totalUnits }}</h2>
               </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-4 mb-3">
          <mat-card class="shadow-sm border-0 bg-light h-100">
            <mat-card-content class="d-flex align-items-center p-4">
               <mat-icon color="warn" class="me-3" style="font-size: 3rem; width: 3rem; height: 3rem;">payments</mat-icon>
               <div>
                 <p class="text-muted mb-1 fw-bold">Precio de Venta</p>
                 <h2 class="mb-0 fw-bold fs-2 text-success">{{ recipeData.salePrice | currency }}</h2>
               </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    } @else {
      <div class="w-100 text-center py-5 text-muted bg-white border mt-3 rounded shadow-sm">
         <mat-icon style="font-size: 48px; width: 48px; height: 48px; opacity: 0.5;">info</mat-icon>
         <h4 class="mt-3">No hay información de recetarios</h4>
         <p>Aún no se ha registrado un balance inicial para recetarios.</p>
      </div>
    }
  `
})
export class RecipeTableComponent {
  @Input() recipeData: RecipeInterface | null = null;
}
