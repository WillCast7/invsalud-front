import { Component, EventEmitter, Input, Output, signal, Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TableOption } from '../../models/table/table-options-interface';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-table-header-controls-component',
  imports: [
    MatIconModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
  ],
  templateUrl: './table-header-controls-component.component.html',
  styleUrl: './table-header-controls-component.component.css',
})
export class TableHeaderControlsComponentComponent {

  buttons = signal<TableOption[]>([]);
  toggles = signal<TableOption[]>([]);
  searchValue = "";

  @Input() set buttonsList(buttonsList: TableOption[]) {
    this.buttons.set(buttonsList || []);
  }

  @Input() set toggleList(toggleList: TableOption[]) {
    this.toggles.set(toggleList || []);
  }

  @Output() action: EventEmitter<any> = new EventEmitter();

  buttonAction(identifier: string, row: any) {
    this.action.emit({ type: identifier, row });
  }

}
