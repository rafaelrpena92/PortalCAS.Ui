import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { NewUser } from '../../../Models/Entities/User/new-user.model';
import { NotificationService } from '../../../Services/notification.service';
import { isValidEmail } from '../../../Utils/valitadors.util';

@Component({
  selector: 'app-new-user',
  imports: [MatButtonModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent {
  newUser: NewUser = new NewUser();

  constructor(
    private router: Router,
    private authService: AuthService,
    private notification: NotificationService
  ) { }

  @Output() changeLoginAction = new EventEmitter<void>();

  async signUp() {
    let msg = this.newUserValidate();
    if (msg) {
      this.notification.MessagePopup("warning", "Atenção", msg);
      return;
    }

    try {
      await this.authService.signUpWithEmail(this.newUser.email, this.newUser.password);

      this.notification.smallMessagePopup("success", "Conta criada com sucesso!",
        () => {
          this.goToHome();
        });

    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.notification.MessagePopup("error", "Falha ao Criar Usuário", "Este e-mail já está em uso.");
          break;
        case 'auth/invalid-email':
          this.notification.MessagePopup("error", "Falha ao Criar Usuário", "E-mail inválido.");
          break;
        default:
          this.notification.MessagePopup("error", "Erro Inesperado", "Erro ao criar conta: " + error.message);
          break;
      }
    }
  }

  goToLogin() {
    this.changeLoginAction.emit();
  }

  //#region Private Methods

  private newUserValidate(): string {
    let msg = '';

    if (!this.newUser.email)
      msg = "Informe o email";
    else if (!isValidEmail(this.newUser.email))
      msg = "Informe um email válido";
    else if (!this.newUser.password)
      msg = "Informe a senha";
    else if (!this.newUser.password)
      msg = "Informe a confirmação da senha";
    else if (this.newUser.password.length < 6)
      msg = "A senha deve ter no mínimo 6 caracteres.";
    else if (this.newUser.password !== this.newUser.confirmPassword)
      msg = "As senhas devem ser iguais!";

    return msg;
  }

  private goToHome() {
    this.router.navigate(['/home']);
  }

  //#endregion
}