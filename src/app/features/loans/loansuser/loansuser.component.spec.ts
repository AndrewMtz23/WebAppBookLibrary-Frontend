import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoansUserComponent } from './loansuser.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

describe('LoansUserComponent', () => {
  let component: LoansUserComponent;
  let fixture: ComponentFixture<LoansUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoansUserComponent],
      imports: [
        HttpClientTestingModule,
        MatTableModule,
        MatProgressBarModule,
        MatIconModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoansUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
