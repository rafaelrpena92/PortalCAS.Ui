import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BancaPhase, BancaSummary } from '../../../Models/BancaAggregate/banca.model';
import { dayRangeOf, formatShortDate, monthOf, PHASES, yearOf } from '../../../Utils/banca.util';

/**
 * Cartão de banca usado nas listas públicas (Início e Bancas).
 */
@Component({
  selector: 'app-banca-card',
  imports: [RouterLink, MatIconModule],
  template: `
    <a class="banca-card" [routerLink]="['/bancas', banca.id]" [class.past]="isPast()">
      <span class="date">
        <span class="day">{{ day() }}</span>
        <span class="month">{{ month() }}</span>
      </span>
      <span class="info">
        <span class="phase" [style.background]="phase().bg" [style.color]="phase().fg">{{ phase().label }}</span>
        <span class="title">{{ banca.title }}</span>
        <span class="meta">{{ meta() }}</span>
      </span>
      <mat-icon class="go">chevron_right</mat-icon>
    </a>
  `,
  styleUrl: './banca-card.component.css'
})
export class BancaCardComponent {
  @Input({ required: true }) banca!: BancaSummary;

  day() { return dayRangeOf(this.banca.examStart, this.banca.examEnd); }

  /** Mês, e o ano quando não é o ano atual. */
  month() {
    const year = yearOf(this.banca.examStart);
    const month = monthOf(this.banca.examStart);
    return year && year !== new Date().getFullYear() ? `${month} ${String(year).slice(2)}` : month;
  }

  phase() { return PHASES[this.banca.phase]; }

  isPast() { return this.banca.phase === BancaPhase.AguardandoResultado || this.banca.phase === BancaPhase.Cancelada; }

  meta() {
    const b = this.banca;
    switch (b.phase) {
      case BancaPhase.InscricoesEmBreve: return `Inscrições a partir de ${formatShortDate(b.inscriptionStart)}`;
      case BancaPhase.InscricoesAbertas: return `Inscrições até ${formatShortDate(b.inscriptionEnd)}${b.locationName ? ' · ' + b.locationName : ''}`;
      case BancaPhase.Cancelada: return b.cancelReason ? `Cancelada · ${b.cancelReason}` : 'Cancelada';
      default: return [b.editalNumber ? `Edital ${b.editalNumber}` : '', b.locationName ?? ''].filter(x => x).join(' · ');
    }
  }
}
