import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { BancaApiService } from '../../../../Services/Api/banca.api.service';
import { DomainUserService } from '../../../../Services/domain-user.service';
import { NotificationService } from '../../../../Services/notification.service';
import { Banca, BancaPhase } from '../../../../Models/BancaAggregate/banca.model';
import { dayRangeOf, embedVideoUrl, formatDate, formatPeriod, monthOf, PHASES } from '../../../../Utils/banca.util';

interface ScheduleStep {
  label: string;
  date: string;
  done: boolean;
  current: boolean;
}

/**
 * Página pública da banca: vídeo, datas, sobre, cronograma e local.
 */
@Component({
  selector: 'app-banca-detail',
  imports: [RouterLink, MatIconModule],
  templateUrl: './banca-detail.component.html',
  styleUrl: './banca-detail.component.css'
})
export class BancaDetailComponent {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private _bancaApi = inject(BancaApiService);
  private notification = inject(NotificationService);
  _userService = inject(DomainUserService);

  BancaPhase = BancaPhase;
  formatDate = formatDate;
  formatPeriod = formatPeriod;

  banca = signal<Banca | null>(null);
  notFound = signal(false);

  phase = computed(() => PHASES[this.banca()?.phase ?? BancaPhase.Rascunho]);
  day = computed(() => dayRangeOf(this.banca()?.examStart, this.banca()?.examEnd));
  month = computed(() => monthOf(this.banca()?.examStart));
  isMultiDay = computed(() => !!this.banca()?.examEnd && this.banca()!.examEnd !== this.banca()!.examStart);

  video = computed<SafeResourceUrl | null>(() => {
    const url = embedVideoUrl(this.banca()?.videoUrl);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  /** Candidato logado: mora na região deste CAS? */
  residence = computed<'visitor' | 'here' | 'other' | 'unknown'>(() => {
    if (!this._userService.isLoggedIn()) return 'visitor';
    const residenceId = this._userService.residenceEntityId();
    if (!residenceId) return 'unknown';
    return residenceId === this.banca()?.entityId ? 'here' : 'other';
  });

  schedule = computed<ScheduleStep[]>(() => {
    const b = this.banca();
    if (!b) return [];
    const phase = b.phase;
    const steps: [string, string, BancaPhase][] = [
      ['Inscrições e conferência de documentos', formatPeriod(b.inscriptionStart, b.inscriptionEnd), BancaPhase.InscricoesAbertas],
      ['Banca', `${formatPeriod(b.examStart, b.examEnd)} · horário de cada candidato informado pelo CAS`, BancaPhase.BancaEmAndamento],
      ['Resultado', 'Depois que os avaliadores lançarem as notas', BancaPhase.AguardandoResultado]
    ];
    const order = [BancaPhase.InscricoesEmBreve, BancaPhase.InscricoesAbertas, BancaPhase.AguardandoBanca, BancaPhase.BancaEmAndamento, BancaPhase.AguardandoResultado];
    const now = order.indexOf(phase);
    return steps.map(([label, date, stepPhase]) => {
      const idx = order.indexOf(stepPhase);
      return { label, date, done: now > idx, current: now === idx || (stepPhase === BancaPhase.BancaEmAndamento && phase === BancaPhase.AguardandoBanca) };
    });
  });

  mapsUrl = computed(() => {
    const b = this.banca();
    const query = [b?.locationName, b?.locationAddress, b?.locationNumber].filter(x => x).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  });

  /** Com vídeo e arte, o visitante alterna; o vídeo em Libras vem primeiro. */
  media = signal<'video' | 'image'>('video');
  imageUrl = computed(() => this.banca() ? this._bancaApi.ImageUrl(this.banca()!.id, this.banca()!.imageVersion) : '');
  editalUrl = computed(() => this.banca() ? this._bancaApi.EditalUrl(this.banca()!.id) : '');

  constructor() {
    this.route.paramMap.subscribe(params => this.load(params.get('id')!));
  }

  async copyAddress() {
    const b = this.banca();
    const address = [b?.locationAddress, b?.locationNumber].filter(x => x).join(', ');
    const text = [b?.locationName, address, b?.locationRoom].filter(x => x).join(' · ');
    try {
      await navigator.clipboard.writeText(text);
      this.notification.smallMessagePopup('success', 'Endereço copiado!');
    } catch {
      this.notification.MessagePopup('info', 'Endereço', text);
    }
  }

  private async load(id: string) {
    try {
      const res = await firstValueFrom(this._bancaApi.GetBanca(id));
      this.banca.set(res.data);
    } catch {
      this.notFound.set(true);
    }
  }
}
