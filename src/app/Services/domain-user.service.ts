import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { City, Entity, EntityRole } from '../Models/EntityAggregate/Entities/Entity.model';
import { DomainUserApiService } from './Api/domain-user.api.service';
import { EntityApiService } from './Api/entity.api.service';
import { DomainUser, UpdateProfile } from '../Models/UserAggregate/Entities/domain-user.model';

/**
 * Estado do usuário logado (ou visitante) e do CAS selecionado no topo.
 *
 * Regras de acesso ao mapa:
 * - visitante, candidato e administrador geral: todos os CAS;
 * - quem tem papel em algum CAS (avaliador / administrador do CAS): só os CAS em que trabalha.
 */
@Injectable({
  providedIn: 'root'
})
export class DomainUserService {

  private _userApiService = inject(DomainUserApiService);
  private _entityApiService = inject(EntityApiService);

  private readonly VISITOR_CAS_KEY = 'portalcas_cas_visitante';

  domainUser = signal<DomainUser | null>(null);
  allEntities = signal<Entity[]>([]);
  cities = signal<City[]>([]);
  selectedEntity = signal<Entity | null>(null);
  isLoaded = signal<boolean>(false);

  private publicLoad: Promise<void> | null = null;
  private userLoad: Promise<void> | null = null;

  isLoggedIn = computed(() => !!this.domainUser());
  isAdminGeral = computed(() => !!this.domainUser()?.isAdminGeral);
  residenceEntityId = computed(() => this.domainUser()?.residenceEntity?.entityId ?? null);
  workEntityIds = computed(() => (this.domainUser()?.roles ?? []).filter(r => r.role).map(r => r.entityId));

  /** Papel do usuário no CAS selecionado (administrador geral conta como administrador do CAS). */
  roleInSelected = computed<EntityRole | null>(() => {
    const entityId = this.selectedEntity()?.entityId;
    if (!entityId || !this.domainUser()) return null;
    if (this.isAdminGeral()) return EntityRole.AdminCas;
    return this.domainUser()!.roles.find(r => r.entityId === entityId)?.role ?? null;
  });

  isAvaliadorInSelected = computed(() => (this.roleInSelected() ?? 0) >= EntityRole.Avaliador);
  isAdminCasInSelected = computed(() => this.roleInSelected() === EntityRole.AdminCas);

  /** Candidato logado sem cidade: precisa completar o cadastro para se inscrever. */
  needsCity = computed(() => this.isLoggedIn() && !this.domainUser()?.city);

  /** CAS e cidades são públicos: carregados uma vez. */
  loadPublicData(): Promise<void> {
    this.publicLoad ??= (async () => {
      try {
        const [entitiesRes, citiesRes] = await Promise.all([
          firstValueFrom(this._entityApiService.GetAllEntities()),
          firstValueFrom(this._entityApiService.GetAllCities())
        ]);
        this.allEntities.set(entitiesRes.data ?? []);
        this.cities.set(citiesRes.data ?? []);
        if (!this.selectedEntity())
          this.selectedEntity.set(this.pickInitialEntity());
      } catch (err) {
        console.error('Erro ao carregar CAS e cidades:', err);
        this.publicLoad = null;
      }
    })();
    return this.publicLoad;
  }

  /** Busca o usuário na API (sem cache, para refletir mudanças de perfil na hora). */
  loadUserData(force = false): Promise<void> {
    if (this.userLoad && !force) return this.userLoad;

    this.userLoad = (async () => {
      await this.loadPublicData();
      const res = await firstValueFrom(this._userApiService.GetMe());
      this.domainUser.set(res.data);
      this.selectedEntity.set(this.pickInitialEntity());
      this.isLoaded.set(true);
    })();

    this.userLoad.catch(() => this.userLoad = null);
    return this.userLoad;
  }

  async updateProfile(profile: UpdateProfile) {
    const res = await firstValueFrom(this._userApiService.UpdateProfile(profile));
    this.domainUser.set(res.data);
  }

  canSelectEntity(entityId: string): boolean {
    if (!this.isLoggedIn() || this.isAdminGeral()) return true;
    const work = this.workEntityIds();
    return work.length === 0 || work.includes(entityId);
  }

  isResidence(entityId: string): boolean {
    return this.residenceEntityId() === entityId;
  }

  roleIn(entityId: string): EntityRole | null {
    return this.domainUser()?.roles.find(r => r.entityId === entityId)?.role ?? null;
  }

  async setSelectedEntity(entity: Entity) {
    if (!this.canSelectEntity(entity.entityId)) return;

    this.selectedEntity.set(entity);
    localStorage.setItem(this.VISITOR_CAS_KEY, entity.entityId);

    if (this.isLoggedIn()) {
      try {
        await firstValueFrom(this._userApiService.SetLastViewedEntity(entity.entityId));
      } catch (err) {
        console.error('Erro ao salvar o CAS escolhido:', err);
      }
    }
  }

  clear() {
    this.domainUser.set(null);
    this.isLoaded.set(false);
    this.userLoad = null;
    this.selectedEntity.set(this.pickInitialEntity());
  }

  /** Último CAS visto > CAS onde trabalha > CAS da cidade > escolha do visitante > CAS Guarapuava. */
  private pickInitialEntity(): Entity | null {
    const entities = this.allEntities();
    if (entities.length === 0) return null;

    const byId = (id?: string | null) => id ? entities.find(e => e.entityId === id) : undefined;
    const user = this.domainUser();

    const candidates = [
      byId(user?.lastViewedEntity?.entityId),
      byId(this.workEntityIds()[0]),
      byId(user?.residenceEntity?.entityId),
      byId(localStorage.getItem(this.VISITOR_CAS_KEY)),
      entities.find(e => e.name === 'CAS Guarapuava'),
      entities[0]
    ];

    return candidates.find(e => !!e && this.canSelectEntity(e.entityId)) ?? null;
  }
}
