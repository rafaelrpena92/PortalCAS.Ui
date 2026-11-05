import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  smallMessagePopup(icon: SweetAlertIcon, message: string, action?: () => void, timer: number = 1500) {
    Swal.fire({
      position: "top",
      icon: icon,
      text: message,
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      width: '350px',
      customClass: {
        popup: 'swal-custom-small'
      }
    }).then((result) => {
      if (action) {
        action();
      }
    });
  }

  MessagePopup(icon: SweetAlertIcon, title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      icon: icon,
      confirmButtonColor: '#005cbb',
      customClass: {
        popup: 'swal-custom-small'
      }
    });
  }

  confirmMessagePopup(
    icon: SweetAlertIcon,
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    action: () => void) {
    Swal.fire({
      title: title,
      text: message,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        popup: 'swal-custom-small'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        action();
      }
    });
  }

  /** Confirmação que pede um texto obrigatório (ex.: motivo). Devolve null se cancelar. */
  async promptText(title: string, message: string, placeholder: string, confirmText: string, danger = false): Promise<string | null> {
    const result = await Swal.fire({
      title: title,
      text: message,
      input: 'textarea',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Voltar',
      confirmButtonColor: danger ? '#d7141a' : '#005cbb',
      reverseButtons: true,
      inputValidator: (value) => value?.trim() ? null : 'Este campo é obrigatório',
      customClass: {
        popup: 'swal-custom-small'
      }
    });
    return result.isConfirmed ? (result.value as string).trim() : null;
  }

  /** Confirmação simples que devolve true/false. */
  async confirm(title: string, message: string, confirmText: string, danger = false): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: danger ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Voltar',
      confirmButtonColor: danger ? '#d7141a' : '#005cbb',
      reverseButtons: true,
      focusCancel: danger,
      customClass: {
        popup: 'swal-custom-small'
      }
    });
    return result.isConfirmed;
  }
}
