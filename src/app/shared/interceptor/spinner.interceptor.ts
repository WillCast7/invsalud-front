import { inject } from "@angular/core";
import { SpinnerService } from "../../services/spinner.service";
import { finalize } from "rxjs";
import { HttpInterceptorFn } from "@angular/common/http";

export const SpinnerInterceptor: HttpInterceptorFn = (req, next) => {
    // Si la petición es del chat de IA o lleva el header para omitir spinner, ejecutar en segundo plano sin congelar pantalla
    if (req.url.includes('/ai/') || req.headers.has('X-Skip-Spinner')) {
        return next(req);
    }
    const spinnerSvc = inject(SpinnerService);
    spinnerSvc.show();
    return next(req).pipe(finalize(() => spinnerSvc.hide()));
};