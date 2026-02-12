import { inject, Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  User,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged
} from 'firebase/auth';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private googleProvider = new GoogleAuthProvider();
  private apiService = inject(ApiService);
  
  usuarioLogado = signal<User | null>(null);
  tokenSignal = signal<string | null>(null);


  constructor() {
    onIdTokenChanged(this.auth, async (user) => {
      const acabouDeLogar = user && !this.usuarioLogado();
      if (user) {
        this.usuarioLogado.set(user);

        const token = await user.getIdToken();
        this.tokenSignal.set(token);

        console.log("Firebase Auth: Usuário detectado e Token atualizado.");

        if (acabouDeLogar) {
          this.apiService.getMe().subscribe({
            next: (response) => {
              if (response.success) {
                console.log("Resposta da API /user/me:", response.data);
              }
            },
            error: (err) => {
              console.error("Erro ao chamar a API /user/me", err);
            }
          });
        }
        
      } else {
        this.usuarioLogado.set(null);
        this.tokenSignal.set(null);
        console.log("Firebase Auth: Nenhum usuário logado.");
      }
    });
  }

  getTokenSync(): string | null {
    return this.tokenSignal();
  }

  async loginComGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      return result.user;
    } catch (error) {
      console.error("Erro no Google Login", error);
      throw error;
    }
  }

  async loginComEmail(email: string, pass: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, pass);
      return result.user;
    } catch (error) {
      console.error("Erro no Email Login", error);
      throw error;
    }
  }

  async cadastrarComEmail(email: string, pass: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, pass);
      return result.user;
    } catch (error) {
      console.error("Erro ao cadastrar usuário", error);
      throw error;
    }
  }

  async getToken(forceRefresh: boolean = false): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      const token = await user.getIdToken(forceRefresh);
      this.tokenSignal.set(token);
      return token;
    }
    return null;
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      throw error;
    }
  }

  GetUser(): User | null {
    return this.auth.currentUser;
  }
}