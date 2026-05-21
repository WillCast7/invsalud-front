import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export function greaterThanValidator(controlName: string, matchingControlName: string, errorName: string = 'isLess'): ValidatorFn {
    return (abstractControl: AbstractControl): ValidationErrors | null => {
        const group = abstractControl as FormGroup;
        const control = group.get(controlName);
        const matchingControl = group.get(matchingControlName);

        if (!control || !matchingControl) return null;

        // Si el valor del segundo es menor o igual al del primero, lanzamos error
        if (matchingControl.value !== null && control.value !== null && Number(matchingControl.value) <= Number(control.value)) {
            return { [errorName]: true };
        }

        return null;
    };
}