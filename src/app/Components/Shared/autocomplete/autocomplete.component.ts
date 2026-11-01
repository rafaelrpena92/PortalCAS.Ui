import { Component, computed, ElementRef, EventEmitter, Input, OnChanges, Output, signal, ViewChild } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { ComboboxOption } from '../combobox/combobox.component';

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Campo de digitar e escolher (busca em uma lista grande). Mesmo visual do app-combobox;
 * a lista abre para baixo do campo (para cima só se não couber).
 */
@Component({
  selector: 'app-autocomplete',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.css'
})
export class AutocompleteComponent implements OnChanges {
  @Input() options: ComboboxOption[] = [];
  @Input() value: string | null = null;
  @Input() placeholder = 'Digite para buscar';
  @Input() inputId = '';
  @Input() ariaLabel = '';
  /** Quantas letras antes de abrir a lista. */
  @Input() minChars = 2;
  @Input() maxResults = 12;
  @Input() emptyText = 'Nada encontrado';
  @Output() valueChange = new EventEmitter<ComboboxOption | null>();

  @ViewChild('input') input?: ElementRef<HTMLInputElement>;
  @ViewChild('field') field?: ElementRef<HTMLElement>;

  text = signal('');
  open = signal(false);
  active = signal(0);
  width = signal(0);

  readonly id = `acp-${Math.random().toString(36).slice(2, 9)}`;

  /** Abre para baixo; só abre para cima quando não cabe embaixo (campo no pé da tela). */
  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
  ];

  results = computed(() => {
    const term = normalize(this.text());
    if (term.length < this.minChars) return [];
    const starts = this.options.filter(o => normalize(o.label).startsWith(term));
    const contains = this.options.filter(o => !normalize(o.label).startsWith(term) && normalize(o.label).includes(term));
    return [...starts, ...contains].slice(0, this.maxResults);
  });

  ngOnChanges() {
    const option = this.options.find(o => o.value === this.value);
    this.text.set(option?.label ?? '');
  }

  onInput(value: string) {
    this.text.set(value);
    this.active.set(0);

    if (!value) {
      this.valueChange.emit(null);
      this.open.set(false);
      return;
    }

    this.openPanel();
  }

  openPanel() {
    this.width.set(this.field?.nativeElement.offsetWidth ?? 280);
    this.open.set(normalize(this.text()).length >= this.minChars);
  }

  close() {
    this.open.set(false);
  }

  choose(option: ComboboxOption) {
    this.text.set(option.label);
    this.close();
    this.valueChange.emit(option);
  }

  clear() {
    this.text.set('');
    this.close();
    this.valueChange.emit(null);
    this.input?.nativeElement.focus();
  }

  onKey(event: KeyboardEvent) {
    const list = this.results();

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
        if (this.open() && list[this.active()]) {
          event.preventDefault();
          this.choose(list[this.active()]);
        }
        break;
      case 'Escape':
        if (this.open()) { event.preventDefault(); this.close(); }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }
}
