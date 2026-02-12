import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-new-user',
  imports: [MatButtonModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent {
  email: string = '';
  senha: string = '';
  confirmarSenha: string = '';

  constructor(private router: Router,  private authService: AuthService) { }

  @Output() changeLoginAction = new EventEmitter<void>();

  async cadastrar() {
    debugger
    // 1. Validação simples de senha
    if (this.senha !== this.confirmarSenha) {
      alert("As senhas não conferem!");
      return;
    }

    if (this.senha.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres (exigência do Firebase).");
      return;
    }

    try {
      const user = await this.authService.cadastrarComEmail(this.email, this.senha);
      
      console.log("Usuário criado com sucesso:", user);
      alert("Conta criada com sucesso!");
      
      this.router.navigate(['/home']);
      
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Este e-mail já está em uso.");
      } else if (error.code === 'auth/invalid-email') {
        alert("E-mail inválido.");
      } else {
        alert("Erro ao criar conta: " + error.message);
      }
    }
  }

  ChangeLoginAction() {
    this.changeLoginAction.emit();
  }
}