import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);

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

  //EXEMPLOS
  // this.notification.MessagePopup("success", "Erro ao logar:", "Email ou senha inválidos");
  // this.notification.MiniMessagePopup("success", "", "mensagem")
  // this.notification.ConfirmMessagePopup("info", "titulo", "mensagem", "confirmar", "cancelar", () => this.Teste() )

}
