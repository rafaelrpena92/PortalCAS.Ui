import { Component, computed, ElementRef, EventEmitter, Input, OnChanges, Output, signal, ViewChild } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Day {
  iso: string;
  day: number;
  outside: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso?: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

/**
 * Campo de data do Portal CAS: digita dd/mm/aaaa ou escolhe no calendário.
 * Valor no formato da API: "AAAA-MM-DD".
 */
@Component({
  selector: 'app-date-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css'
})
export class DatePickerComponent implements OnChanges {
  @Input() value: string | null | undefined = null;
  /** Dias antes deste ficam desabilitados ("AAAA-MM-DD"). */
  @Input() min: string | null | undefined = null;
  @Input() inputId = '';
  @Input() ariaLabel = '';
  @Input() disabled = false;
  /** Borda vermelha quando o campo é obrigatório e está vazio. */
  @Input() invalid = false;
  @Output() valueChange = new EventEmitter<string | null>();

  @ViewChild('field') field?: ElementRef<HTMLElement>;
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  weekdays = WEEKDAYS;
  text = signal('');
  open = signal(false);
  /** Primeiro dia do mês mostrado. */
  view = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selected = signal<string | null>(null);

  readonly id = `dtp-${Math.random().toString(36).slice(2, 9)}`;

  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
  ];

  title = computed(() => `${MONTHS[this.view().getMonth()]} de ${this.view().getFullYear()}`);

  /** Semanas do mês (sempre 6 linhas para o calendário não pular). */
  days = computed<Day[]>(() => {
    const first = this.view();
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const today = toIso(new Date());
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = toIso(date);
      return {
        iso,
        day: date.getDate(),
        outside: date.getMonth() !== first.getMonth(),
        today: iso === today,
        selected: iso === this.selected(),
        disabled: !!this.min && iso < this.min
      };
    });
  });

  ngOnChanges() {
    const iso = this.value ? this.value.slice(0, 10) : null;
    this.selected.set(iso);
    this.text.set(this.format(iso));
    const date = fromIso(iso);
    if (date)
      this.view.set(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  toggle() {
    if (this.disabled) return;
    if (this.open()) { this.open.set(false); return; }
    const date = fromIso(this.selected()) ?? fromIso(this.min) ?? new Date();
    this.view.set(new Date(date.getFullYear(), date.getMonth(), 1));
    this.open.set(true);
  }

  moveMonth(delta: number) {
    const v = this.view();
    this.view.set(new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  pick(day: Day) {
    if (day.disabled) return;
    this.commit(day.iso);
    this.open.set(false);
    this.input?.nativeElement.focus();
  }

  today() {
    this.commit(toIso(new Date()));
    this.open.set(false);
  }

  clear() {
    this.commit(null);
    this.open.set(false);
  }

  /** Máscara dd/mm/aaaa enquanto digita. */
  onType(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const masked = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(p => p).join('/');
    this.text.set(masked);
    if (this.input) this.input.nativeElement.value = masked;

    if (digits.length === 8) {
      const iso = `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
      const date = fromIso(iso);
      if (date && toIso(date) === iso) {
        this.commit(iso);
        this.view.set(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } else if (digits.length === 0) {
      this.commit(null);
    }
  }

  /** Ao sair do campo, volta para a última data válida. */
  onBlur() {
    this.text.set(this.format(this.selected()));
  }

  onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.open.set(false);
    }
    if (event.key === 'ArrowDown' && !this.open()) {
      event.preventDefault();
      this.toggle();
    }
  }

  private commit(iso: string | null) {
    if (iso === this.selected()) {
      this.text.set(this.format(iso));
      return;
    }
    this.selected.set(iso);
    this.text.set(this.format(iso));
    this.valueChange.emit(iso);
  }

  private format(iso: string | null) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
