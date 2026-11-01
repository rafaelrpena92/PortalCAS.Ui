import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { LoginNewUser } from '../../../Models/UserAggregate/Entities/login-new-user.model';
import { NotificationService } from '../../../Services/notification.service';
import { isValidEmail } from '../../../Utils/valitadors.util';
import { DomainUserService } from '../../../Services/domain-user.service';
import { City } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { CityPickerComponent } from '../../Shared/city-picker/city-picker.component';

@Component({
  selector: 'app-new-user',
  imports: [MatButtonModule, MatIconModule, FormsModule, CommonModule, CityPickerComponent],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent {

  private router = inject(Router);
  private notification = inject(NotificationService);
  private _authService = inject(AuthService);
  private _userService = inject(DomainUserService);

  newUser: LoginNewUser = new LoginNewUser();
  city: City | null = null;

  constructor() {
    // Cidades vêm da API pública; a tela de login fica fora do layout principal
    this._userService.loadPublicData();
  }

  @Output() changeLoginAction = new EventEmitter<void>();

  async signUp() {
    let msg = this.newUserValidate();

    if (msg) {
      this.notification.MessagePopup("warning", "Atenção", msg);
      return;
    }

    try {
      await this._authService.signUpWithEmail(this.newUser.email, this.newUser.password);

      // O usuário é criado na API no primeiro GetMe; depois gravamos a cidade
      await this.waitForDomainUser();
      await this._userService.updateProfile({ cityId: this.city!.id });

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
          this.notification.MessagePopup("error", "Erro Inesperado", "Erro ao criar conta: " + (error.error?.message ?? error.message));
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
    else if (!this.city)
      msg = "Informe a cidade onde você mora";

    return msg;
  }

  /** Espera o AuthService carregar o usuário recém-criado (até 10 s). */
  private async waitForDomainUser() {
    for (let i = 0; i < 100 && !this._userService.domainUser(); i++)
      await new Promise(resolve => setTimeout(resolve, 100));

    if (!this._userService.domainUser())
      throw new Error("Não foi possível carregar a conta criada.");
  }

  private goToHome() {
    this.router.navigate(['/']);
  }
  //#endregion
}
