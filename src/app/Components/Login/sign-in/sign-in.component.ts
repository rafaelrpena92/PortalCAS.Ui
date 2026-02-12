import { Component, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  email: string = '';
  senha: string = ''; 

  constructor(private router: Router,  private authService: AuthService) { }

  @Output() changeLoginAction = new EventEmitter<void>();

  async SignIn() {
    try {
      await this.authService.loginComEmail(this.email, this.senha);
      this.router.navigate(['/home']);
    } catch (error) {
      alert("Erro ao logar: " + error);
    }
  }

  async loginComGoogle() {
    try {
      await this.authService.loginComGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error(error);
    }
  }

  ChangeLoginAction() {
    this.changeLoginAction.emit();
  }

}