import { Component, computed, ElementRef, EventEmitter, Input, OnChanges, Output, signal, ViewChild } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export interface DateRange {
  start: string | null;
  end: string | null;
}

interface Day {
  iso: string;
  day: number;
  outside: boolean;
  today: boolean;
  start: boolean;
  end: boolean;
  inRange: boolean;
  disabled: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso?: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const format = (iso?: string | null) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Período de datas: primeiro clique escolhe o início, o segundo o fim.
 * Também aceita digitar "dd/mm/aaaa – dd/mm/aaaa". Valores no formato da API ("AAAA-MM-DD").
 */
@Component({
  selector: 'app-date-range-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.css'
})
export class DateRangePickerComponent implements OnChanges {
  @Input() start: string | null | undefined = null;
  @Input() end: string | null | undefined = null;
  /** Dias antes deste ficam desabilitados ("AAAA-MM-DD"). */
  @Input() min: string | null | undefined = null;
  @Input() inputId = '';
  @Input() ariaLabel = '';
  @Input() disabled = false;
  @Input() invalid = false;
  @Output() rangeChange = new EventEmitter<DateRange>();

  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  weekdays = WEEKDAYS;
  text = signal('');
  open = signal(false);
  view = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  rangeStart = signal<string | null>(null);
  rangeEnd = signal<string | null>(null);
  hover = signal<string | null>(null);

  readonly id = `drp-${Math.random().toString(36).slice(2, 9)}`;

  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
  ];

  title = computed(() => `${MONTHS[this.view().getMonth()]} de ${this.view().getFullYear()}`);

  /** Quantos dias o período tem (para o rodapé). */
  length = computed(() => {
    const s = fromIso(this.rangeStart()), e = fromIso(this.rangeEnd());
    return s && e ? Math.round((e.getTime() - s.getTime()) / 86400000) + 1 : 0;
  });

  hint = computed(() => {
    if (this.rangeStart() && !this.rangeEnd()) return 'Agora escolha o último dia';
    if (this.length() === 1) return '1 dia';
    if (this.length() > 1) return `${this.length()} dias`;
    return 'Escolha o primeiro dia';
  });

  days = computed<Day[]>(() => {
    const first = this.view();
    const begin = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const today = toIso(new Date());
    const s = this.rangeStart();
    // Enquanto escolhe o fim, o período acompanha o mouse
    const e = this.rangeEnd() ?? (s && this.hover() && this.hover()! >= s ? this.hover() : null);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate() + i);
      const iso = toIso(date);
      return {
        iso,
        day: date.getDate(),
        outside: date.getMonth() !== first.getMonth(),
        today: iso === today,
        start: iso === s,
        end: iso === e,
        inRange: !!s && !!e && iso > s && iso < e,
        disabled: !!this.min && iso < this.min
      };
    });
  });

  ngOnChanges() {
    this.rangeStart.set(this.start ? this.start.slice(0, 10) : null);
    this.rangeEnd.set(this.end ? this.end.slice(0, 10) : null);
    this.text.set(this.display());
    const date = fromIso(this.rangeStart());
    if (date)
      this.view.set(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  toggle() {
    if (this.disabled) return;
    if (this.open()) { this.close(); return; }
    const date = fromIso(this.rangeStart()) ?? fromIso(this.min) ?? new Date();
    this.view.set(new Date(date.getFullYear(), date.getMonth(), 1));
    this.open.set(true);
  }

  close() {
    // Fechou no meio da escolha: período de um dia só
    if (this.rangeStart() && !this.rangeEnd())
      this.commit(this.rangeStart(), this.rangeStart());
    this.open.set(false);
    this.hover.set(null);
  }

  moveMonth(delta: number) {
    const v = this.view();
    this.view.set(new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  pick(day: Day) {
    if (day.disabled) return;
    const s = this.rangeStart(), e = this.rangeEnd();

    if (!s || e || day.iso < s) {
      // Começa um novo período
      this.rangeStart.set(day.iso);
      this.rangeEnd.set(null);
      this.text.set(format(day.iso) + ' – …');
      return;
    }

    this.commit(s, day.iso);
    this.open.set(false);
    this.hover.set(null);
    this.input?.nativeElement.focus();
  }

  clear() {
    this.commit(null, null);
    this.open.set(false);
  }

  /** Máscara "dd/mm/aaaa – dd/mm/aaaa" enquanto digita. */
  onType(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 16);
    const part = (x: string) => [x.slice(0, 2), x.slice(2, 4), x.slice(4, 8)].filter(p => p).join('/');
    const masked = d.length > 8 ? `${part(d.slice(0, 8))} – ${part(d.slice(8))}` : part(d);
    this.text.set(masked);
    if (this.input) this.input.nativeElement.value = masked;

    const parse = (x: string) => {
      const iso = `${x.slice(4, 8)}-${x.slice(2, 4)}-${x.slice(0, 2)}`;
      const date = fromIso(iso);
      return date && toIso(date) === iso ? iso : null;
    };

    if (d.length === 16) {
      const s = parse(d.slice(0, 8)), e = parse(d.slice(8));
      if (s && e && e >= s) this.commit(s, e);
    } else if (d.length === 0) {
      this.commit(null, null);
    }
  }

  onBlur() {
    if (!this.open())
      this.text.set(this.display());
  }

  onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
    if (event.key === 'ArrowDown' && !this.open()) {
      event.preventDefault();
      this.toggle();
    }
  }

  private commit(start: string | null, end: string | null) {
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
    this.text.set(this.display());
    if (start !== (this.start?.slice(0, 10) ?? null) || end !== (this.end?.slice(0, 10) ?? null))
      this.rangeChange.emit({ start, end });
  }

  private display() {
    const s = this.rangeStart(), e = this.rangeEnd();
    if (!s) return '';
    return !e || e === s ? format(s) : `${format(s)} – ${format(e)}`;
  }
}
