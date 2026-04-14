import { Component, Inject, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { TableOption } from '../../models/table/table-options-interface';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-bottom-sheet',
  imports: [MatListModule, MatIconModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.css',
})
export class BottomSheetComponent {
  private _bottomSheetRef = inject(MatBottomSheetRef<BottomSheetComponent>);

  public data = inject<TableOption[]>(MAT_BOTTOM_SHEET_DATA);

  openLink(event: MouseEvent, option: string): void {
    this._bottomSheetRef.dismiss(option);
    event.preventDefault();
  }
  
}
