import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { BancaApiService } from '../../../../Services/Api/banca.api.service';
import { DomainUserService } from '../../../../Services/domain-user.service';
import { NotificationService } from '../../../../Services/notification.service';
import { Banca, BancaStatus, BancaType, SaveBanca } from '../../../../Models/BancaAggregate/banca.model';
import { formatPeriod, PHASES, STATUS_LABEL } from '../../../../Utils/banca.util';
import { DateRangePickerComponent, DateRange } from '../../../Shared/date-range-picker/date-range-picker.component';

interface Step {
  n: number;
  label: string;
}

const STEPS: Step[] = [
  { n: 1, label: 'Informações' },
  { n: 2, label: 'Data e local' },
  { n: 3, label: 'Documentos' },
  { n: 4, label: 'Avaliadores' },
  { n: 5, label: 'Mídia e ativação' }
];

/** Arte de divulgação: 16:9, como o vídeo. */
export const IMAGE_RULES = { width: 1600, height: 900, minWidth: 1200, maxMb: 5, types: ['image/jpeg', 'image/png', 'image/webp'] };

const TYPE_OPTIONS = [
  { type: BancaType.TradutorInterprete, label: 'Tradutor/Intérprete', hint: 'Libras ↔ Português', title: 'Banca de Proficiência — Tradutor/Intérprete de Libras' },
  { type: BancaType.Instrutor, label: 'Instrutor de Libras', hint: 'Ensino de Libras', title: 'Banca de Proficiência — Instrutor de Libras' },
  { type: BancaType.Outra, label: 'Outra', hint: 'Defina o nome', title: '' }
];

/**
 * Criar e editar banca em 5 etapas. Cada "Continuar" também grava o rascunho.
 */
@Component({
  selector: 'app-banca-editor',
  imports: [FormsModule, MatIconModule, RouterLink, DateRangePickerComponent],
  templateUrl: './banca-editor.component.html',
  styleUrl: './banca-editor.component.css'
})
export class BancaEditorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _bancaApi = inject(BancaApiService);
  private notification = inject(NotificationService);
  _userService = inject(DomainUserService);

  steps = STEPS;
  typeOptions = TYPE_OPTIONS;
  BancaType = BancaType;
  BancaStatus = BancaStatus;
  statusLabel = STATUS_LABEL;
  phases = PHASES;
  formatPeriod = formatPeriod;

  step = signal(1);
  form = signal<SaveBanca>(this.emptyForm());
  saved = signal<Banca | null>(null);
  isSaving = signal(false);
  /** Liga as bordas vermelhas depois de tentar avançar sem as datas. */
  showErrors = signal(false);
  /** Regras das notas (etapa 4) ficam escondidas até clicar no "i". */
  showRules = signal(false);
  showActivationInfo = signal(false);
  isLoading = signal(false);
  newCriterion = '';
  imageRules = IMAGE_RULES;
  /** Prévia da arte (URL local do arquivo baixado com o token). */
  imagePreview = signal<string | null>(null);
  /** Tamanho real da arte enviada, para comparar com o recomendado. */
  imageSize = signal<{ width: number; height: number } | null>(null);
  imageWarning = computed(() => {
    const size = this.imageSize();
    if (!size) return null;
    const ratio = size.width / size.height;
    if (Math.abs(ratio - 16 / 9) > 0.03) return 'A imagem não está em 16:9. Ela aparece inteira, com faixas nas laterais ou em cima e embaixo.';
    if (size.width < IMAGE_RULES.minWidth) return `A imagem é pequena (${size.width} px de largura) e pode ficar borrada. Use pelo menos ${IMAGE_RULES.minWidth} px.`;
    return null;
  });

  isNew = computed(() => !this.form().id);

  /** Inscrições precisam terminar antes do início da banca. */
  overlaps = computed(() => {
    const f = this.form();
    return !!f.inscriptionEnd && !!f.examStart && f.inscriptionEnd >= f.examStart;
  });

  /** Períodos e local (nome, endereço, número e sala) são obrigatórios para sair da etapa 2. */
  missingSchedule = computed(() => {
    const f = this.form();
    const missing: string[] = [];
    if (!f.inscriptionStart || !f.inscriptionEnd) missing.push('período de inscrições');
    if (!f.examStart || !f.examEnd) missing.push('período da banca');
    if (this.overlaps()) missing.push('inscrições terminando antes do início da banca');
    if (!f.locationName?.trim()) missing.push('nome do local');
    if (!f.locationAddress?.trim()) missing.push('endereço');
    if (!f.locationNumber?.trim()) missing.push('número');
    if (!f.locationRoom?.trim()) missing.push('sala / bloco');
    return missing;
  });

  /** A banca começa no dia seguinte ao fim das inscrições. */
  examMin = computed(() => {
    const end = this.form().inscriptionEnd;
    if (!end) return null;
    const [y, m, d] = end.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  });
  isCanceled = computed(() => this.saved()?.status === BancaStatus.Cancelada);

  /** Etapa 1: título, resumo e (se "Outra") o nome do tipo. */
  /** O que falta na etapa 1 (Informações). */
  missingInfo = computed(() => {
    const f = this.form();
    const missing: string[] = [];
    if (!f.title?.trim() || f.title === 'Nova banca') missing.push('título da banca');
    if (f.type === BancaType.Outra && !f.customTypeName?.trim()) missing.push('nome do tipo de banca');
    if (!f.summary?.trim()) missing.push('resumo');
    return missing;
  });

  infoDone = computed(() => this.missingInfo().length === 0);

  /**
   * Etapa preenchida, pelos dados (não pela ordem de navegação).
   * 3 (documentos) e 4 (avaliadores) não têm o que faltar; 5 (mídia) fica pronta quando a arte foi enviada e o cadastro está completo.
   */
  stepDone(n: number): boolean {
    // Em sequência: a etapa só conta se as anteriores também estão feitas
    if (n > 1 && !this.stepDone(n - 1)) return false;
    return this.ownStepDone(n);
  }

  /** O que falta em uma etapa (vazio = pronta). */
  missingIn(n: number): string[] {
    if (n === 1) return this.missingInfo();
    if (n === 2) return this.missingSchedule();
    return [];
  }

  private ownStepDone(n: number): boolean {
    switch (n) {
      case 1: return this.infoDone();
      case 2: return this.missingSchedule().length === 0;
      case 3: return !!this.form().id;
      case 4: return !!this.form().id && this.form().gradersCount >= 1;
      case 5: return !!this.saved() && (this.saved()!.status !== BancaStatus.Rascunho || this.isComplete());
      default: return false;
    }
  }

  /** Rascunho com tudo preenchido (conforme o último salvamento). */
  isComplete = computed(() => !!this.saved() && this.saved()!.missingForActivation.length === 0);
  isDraft = computed(() => !this.saved() || this.saved()!.status === BancaStatus.Rascunho);

  /** Cronograma gerado a partir das datas (etapa 2 e 5). */
  timeline = computed(() => {
    const f = this.form();
    return [
      { label: 'Inscrições e conferência', date: formatPeriod(f.inscriptionStart, f.inscriptionEnd), ok: !!f.inscriptionStart && !!f.inscriptionEnd },
      { label: 'Banca', date: formatPeriod(f.examStart, f.examEnd), ok: !!f.examStart && !!f.examEnd },
      // Não tem data: sai depois da banca, quando todas as notas forem lançadas
      { label: 'Resultado', date: f.examEnd ? `a partir de ${formatPeriod(f.examEnd, f.examEnd)}, após as notas` : 'após a banca, quando as notas forem lançadas', ok: !!f.examEnd }
    ];
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nova')
      this.load(id);
  }

  /** Atualiza um campo do formulário. */
  set<K extends keyof SaveBanca>(key: K, value: SaveBanca[K]) {
    this.form.update(f => ({ ...f, [key]: value === '' ? null : value }));
  }

  setInscriptions(range: DateRange) {
    this.form.update(f => ({ ...f, inscriptionStart: range.start, inscriptionEnd: range.end }));
  }

  setExam(range: DateRange) {
    this.form.update(f => ({ ...f, examStart: range.start, examEnd: range.end }));
  }

  chooseType(option: typeof TYPE_OPTIONS[number]) {
    const f = this.form();
    const isDefaultTitle = !f.title || TYPE_OPTIONS.some(o => o.title === f.title);
    this.form.update(v => ({ ...v, type: option.type, title: isDefaultTitle && option.title ? option.title : v.title }));
  }

  addCriterion() {
    const value = this.newCriterion.trim();
    if (!value || this.form().criteria.includes(value)) return;
    this.set('criteria', [...this.form().criteria, value]);
    this.newCriterion = '';
  }

  removeCriterion(c: string) {
    this.set('criteria', this.form().criteria.filter(x => x !== c));
  }

  changeGraders(delta: number) {
    this.set('gradersCount', Math.min(10, Math.max(1, this.form().gradersCount + delta)));
  }

  goTo(n: number) {
    // Não pula etapa: para ir à etapa n, as anteriores precisam estar preenchidas
    const pending = this.isCanceled() ? undefined : [1, 2].find(k => k < n && this.missingIn(k).length);
    if (pending) {
      this.showErrors.set(true);
      this.step.set(pending);
      this.notification.MessagePopup('warning', 'Faltam informações',
        `Para seguir, complete a etapa ${pending} (${STEPS[pending - 1].label}): ${this.missingIn(pending).join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.step.set(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async saveAndContinue() {
    if (this.missingIn(this.step()).length) {
      this.goTo(this.step() + 1);
      return;
    }
    if (await this.save())
      this.goTo(Math.min(5, this.step() + 1));
  }

  async saveDraft() {
    if (await this.save())
      this.notification.smallMessagePopup('success', 'Rascunho salvo!');
  }

  async activate() {
    if (!(await this.save())) return;

    const missing = this.saved()?.missingForActivation ?? [];
    if (missing.length) {
      this.notification.MessagePopup('warning', 'Ainda não dá para ativar', 'Falta: ' + missing.join('; ') + '.');
      return;
    }

    const ok = await this.notification.confirm('Ativar banca?',
      'A banca vai aparecer no site e virar notícia. A fase passa a seguir as datas.', 'Ativar banca');
    if (!ok) return;

    this.isSaving.set(true);
    try {
      const res = await firstValueFrom(this._bancaApi.Activate(this.form().id!));
      this.apply(res.data);
      this.notification.smallMessagePopup('success', 'Banca ativada e notícia publicada!', () => this.router.navigate(['/gerenciar-bancas']));
    } catch (error: any) {
      this.notification.MessagePopup('warning', 'Ainda não dá para ativar', error?.error?.message ?? 'Não foi possível ativar.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async uploadEdital(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!(await this.save())) return;

    this.isSaving.set(true);
    try {
      await firstValueFrom(this._bancaApi.UploadEdital(this.form().id!, file));
      await this.load(this.form().id!, false);
      this.notification.smallMessagePopup('success', 'Edital enviado!');
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível enviar o edital.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!IMAGE_RULES.types.includes(file.type)) {
      this.notification.MessagePopup('warning', 'Formato não aceito', 'Envie a arte em JPG, PNG ou WebP.');
      return;
    }
    if (file.size > IMAGE_RULES.maxMb * 1024 * 1024) {
      this.notification.MessagePopup('warning', 'Imagem muito grande', `A arte deve ter no máximo ${IMAGE_RULES.maxMb} MB.`);
      return;
    }

    if (!(await this.save())) return;

    this.isSaving.set(true);
    try {
      await firstValueFrom(this._bancaApi.UploadImage(this.form().id!, file));
      await this.load(this.form().id!, false);
      this.notification.smallMessagePopup('success', 'Arte enviada!');
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível enviar a arte.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeImage() {
    const ok = await this.notification.confirm('Remover arte?', 'A imagem sai da página da banca.', 'Remover', true);
    if (!ok) return;

    this.isSaving.set(true);
    try {
      await firstValueFrom(this._bancaApi.RemoveImage(this.form().id!));
      await this.load(this.form().id!, false);
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível remover a arte.');
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Lê o tamanho real da arte quando a prévia carrega. */
  onPreviewLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.imageSize.set({ width: img.naturalWidth, height: img.naturalHeight });
  }

  private async loadPreview(banca: Banca) {
    const old = this.imagePreview();
    if (old) URL.revokeObjectURL(old);
    this.imagePreview.set(null);
    this.imageSize.set(null);
    if (!banca.hasImage) return;
    try {
      const blob = await firstValueFrom(this._bancaApi.GetImageBlob(banca.id));
      this.imagePreview.set(URL.createObjectURL(blob));
    } catch {
      // Sem prévia: a arte continua salva
    }
  }

  editalUrl() {
    return this.form().id ? this._bancaApi.EditalUrl(this.form().id!) : '';
  }

  private async save(): Promise<boolean> {
    if (this.isCanceled()) return false;

    if (!this.form().title?.trim()) {
      this.notification.MessagePopup('warning', 'Atenção', 'Informe o título da banca.');
      this.goTo(1);
      return false;
    }

    this.isSaving.set(true);
    try {
      const wasNew = this.isNew();
      const res = await firstValueFrom(this._bancaApi.SaveBanca(this.form()));
      this.apply(res.data);
      if (wasNew)
        this.router.navigate(['/gerenciar-bancas', res.data.id], { replaceUrl: true });
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar a banca', error, this.form());
      this.notification.MessagePopup('error', 'Não foi possível salvar', this.describeError(error));
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Mensagem do erro com o detalhe que a API devolveu (validação, permissão, servidor). */
  private describeError(error: any): string {
    const body = error?.error;
    if (error?.status === 0) return 'Não foi possível falar com a API. Ela está rodando?';
    if (error?.status === 401) return 'Sua sessão expirou. Entre de novo.';
    if (body?.errors) {
      // Validação automática do ASP.NET: { errors: { Campo: [mensagens] } }
      const details = Object.entries(body.errors).map(([field, msgs]) => `${field}: ${(msgs as string[]).join(' ')}`).join(' | ');
      return `Dados inválidos (${error.status}): ${details}`;
    }
    if (body?.message && body?.error && body.error !== body.message) return `${body.message} (${body.error})`;
    return body?.message ?? `Erro ${error?.status ?? ''}: ${error?.message ?? 'tente novamente.'}`;
  }

  private async load(id: string, openPending = true) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this._bancaApi.GetBanca(id));
      this.apply(res.data);
      // Ao abrir uma banca, continua da primeira etapa que falta preencher
      if (openPending)
        this.step.set([1, 2, 3, 4].find(n => !this.stepDone(n)) ?? 5);
    } catch {
      this.notification.MessagePopup('error', 'Erro', 'Banca não encontrada.');
      this.router.navigate(['/gerenciar-bancas']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private apply(banca: Banca) {
    if (banca.imageVersion !== this.saved()?.imageVersion || !banca.hasImage) this.loadPreview(banca);
    this.saved.set(banca);
    this.form.set({
      id: banca.id, entityId: banca.entityId, type: banca.type, customTypeName: banca.customTypeName, title: banca.title,
      editalNumber: banca.editalNumber, summary: banca.summary, forWhom: banca.forWhom, howEvaluated: banca.howEvaluated,
      whatToBring: banca.whatToBring, criteria: [...banca.criteria], inscriptionStart: banca.inscriptionStart,
      inscriptionEnd: banca.inscriptionEnd, examStart: banca.examStart, examEnd: banca.examEnd, locationName: banca.locationName,
      locationAddress: banca.locationAddress, locationNumber: banca.locationNumber, locationRoom: banca.locationRoom, locationNotes: banca.locationNotes, gradersCount: banca.gradersCount, videoUrl: banca.videoUrl,
      videoHasSubtitles: banca.videoHasSubtitles, imageAlt: banca.imageAlt, newsShowsVideo: banca.newsShowsVideo, highlight: banca.highlight, notifyRegion: banca.notifyRegion,
      notifyExpiringCertificates: banca.notifyExpiringCertificates
    });
  }

  private emptyForm(): SaveBanca {
    return {
      entityId: this._userService.selectedEntity()?.entityId ?? '',
      type: BancaType.TradutorInterprete,
      title: TYPE_OPTIONS[0].title,
      criteria: ['Fluência', 'Vocabulário', 'Interpretação Libras → Português', 'Interpretação Português → Libras'],
      gradersCount: 3,
      videoHasSubtitles: false,
      newsShowsVideo: false,
      highlight: true,
      notifyRegion: true,
      notifyExpiringCertificates: false
    };
  }
}
