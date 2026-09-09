import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

/** Publication is a calendar date, not an event in the reader's timezone. */
@Pipe({ name: 'publicationDate', standalone: true })
export class PublicationDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: string): string {
    // Preserve the API's calendar portion, including dates before standard timezones.
    return formatDate(value.slice(0, 10), 'longDate', this.locale);
  }
}
