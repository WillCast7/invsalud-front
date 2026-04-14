import { FormControl } from '@angular/forms';

export interface ProductListFormControls {
    brand: FormControl<string | null>;
    products: FormControl<string[] | null>;
}