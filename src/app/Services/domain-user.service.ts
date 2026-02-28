import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Entity } from '../Models/EntityAggregate/Entities/Entity.model';
import { ClaimType } from '../Models/UserAggregate/Enums/ClaimType.enum';
import { DomainUserApiService } from './Api/domain-user.api.service';
import { EntityApiService } from './Api/entity.api.service';
import { DomainUser } from '../Models/UserAggregate/Entities/domain-user.model';

@Injectable({
  providedIn: 'root'
})
export class DomainUserService {

  private _userApiService = inject(DomainUserApiService);
  private _entityApiService = inject(EntityApiService);

  private readonly USER_KEY = 'app_user_domain';
  private readonly ENTITIES_KEY = 'app_entities_all';

  domainUser = signal<DomainUser | null>(null);
  allEntities = signal<Entity[]>([]);
  isLoaded = signal<boolean>(false);
  private isLoading = false;

  isAdmin = computed(() => this.domainUser()?.claimType === ClaimType.Admin);
  isUser = computed(() => this.isAdmin() || this.domainUser()?.claimType === ClaimType.User);

  async loadUserData(): Promise<void> {
    if (this.isLoaded() || this.isLoading) return;

    // 1. TENTA CARREGAR DO CACHE (LocalStorage)
    const cachedUser = localStorage.getItem(this.USER_KEY);
    const cachedEntities = localStorage.getItem(this.ENTITIES_KEY);

    if (cachedUser && cachedEntities) {
      this.domainUser.set(JSON.parse(cachedUser));
      this.allEntities.set(JSON.parse(cachedEntities));
      this.isLoaded.set(true);
      console.log('Dados carregados do Cache');
      return; // Interrompe aqui, não precisa chamar a API
    }


    // 2. SE NÃO TIVER CACHE, BUSCA NA API
    try {
      this.isLoading = true;
      const [userRes, entitiesRes] = await Promise.all([
        firstValueFrom(this._userApiService.GetMe()),
        firstValueFrom(this._entityApiService.GetAllEntities())
      ]);

      if (userRes.success && entitiesRes.success) {
        const user = userRes.data;
        const entities = entitiesRes.data;

        // Processa a última entidade selecionada
        this.setLastSelectedEntity(user);

        // Atualiza os Signals
        this.domainUser.set(user);
        this.allEntities.set(entities);

        // SALVA NO CACHE PARA O PRÓXIMO F5
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem(this.ENTITIES_KEY, JSON.stringify(entities));

        this.isLoaded.set(true);
        console.log('Dados carregados da API e salvos no Cache');
      }

    } catch (err) {
      console.error("Erro na sincronização:", err);
      this.domainUser.set(null);
      this.isLoaded.set(false);
    } finally {
      this.isLoading = false;
    }
  }

  //Avisa o backend para persistir como a "última entidade selecionada"
  async setSelectedEntity(entity: Entity) {
    const currentUser = this.domainUser();
    if (!currentUser) return;

    // Atualiza o objeto do usuário com a nova entidade selecionada
    const updatedUser = { ...currentUser, selectedEntity: entity };
    this.domainUser.set(updatedUser);

    // ATUALIZA O CACHE (IMPORTANTE: para manter o F5 consistente)
    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));

    try {
      await firstValueFrom(this._entityApiService.SetLastSelectedEntity(currentUser.id, entity.id));
    } catch (err) {
      console.error("Erro ao persistir no backend:", err);
    }
  }

  clear() {
    this.domainUser.set(null);
    this.allEntities.set([]);
    this.isLoaded.set(false);
    this.isLoading = false;
    // LIMPA O CACHE NO LOGOUT
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ENTITIES_KEY);
  }

  //obtem a ultima entidade selecionada do banco
  private setLastSelectedEntity(user: DomainUser) {
    const entities = user.entities || [];
    if (user.lastSelectedEntity?.id) {
      const lastSelectedEntity = entities.find(e => e.id === user.lastSelectedEntity?.id);
      if (lastSelectedEntity)
        user.selectedEntity = lastSelectedEntity;
    }
  }
}