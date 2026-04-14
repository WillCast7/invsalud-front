import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncryptService {
  constructor() {}

  encrypt(value: string) {
    value = btoa(value);
    return value;
  }

  decrypt(value: string) {
    value = atob(value);
    return value;
  }
}
