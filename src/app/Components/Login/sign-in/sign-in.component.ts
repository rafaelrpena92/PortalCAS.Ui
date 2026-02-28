import { Component, Output, EventEmitter, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { FormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../Services/auth.service';
import { NotificationService } from '../../../Services/notification.service';
import { LoginUser } from '../../../Models/UserAggregate/Entities/login-user.model';
import { isValidEmail } from '../../../Utils/valitadors.util';


@Component({
  selector: 'app-sign-in',
  imports: [MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {

  private router = inject(Router);
  private notification = inject(NotificationService);
  private _authService = inject(AuthService);
  user: LoginUser = new LoginUser();

  constructor() { }

  @Output() changeLoginAction = new EventEmitter<void>();

  async signIn() {
    try {
      let msg = this.validateUser();

      if (msg) {
        this.notification.MessagePopup("warning", "Atenção", msg);
        return;
      }

      await this._authService.loginWithEmail(this.user.email, this.user.password);

      this.notification.smallMessagePopup("success", "Login efetuado com sucesso!",
        () => {
          this.goToHome();
        }, 1000);


    } catch (error) {
      this.notification.MessagePopup("warning", "Falha na Autenticação", "Email ou senha inválidos");
    }
  }

  async loginWithGoogle() {
    try {
      await this._authService.loginWithGoogle();

      this.notification.smallMessagePopup("success", "Login efetuado com sucesso!",
        () => {
          this.goToHome();
        }, 1000);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          this.notification.MessagePopup("error", "Falha na Autenticação", "E-mail ou senha incorretos.");
          break;

        case 'auth/user-disabled':
          this.notification.MessagePopup("error", "Conta Bloqueada", "Este usuário foi desativado. Entre em contato com o suporte.");
          break;

        case 'auth/too-many-requests':
          this.notification.MessagePopup("error", "Acesso Bloqueado", "Muitas tentativas falhas. Tente novamente mais tarde ou redefina sua senha.");
          break;

        case 'auth/invalid-email':
          this.notification.MessagePopup("error", "E-mail Inválido", "O formato do e-mail digitado não é válido.");
          break;

        default:
          this.notification.MessagePopup("error", "Erro Inesperado", "Ocorreu um erro ao tentar entrar: " + error.message);
          break;
      }
    }
  }

  createAccount() {
    this.changeLoginAction.emit();
  }

  //#region Private Methods

  private validateUser(): string {
    let msg = '';

    if (!this.user.email && !this.user.password)
      msg = "Informe o email e a senha."
    else if (!this.user.email)
      msg = "Informe o email.";
    else if (!isValidEmail(this.user.email))
      msg = "insira um formato de e-mail válido.";
    else if (!this.user.password)
      msg = "Informe a senha.";
    else if (this.user.password.length < 6)
      msg = "Informe uma senha com 6 ou mais caracteres.";

    return msg;
  }

  private goToHome() {
    this.router.navigate(['/home']);
  }

  //#endregion
}