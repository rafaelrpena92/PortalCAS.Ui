import { Component, computed, EventEmitter, inject, Input, Output } from '@angular/core';
import { City } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { DomainUserService } from '../../../Services/domain-user.service';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { ComboboxOption } from '../combobox/combobox.component';
import { casColor } from '../../../Utils/cas-colors.util';

/**
 * Campo de cidade com busca nos 399 municípios do Paraná. Mostra o CAS de cada cidade.
 */
@Component({
  selector: 'app-city-picker',
  imports: [AutocompleteComponent],
  template: `
    <app-autocomplete [inputId]="inputId" [placeholder]="placeholder" ariaLabel="Cidade"
      [options]="options()" [value]="cityId != null ? '' + cityId : null"
      emptyText="Nenhuma cidade do Paraná com esse nome" (valueChange)="pick($event)"></app-autocomplete>
  `
})
export class CityPickerComponent {
  private _userService = inject(DomainUserService);

  @Input() cityId: number | null | undefined = null;
  @Input() placeholder = 'Digite sua cidade';
  @Input() inputId = 'cidade';
  @Output() cityChange = new EventEmitter<City | null>();

  options = computed<ComboboxOption[]>(() => this._userService.cities().map(c => ({
    value: '' + c.id,
    label: c.name,
    color: c.entityName ? casColor(c.entityName) : '#d4d8de',
    hint: c.entityName ?? 'sem CAS definido'
  })));

  pick(option: ComboboxOption | null) {
    const city = option ? this._userService.cities().find(c => '' + c.id === option.value) ?? null : null;
    this.cityChange.emit(city);
  }
}
