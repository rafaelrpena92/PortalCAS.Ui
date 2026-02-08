import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-user',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent {
  
  constructor(private router: Router) { }

  @Output() changeLoginAction = new EventEmitter<void>();

  ChangeLoginAction() {
    this.changeLoginAction.emit();
  }
}