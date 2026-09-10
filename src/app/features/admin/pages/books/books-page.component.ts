import { Component, inject } from '@angular/core';
import { StaffBooksFacade } from '../../../books/data-access/staff-books.facade';
import { StaffBookListComponent } from '../../../books/components/staff-book-list.component';
import { BookEditorComponent } from '../../../books/components/book-editor.component';

@Component({
  selector: 'app-admin-books-page', standalone: true,
  imports: [StaffBookListComponent, BookEditorComponent], providers: [StaffBooksFacade],
  templateUrl: './books-page.component.html',
  styleUrl: '../../../books/components/staff-books.scss'
})
export class BooksPageComponent { readonly catalog = inject(StaffBooksFacade); }
