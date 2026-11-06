import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { SpinnerInterceptor } from './shared/interceptor/spinner.interceptor';
import { provideNgxMask } from 'ngx-mask';
import { ngxMaskOptions } from '../environment/aurea';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([SpinnerInterceptor])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideNgxMask(ngxMaskOptions)
  ]
};
