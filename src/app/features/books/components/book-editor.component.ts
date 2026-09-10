import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { BookManagement, BookWriteRequest } from '../data-access/staff-books.models';

const https: ValidatorFn = control => {
  if (!control.value) return null;
  try { return new URL(control.value).protocol === 'https:' ? null : { https: true }; } catch { return { https: true }; }
};
const integer: ValidatorFn = control => control.value === null || Number.isInteger(control.value) ? null : { integer: true };
const trimmed = (min: number, max: number): ValidatorFn => control => {
  const length = String(control.value ?? '').trim().length;
  return length >= min && length <= max ? null : { length: true };
};
const list = (min: number, max: number): ValidatorFn => control => {
  const values = String(control.value ?? '').trim() ? String(control.value).split(',').map(v => v.trim()) : [];
  return values.length >= min && values.length <= max && values.every(Boolean) && new Set(values.map(v => v.toLowerCase())).size === values.length ? null : { list: true };
};

@Component({
  selector: 'app-book-editor', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './book-editor.component.html', styleUrl: './staff-books.scss'
})
export class BookEditorComponent implements OnChanges, AfterViewInit {
  @Input() record: BookManagement | null = null;
  @Input() saving = false;
  @Input() error = '';
  @Input() conflict = false;
  @Output() readonly save = new EventEmitter<BookWriteRequest>();
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly reload = new EventEmitter<void>();
  submitted = false;
  private readonly fb = inject(FormBuilder);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', [trimmed(1, 200)]), subtitle: this.fb.nonNullable.control('', Validators.maxLength(200)),
    authors: this.fb.nonNullable.control('', list(1, 10)), isbn: this.fb.nonNullable.control('', control => {
      const value = control.value.replace(/[\s-]/g, ''); return !value || value.length === 10 || value.length === 13 ? null : { isbn: true };
    }),
    description: this.fb.nonNullable.control('', trimmed(20, 5000)), publisher: this.fb.nonNullable.control('', Validators.maxLength(160)),
    publishedDate: this.fb.nonNullable.control(''), language: this.fb.nonNullable.control('es', trimmed(1, 35)),
    pageCount: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(100000), integer]),
    genres: this.fb.nonNullable.control('', list(1, 8)), tags: this.fb.nonNullable.control('', list(0, 20)),
    coverUrl: this.fb.nonNullable.control('', https), mediaType: this.fb.nonNullable.control<'physical' | 'digital'>('physical'),
    digitalResourceUrl: this.fb.nonNullable.control(''), totalCopies: this.fb.control<number | null>(0)
  });
  constructor() { this.form.controls.mediaType.valueChanges.subscribe(() => this.mediaValidators()); this.mediaValidators(); }
  ngAfterViewInit() { this.element.nativeElement.querySelector<HTMLElement>('#editor-title')?.focus(); }
  ngOnChanges(changes: { [key: string]: unknown }) {
    if (!changes['record']) return;
    const book = this.record?.book;
    this.form.reset({ title: book?.title ?? '', subtitle: book?.subtitle ?? '', authors: book?.authors.join(', ') ?? '', isbn: book?.isbn ?? '',
      description: book?.description ?? '', publisher: book?.publisher ?? '', publishedDate: book?.publishedDate?.slice(0, 10) ?? '', language: book?.language ?? 'es',
      pageCount: book?.pageCount ?? null, genres: book?.genres.join(', ') ?? '', tags: book?.tags.join(', ') ?? '', coverUrl: book?.coverUrl ?? '',
      mediaType: book?.mediaType ?? 'physical', digitalResourceUrl: this.record?.digitalResourceUrl ?? '', totalCopies: book?.totalCopies ?? 0 });
    this.submitted = false; this.mediaValidators();
  }
  private mediaValidators() {
    const digital = this.form.controls.mediaType.value === 'digital';
    this.form.controls.digitalResourceUrl.setValidators(digital ? [Validators.required, https] : []);
    this.form.controls.totalCopies.setValidators(digital ? [] : [Validators.required, Validators.min(0), integer]);
    this.form.controls.digitalResourceUrl.updateValueAndValidity(); this.form.controls.totalCopies.updateValueAndValidity();
  }
  invalid(name: keyof typeof this.form.controls) { const c: AbstractControl = this.form.controls[name]; return c.invalid && (c.touched || this.submitted); }
  submit() {
    if (this.saving) return;
    this.submitted = true; this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const optional = (text: string) => text.trim() || null;
    const values = (text: string) => text.trim() ? text.split(',').map(item => item.trim()) : [];
    this.save.emit({ ...value, title: value.title.trim(), subtitle: optional(value.subtitle), authors: values(value.authors), isbn: optional(value.isbn),
      description: value.description.trim(), publisher: optional(value.publisher), publishedDate: optional(value.publishedDate), language: value.language.trim(),
      genres: values(value.genres), tags: values(value.tags), coverUrl: optional(value.coverUrl),
      totalCopies: value.mediaType === 'physical' ? value.totalCopies : null,
      digitalResourceUrl: value.mediaType === 'digital' ? optional(value.digitalResourceUrl) : null });
  }
}
