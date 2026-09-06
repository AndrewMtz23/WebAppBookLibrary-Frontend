import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { BookFacet } from '../../../reader/models/reader.models';
import { CatalogQuery } from '../../models/catalog-query';

export interface FilterChip { key: keyof CatalogQuery; label: string; }

@Component({
  selector: 'app-catalog-filters', standalone: true,
  imports: [FormsModule, MatButtonModule, MatChipsModule],
  templateUrl: './catalog-filters.component.html', styleUrl: './catalog-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogFiltersComponent {
  @Input({ required: true }) query!: CatalogQuery;
  @Input() facets: readonly BookFacet[] = [];
  @Output() readonly queryChanged = new EventEmitter<Partial<CatalogQuery>>();
  @Output() readonly clearRequested = new EventEmitter<void>();

  get availabilityDisabled(): boolean { return this.query.mediaType === 'digital'; }

  get activeChips(): readonly FilterChip[] {
    const chips: FilterChip[] = [];
    if (this.query.genre) chips.push({ key: 'genre', label: this.query.genre });
    if (this.query.mediaType) chips.push({ key: 'mediaType', label: this.query.mediaType === 'digital' ? 'Digital' : 'Físico' });
    if (this.query.language) chips.push({ key: 'language', label: this.query.language.toUpperCase() });
    if (this.query.available !== null) chips.push({ key: 'available', label: this.query.available ? 'Disponible' : 'No disponible' });
    return chips;
  }

  set<K extends keyof CatalogQuery>(key: K, raw: string): void {
    let value: CatalogQuery[K] | null = (raw || null) as CatalogQuery[K] | null;
    if (key === 'available') value = (raw === '' ? null : raw === 'true') as CatalogQuery[K];
    const patch: Partial<CatalogQuery> = { [key]: value };
    if (key === 'mediaType' && value === 'digital') patch.available = null;
    this.queryChanged.emit(patch);
  }

  remove(chip: FilterChip): void { this.queryChanged.emit({ [chip.key]: null }); }

  selectSort(value: string): void {
    const [sort, direction] = value.split(':') as [CatalogQuery['sort'], CatalogQuery['direction']];
    this.queryChanged.emit({ sort, direction });
  }
}
