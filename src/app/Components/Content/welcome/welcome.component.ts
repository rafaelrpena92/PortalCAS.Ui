import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { DomainUserService } from '../../../Services/domain-user.service';
import { BancaApiService } from '../../../Services/Api/banca.api.service';
import { City } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { BancaPhase, BancaSummary, News } from '../../../Models/BancaAggregate/banca.model';
import { CityPickerComponent } from '../../Shared/city-picker/city-picker.component';
import { BancaCardComponent } from '../../Shared/banca-card/banca-card.component';
import { embedVideoUrl } from '../../../Utils/banca.util';

/**
 * Início público: carrossel de notícias (com a arte ou o vídeo), próximas bancas do CAS selecionado, como funciona e "Localize o seu CAS".
 */
@Component({
  selector: 'app-welcome',
  imports: [RouterLink, MatIconModule, CityPickerComponent, BancaCardComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  _userService = inject(DomainUserService);
  private _bancaApi = inject(BancaApiService);

  foundCity = signal<City | null>(null);
  bancas = signal<BancaSummary[]>([]);
  news = signal<News[]>([]);
  showCasInfo = signal(false);

  // Carrossel de notícias
  index = signal(0);
  playing = signal(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  hovering = signal(false);
  current = computed(() => this.news()[this.index()] ?? null);
  private sanitizer = inject(DomSanitizer);
  private videoCache = new Map<string, SafeResourceUrl | null>();

  /** Até 3 bancas que ainda não terminaram. */
  nextBancas = computed(() => this.bancas()
    .filter(b => b.phase !== BancaPhase.AguardandoResultado && b.phase !== BancaPhase.Cancelada)
    .slice(0, 3));

  constructor() {
    effect(() => {
      const entityId = this._userService.selectedEntity()?.entityId;
      if (entityId)
        this.load(entityId);
    });

    // Passa sozinho a cada 7 s; para com o mouse/foco em cima e quando a notícia tem vídeo
    const timer = setInterval(() => {
      const n = this.current();
      if (this.playing() && !this.hovering() && this.news().length > 1 && !(n && !n.bancaImageVersion && this.videoFor(n)))
        this.goTo(this.index() + 1);
    }, 7000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  goTo(i: number) {
    const total = this.news().length;
    if (total) this.index.set((i + total) % total);
  }

  hasMedia(n: News) {
    return !!(n.bancaImageVersion && n.bancaId) || !!this.videoFor(n);
  }

  imageUrl(n: News) {
    return this._bancaApi.ImageUrl(n.bancaId!, n.bancaImageVersion);
  }

  /** Link do YouTube pronto para o iframe (guardado para não recarregar o vídeo a cada verificação). */
  videoFor(n: News): SafeResourceUrl | null {
    if (!this.videoCache.has(n.id)) {
      const url = embedVideoUrl(n.videoUrl);
      this.videoCache.set(n.id, url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null);
    }
    return this.videoCache.get(n.id)!;
  }

  async goToCas(city: City) {
    const entity = this._userService.allEntities().find(e => e.entityId === city.entityId);
    if (entity)
      await this._userService.setSelectedEntity(entity);
  }

  newsDate(news: News) {
    return news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('pt-BR') : '';
  }

  private async load(entityId: string) {
    try {
      const [bancas, news] = await Promise.all([
        firstValueFrom(this._bancaApi.GetPublicBancas(entityId)),
        firstValueFrom(this._bancaApi.GetPublicNews(entityId, 4))
      ]);
      this.bancas.set(bancas.data ?? []);
      this.news.set(news.data ?? []);
      this.index.set(0);
    } catch (err) {
      console.error(err);
      this.bancas.set([]);
      this.news.set([]);
    }
  }
}
