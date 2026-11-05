import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { BancaApiService } from '../../../../Services/Api/banca.api.service';
import { DomainUserService } from '../../../../Services/domain-user.service';
import { NotificationService } from '../../../../Services/notification.service';
import { BancaPhase, BancaStatus, BancaSummary } from '../../../../Models/BancaAggregate/banca.model';
import { dayRangeOf, monthOf, PHASES, STATUS_LABEL, yearOf } from '../../../../Utils/banca.util';

type Filter = 'todas' | BancaStatus;

/**
 * Gerenciar bancas do CAS selecionado: criar, editar, ativar e cancelar. Avaliador do CAS.
 */
@Component({
  selector: 'app-manage-bancas',
  imports: [RouterLink, MatIconModule],
  templateUrl: './manage-bancas.component.html',
  styleUrl: './manage-bancas.component.css'
})
export class ManageBancasComponent {
  _userService = inject(DomainUserService);
  private _bancaApi = inject(BancaApiService);
  private notification = inject(NotificationService);

  BancaStatus = BancaStatus;
  statusLabel = STATUS_LABEL;
  phases = PHASES;
  day = (b: BancaSummary) => dayRangeOf(b.examStart, b.examEnd);

  bancas = signal<BancaSummary[]>([]);
  isLoading = signal(true);
  busyId = signal<string | null>(null);
  filter = signal<Filter>('todas');

  filters = computed(() => {
    const all = this.bancas();
    const count = (f: Filter) => all.filter(b => f === 'todas' || b.status === f).length;
    return ([
      ['todas', 'Todas'],
      [BancaStatus.Rascunho, 'Rascunho'],
      [BancaStatus.Ativa, 'Ativas'],
      [BancaStatus.Cancelada, 'Canceladas']
    ] as [Filter, string][]).map(([key, label]) => ({ key, label, count: count(key) }));
  });

  list = computed(() => this.bancas().filter(b => this.filter() === 'todas' || b.status === this.filter()));

  constructor() {
    effect(() => {
      const entityId = this._userService.selectedEntity()?.entityId;
      if (entityId && this._userService.isAvaliadorInSelected())
        this.load(entityId);
    });
  }

  month(b: BancaSummary) {
    const year = yearOf(b.examStart);
    return year && year !== new Date().getFullYear() ? `${monthOf(b.examStart)} ${String(year).slice(2)}` : monthOf(b.examStart);
  }

  isFinished(b: BancaSummary) {
    return b.phase === BancaPhase.AguardandoResultado || b.phase === BancaPhase.Cancelada;
  }

  /** Etapas do editor para o resumo do rascunho (3 e 4 não têm o que faltar; 5 é a ativação). */
  steps(b: BancaSummary) {
    // Em sequência: uma etapa só conta se as anteriores também estão feitas
    const own = [b.infoDone, b.scheduleDone, true, true, b.canActivate];
    const labels = ['Informações', 'Data e local', 'Documentos', 'Avaliadores', 'Mídia e ativação'];
    let previous = true;
    return own.map((done, i) => {
      previous = previous && done;
      return { n: i + 1, label: labels[i], done: previous };
    });
  }

  doneCount(b: BancaSummary) {
    return this.steps(b).filter(s => s.done).length;
  }

  canCancel(b: BancaSummary) {
    return b.status === BancaStatus.Ativa && b.phase !== BancaPhase.AguardandoResultado;
  }

  async activate(b: BancaSummary) {
    const ok = await this.notification.confirm('Ativar banca?',
      `"${b.title}" vai aparecer no site e virar notícia. A fase passa a seguir as datas.`, 'Ativar banca');
    if (!ok) return;

    this.busyId.set(b.id);
    try {
      await firstValueFrom(this._bancaApi.Activate(b.id));
      this.notification.smallMessagePopup('success', 'Banca ativada e notícia publicada!');
      await this.reload();
    } catch (error: any) {
      this.notification.MessagePopup('warning', 'Ainda não dá para ativar', error?.error?.message ?? 'Não foi possível ativar.');
    } finally {
      this.busyId.set(null);
    }
  }

  async cancel(b: BancaSummary) {
    const reason = await this.notification.promptText('Cancelar banca?',
      `Os inscritos de "${b.title}" serão avisados. O cancelamento fica registrado no histórico com o seu nome.`,
      'Motivo (aparece para os candidatos)', 'Cancelar banca', true);
    if (!reason) return;

    this.busyId.set(b.id);
    try {
      await firstValueFrom(this._bancaApi.Cancel(b.id, reason));
      this.notification.smallMessagePopup('success', 'Banca cancelada.');
      await this.reload();
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível cancelar.');
    } finally {
      this.busyId.set(null);
    }
  }

  async remove(b: BancaSummary) {
    const ok = await this.notification.confirm('Remover rascunho?',
      `"${b.title}" será apagada. Como nunca foi publicada, nenhum candidato é afetado. A remoção fica no histórico. Esta ação não pode ser desfeita.`, 'Remover', true);
    if (!ok) return;

    this.busyId.set(b.id);
    try {
      await firstValueFrom(this._bancaApi.Delete(b.id));
      this.notification.smallMessagePopup('success', 'Rascunho removido.');
      await this.reload();
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível remover.');
    } finally {
      this.busyId.set(null);
    }
  }

  private async reload() {
    const entityId = this._userService.selectedEntity()?.entityId;
    if (entityId) await this.load(entityId);
  }

  private async load(entityId: string) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this._bancaApi.GetManagedBancas(entityId));
      this.bancas.set(res.data ?? []);
    } catch (err) {
      console.error(err);
      this.bancas.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
