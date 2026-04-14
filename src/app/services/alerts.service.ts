import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
    infoMixin = Swal.mixin({
        toast: true,
        position: 'top-end',
        background: 'rgba(255, 255, 255, 0.97)',
        showConfirmButton: false,
        timer: 7000,
        customClass: {
          container: 'swal2-on-top'
        },
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      reCallMixin = Swal.mixin({
        toast: true,
        showConfirmButton: true,
        showCancelButton: true,
        cancelButtonColor: '#ac0505',
        confirmButtonColor: '#3d5a80',
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cerrar',
        position: 'top-end',
        background: 'rgba(255, 255, 255, 0.9)',
        timer: 6000,
        customClass: {
          container: 'swal2-on-top'
        },
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      modal  = Swal.mixin({
        showCancelButton: true,
        inputAttributes: {
          autocorrect: 'off'
        },
        showLoaderOnConfirm: true,
        cancelButtonColor: '#ac0505',
        confirmButtonColor: '#3d5a80',
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        customClass: {
          container: 'swal2-on-top'
        },
      })

      modalWithInput = Swal.mixin({
        showCancelButton: true,
        inputAttributes: {
          autocorrect: 'off'
        },
        showLoaderOnConfirm: true,
        cancelButtonColor: '#ac0505',
        confirmButtonColor: '#3d5a80',
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        input: 'text',
        customClass: {
          container: 'swal2-on-top'
        },
      })
}
