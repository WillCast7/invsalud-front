import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common'; // Imprescindible para el @for y @if
import { MatButtonModule } from '@angular/material/button';
import { NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { config, ngxMaskOptions } from '../../../environment/aurea';
import { ColumnTableInterface } from '../../models/table/column-table-interface';
import { PageableInitializer, PageableInterface } from '../../models/table/pageable-interface';
import { TableOption } from '../../models/table/table-options-interface';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    FormsModule,
    MatPaginatorModule,
    MatButtonModule,
    NgxMaskPipe
  ],
  providers: [provideNgxMask(ngxMaskOptions)],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  config = config;
  
  clickedRows = new Set<any>(); 
  
  // Variables internas
  internalColumns: ColumnTableInterface[] = [];
  pageableData: PageableInterface<any> = PageableInitializer;
  internalOptions: TableOption[] = [];

  // Inputs
  @Input() set options(options: TableOption[]) {
    this.internalOptions = options || [];
  }

  @Input() set columns(columns: ColumnTableInterface[]) {
    this.internalColumns = columns;
  }

  @Input() set pageable(pageable: PageableInterface<any>) {
    this.pageableData = pageable;
  }

  // Getters para el HTML
  get columnKeys(): string[] {
    // Extraemos solo las llaves (strings) para mat-table
    const keys = this.internalColumns.map(col => col.key);
    if (this.internalOptions.length > 0) {
      keys.push('actions');
    }
    return keys;
  }

  get dataSource(): any[] {
    // La tabla siempre debe renderizar el 'content' de la interfaz de Spring
    return this.pageableData.content || [];
  }

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() action: EventEmitter<any> = new EventEmitter();

  handlePageEvent(e: PageEvent) {
    this.pageChange.emit(e);
  }

  // Método unificado para cualquier acción
  handleAction(identifier: string, row: any) {
    this.action.emit({ type: identifier, row });
  }

  clickOption(row: any) {
    if (this.clickedRows.has(row)) {
      this.clickedRows.delete(row);
    } else {
      this.clickedRows.clear(); // Si solo quieres una fila activa a la vez
      this.clickedRows.add(row);
    }
    this.action.emit({ type: "view", row }); // Emitimos la fila seleccionada
  }
}