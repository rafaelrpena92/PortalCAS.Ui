import { computed, inject, Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged
} from 'firebase/auth';
import { environment } from '../../environments/environment';
import { LoginService } from './Api/login.service';
import { DomainUser } from '../Models/Entities/User/DomainUser.model';
import { ClaimType } from '../Models/Entities/User/ClaimType.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private googleProvider = new GoogleAuthProvider();
  private loginService = inject(LoginService);

  userFirebase = signal<FirebaseUser | null>(null);
  tokenSignal = signal<string | null>(null);
  userDomain = signal<DomainUser | null>(null);

  isAdmin = computed(() => this.userDomain()?.claimType === ClaimType.Admin);
  isUser = computed(() => this.isAdmin() || this.userDomain()?.claimType === ClaimType.User);

  hasClaim(type: ClaimType): boolean {
    return this.userDomain()?.claimType === type;
  }

  constructor() {
    onIdTokenChanged(this.auth, async (user) => {

      if (!user) {
        this.userFirebase.set(null);
        this.tokenSignal.set(null);
        this.userDomain.set(null);
        console.log("Firebase Auth: Sessão encerrada.");
        return;
      }

      const isNewSession = this.userFirebase() === null;

      const token = await user.getIdToken();
      this.tokenSignal.set(token);
      this.userFirebase.set(user);

      console.log("Firebase Auth: Usuário detectado e Token atualizado.");

      if (isNewSession) {
        console.log("Iniciando sincronização com backend...");
        this.getUserData();
      }
    });
  }


  getToken(): string | null {
    return this.tokenSignal();
  }

  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      return result.user;
    } catch (error) {
      console.error("Erro no Google Login", error);
      throw error;
    }
  }

  async loginWithEmail(email: string, pass: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, pass);
      return result.user;
    } catch (error) {
      console.error("Erro no Email Login", error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, pass: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, pass);
      return result.user;
    } catch (error) {
      console.error("Erro ao cadastrar usuário", error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      throw error;
    }
  }

  private getUserData() {
    this.loginService.GetMe().subscribe({
      next: (response) => {
        if (response.success) {
          this.userDomain.set(response.data);
          console.log("Dados do banco SQL sincronizados:", response.data);
        }
      },
      error: (err) => {
        console.error("Erro ao sincronizar com backend:", err);
      }
    });
  }
}