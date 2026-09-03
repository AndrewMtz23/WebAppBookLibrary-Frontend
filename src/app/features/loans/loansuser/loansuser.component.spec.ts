import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoansUserComponent } from './loansuser.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('LoansUserComponent', () => {
  let component: LoansUserComponent;
  let fixture: ComponentFixture<LoansUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [LoansUserComponent],
    imports: [MatTableModule,
        MatProgressBarModule,
        MatIconModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(LoansUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
