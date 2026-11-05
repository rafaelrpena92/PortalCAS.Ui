import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output, signal, ViewChild } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Campo de hora do Portal CAS: digita HH:mm ou escolhe hora e minuto em duas colunas.
 * Valor "HH:mm".
 */
@Component({
  selector: 'app-time-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css'
})
export class TimePickerComponent implements OnChanges, AfterViewChecked {
  @Input() value: string | null | undefined = null;
  /** Intervalo da coluna de minutos. */
  @Input() minuteStep = 5;
  @Input() inputId = '';
  @Input() ariaLabel = '';
  @Input() disabled = false;
  /** Borda vermelha quando o campo é obrigatório e está vazio. */
  @Input() invalid = false;
  @Output() valueChange = new EventEmitter<string | null>();

  @ViewChild('input') input?: ElementRef<HTMLInputElement>;
  @ViewChild('hoursCol') hoursCol?: ElementRef<HTMLElement>;
  @ViewChild('minutesCol') minutesCol?: ElementRef<HTMLElement>;

  text = signal('');
  open = signal(false);
  hour = signal<number | null>(null);
  minute = signal<number | null>(null);

  hours = Array.from({ length: 24 }, (_, i) => i);
  pad = pad;

  readonly id = `tmp-${Math.random().toString(36).slice(2, 9)}`;
  private scrollPending = false;

  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
  ];

  minutes() {
    return Array.from({ length: Math.ceil(60 / this.minuteStep) }, (_, i) => i * this.minuteStep);
  }

  ngOnChanges() {
    const [h, m] = (this.value ?? '').split(':').map(Number);
    const valid = this.value && !isNaN(h) && !isNaN(m);
    this.hour.set(valid ? h : null);
    this.minute.set(valid ? m : null);
    this.text.set(valid ? `${pad(h)}:${pad(m)}` : '');
  }

  /** Ao abrir, rola as colunas até a hora escolhida. */
  ngAfterViewChecked() {
    if (!this.scrollPending) return;
    this.scrollPending = false;
    for (const col of [this.hoursCol, this.minutesCol])
      col?.nativeElement.querySelector('.selected')?.scrollIntoView({ block: 'center' });
  }

  toggle() {
    if (this.disabled) return;
    this.open.set(!this.open());
    this.scrollPending = this.open();
  }

  pickHour(h: number) {
    this.hour.set(h);
    this.commit(h, this.minute() ?? 0);
  }

  pickMinute(m: number) {
    this.minute.set(m);
    this.commit(this.hour() ?? 8, m);
    this.open.set(false);
    this.input?.nativeElement.focus();
  }

  clear() {
    this.hour.set(null);
    this.minute.set(null);
    this.text.set('');
    this.valueChange.emit(null);
    this.open.set(false);
  }

  /** Máscara HH:mm enquanto digita. */
  onType(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const masked = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    this.text.set(masked);
    if (this.input) this.input.nativeElement.value = masked;

    if (digits.length === 4) {
      const h = Number(digits.slice(0, 2));
      const m = Number(digits.slice(2));
      if (h < 24 && m < 60) {
        this.hour.set(h);
        this.minute.set(m);
        this.commit(h, m);
      }
    } else if (digits.length === 0) {
      this.clear();
    }
  }

  onBlur() {
    const h = this.hour(), m = this.minute();
    this.text.set(h != null && m != null ? `${pad(h)}:${pad(m)}` : '');
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

  private commit(h: number, m: number) {
    const value = `${pad(h)}:${pad(m)}`;
    this.text.set(value);
    if (value !== this.value?.slice(0, 5))
      this.valueChange.emit(value);
  }
}
