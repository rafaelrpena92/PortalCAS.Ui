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
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private googleProvider = new GoogleAuthProvider();
  private userService = inject(DomainUserService);
  private notification = inject(NotificationService);

  userFirebase = signal<FirebaseUser | null>(null);
  tokenSignal = signal<string | null>(null);
  isAuthInitialized = signal<boolean>(false);

  private resolveReady!: (value: boolean) => void;

  public authReadyPromise = new Promise<boolean>(resolve => {
    this.resolveReady = resolve;
  });

  constructor() {
    onIdTokenChanged(this.auth, async (user) => {
      try {
        if (user) {
          // 1. Token primeiro: as chamadas à API dependem dele
          const token = await user.getIdToken();
          const isNewLogin = this.userFirebase()?.uid !== user.uid;

          this.tokenSignal.set(token);
          this.userFirebase.set(user);

          // 2. Perfil e papéis vêm sempre da API (nada de cache antigo)
          if (isNewLogin)
            await this.loadDomainUser();
        } else {
          // Caso de logout ou sessão expirada
          this.clearSession();
        }
      } catch (error) {
        console.error("Erro ao processar mudança de token:", error);
        this.clearSession();
      } finally {
        // 3. Só agora os Guards continuam: token e perfil já estão disponíveis
        this.isAuthInitialized.set(true);
        this.resolveReady(true);
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
      this.clearSession();
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      throw error;
    }
  }

  private async loadDomainUser() {
    try {
      await this.userService.loadUserData(true);
    } catch (error: any) {
      // Conta desativada (403) ou API fora do ar: não deixa a sessão pela metade
      const message = error?.error?.message ?? 'Não foi possível carregar seus dados. Tente novamente.';
      this.notification.MessagePopup('warning', 'Atenção', message);
      await signOut(this.auth);
      throw error;
    }
  }

  private clearSession() {
    this.userFirebase.set(null);
    this.tokenSignal.set(null);
    this.userService.clear();
  }
}
