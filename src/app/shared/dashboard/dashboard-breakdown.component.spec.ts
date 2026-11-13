import { TestBed } from '@angular/core/testing';
import { DashboardBreakdownComponent } from './dashboard-breakdown.component';

describe('DashboardBreakdownComponent', () => {
  it('uses a shared zero baseline for independent counters, not percentages of an invented total', () => {
    const fixture=TestBed.createComponent(DashboardBreakdownComponent);
    fixture.componentRef.setInput('title','Circulación');
    fixture.componentRef.setInput('items',[{label:'Prestados',value:8},{label:'Renovaciones',value:2}]);
    fixture.detectChanges();
    expect(fixture.componentInstance.width(2)).toBe(25);
    expect(fixture.nativeElement.querySelector('.stack')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('dd')[1].textContent).toBe('2');
    expect(fixture.nativeElement.textContent).toContain('Escala desde 0 hasta 8');
  });
  it('renders exact parts of a whole and does not draw a fake segment for zero', () => {
    const fixture=TestBed.createComponent(DashboardBreakdownComponent);
    fixture.componentRef.setInput('stacked',true);
    fixture.componentRef.setInput('items',[{label:'Activas',value:4},{label:'Inactivas',value:1}]);
    fixture.detectChanges();
    expect(fixture.componentInstance.share(4)).toBe(80);
    expect(fixture.nativeElement.querySelector('.stack span').style.width).toBe('80%');
    fixture.componentRef.setInput('items',[{label:'Activas',value:0},{label:'Inactivas',value:0}]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stack')).toBeNull();
    expect(fixture.componentInstance.width(0)).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No hay registros');
  });
});
