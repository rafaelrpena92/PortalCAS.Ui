import { inject, Injectable, signal } from '@angular/core';
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
import { DomainUserService } from './domain-user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private googleProvider = new GoogleAuthProvider();
  private userService = inject(DomainUserService);

  userFirebase = signal<FirebaseUser | null>(null);
  tokenSignal = signal<string | null>(null);
  isAuthInitialized = signal<boolean>(false);

  private resolveReady!: (value: boolean) => void;

  public authReadyPromise = new Promise<boolean>(resolve => {
    this.resolveReady = resolve;
  });

  constructor() {
    onIdTokenChanged(this.auth, async (user) => {
      if (user) {
        // Usuário logado ou token renovado
        const token = await user.getIdToken();
        this.tokenSignal.set(token);
        this.userFirebase.set(user);

      } else {
        // USUÁRIO SAIU (Logout ou Sessão Expirada)
        this.clearSession();
      }

      this.resolveReady(true); 
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
      this.clearSession();
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      throw error;
    }
  }

  private clearSession() {
    this.userFirebase.set(null);
    this.tokenSignal.set(null);
    this.userService.clear();
  }
}