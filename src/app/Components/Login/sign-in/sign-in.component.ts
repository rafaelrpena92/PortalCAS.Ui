import { Component, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {

  constructor(private router: Router) { }

  @Output() changeLoginAction = new EventEmitter<void>();

  ChangeLoginAction() {
    this.changeLoginAction.emit();
  }

  SignIn() {
    this.router.navigate(['/home']);
  }

}