import { Component, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { DomainUserService } from '../../../../Services/domain-user.service';
import { BancaApiService } from '../../../../Services/Api/banca.api.service';
import { BancaSummary } from '../../../../Models/BancaAggregate/banca.model';
import { BancaCardComponent } from '../../../Shared/banca-card/banca-card.component';

/**
 * Bancas publicadas do CAS selecionado no topo. Público.
 */
@Component({
  selector: 'app-bancas-list',
  imports: [MatIconModule, BancaCardComponent],
  template: `
    <div class="page">
      <div>
        <h1 class="page-title">Bancas</h1>
        <p class="page-sub">Bancas de proficiência do {{ _userService.selectedEntity()?.name ?? 'CAS' }}.</p>
      </div>

      @if (isLoading()) {
        <div class="empty">Carregando bancas...</div>
      } @else {
        <div class="list">
          @for (banca of bancas(); track banca.id) {
            <app-banca-card [banca]="banca"></app-banca-card>
          } @empty {
            <div class="empty">
              <mat-icon>event_busy</mat-icon>
              Nenhuma banca publicada neste CAS por enquanto.
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { width: 100%; display: flex; flex-direction: column; gap: 18px; }
    .page-title { margin: 0; font-size: 1.8rem; font-weight: 700; }
    .page-sub { margin: 4px 0 0; color: #555b66; }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; border: 1px dashed #c9ced6; border-radius: 20px; color: #555b66; text-align: center; }
    @media (max-width: 600px) { .page-title { font-size: 1.5rem; } }
  `]
})
export class BancasListComponent {
  _userService = inject(DomainUserService);
  private _bancaApi = inject(BancaApiService);

  bancas = signal<BancaSummary[]>([]);
  isLoading = signal(true);

  constructor() {
    // Recarrega quando o CAS do topo muda
    effect(() => {
      const entityId = this._userService.selectedEntity()?.entityId;
      if (entityId)
        this.load(entityId);
    });
  }

  private async load(entityId: string) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this._bancaApi.GetPublicBancas(entityId));
      this.bancas.set(res.data ?? []);
    } catch (err) {
      console.error(err);
      this.bancas.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
