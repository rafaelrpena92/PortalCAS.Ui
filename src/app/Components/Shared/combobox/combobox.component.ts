import { Component, computed, ElementRef, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Bolinha colorida antes do texto (ex.: cor do CAS). */
  color?: string;
  /** Texto menor à direita. */
  hint?: string;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Lista de seleção do Portal CAS (no lugar do <select> nativo): bolinha de cor, busca
 * quando há muitas opções e navegação por teclado.
 */
@Component({
  selector: 'app-combobox',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule],
  templateUrl: './combobox.component.html',
  styleUrl: './combobox.component.css'
})
export class ComboboxComponent {
  @Input() options: ComboboxOption[] = [];
  @Input() value: string | null = null;
  @Input() placeholder = 'Selecione';
  @Input() ariaLabel = '';
  @Input() disabled = false;
  /** Mostra a busca a partir de quantas opções. */
  @Input() searchFrom = 8;
  @Input() size: 'md' | 'sm' = 'md';
  @Output() valueChange = new EventEmitter<string | null>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('trigger') trigger?: ElementRef<HTMLButtonElement>;

  open = signal(false);
  term = signal('');
  active = signal(0);
  width = signal(0);

  readonly id = `cbx-${Math.random().toString(36).slice(2, 9)}`;

  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
  ];

  selected = computed(() => this.options.find(o => o.value === (this.value ?? '')) ?? null);

  showSearch() {
    return this.options.length >= this.searchFrom;
  }

  filtered() {
    const term = normalize(this.term());
    return term ? this.options.filter(o => normalize(o.label).includes(term)) : this.options;
  }

  toggle() {
    if (this.disabled) return;
    this.open() ? this.close() : this.openPanel();
  }

  openPanel() {
    this.width.set(this.trigger?.nativeElement.offsetWidth ?? 240);
    this.term.set('');
    this.active.set(Math.max(0, this.filtered().findIndex(o => o.value === (this.value ?? ''))));
    this.open.set(true);
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  close(focusTrigger = false) {
    this.open.set(false);
    if (focusTrigger)
      this.trigger?.nativeElement.focus();
  }

  choose(option: ComboboxOption) {
    this.close(true);
    if (option.value !== (this.value ?? ''))
      this.valueChange.emit(option.value || null);
  }

  onKey(event: KeyboardEvent) {
    const list = this.filtered();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open()) { this.openPanel(); return; }
        this.active.set(Math.min(list.length - 1, this.active() + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.active.set(Math.max(0, this.active() - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.open() && list[this.active()]) this.choose(list[this.active()]);
        else this.openPanel();
        break;
      case 'Escape':
        if (this.open()) { event.preventDefault(); this.close(true); }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  onSearch(value: string) {
    this.term.set(value);
    this.active.set(0);
  }
}
