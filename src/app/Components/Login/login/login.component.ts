import { Component } from '@angular/core';
import { SideImageComponent } from "../side-image/side-image.component";
import { SignInComponent } from "../sign-in/sign-in.component";
import { NewUserComponent } from "../new-user/new-user.component";
import { AuthService } from '../../../Services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [SideImageComponent, SignInComponent, NewUserComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

   showSignIn: boolean = true;

  constructor(private authService: AuthService, private http: HttpClient) {}
  
  ToggleForm() {
    this.showSignIn = !this.showSignIn;
  }

}
