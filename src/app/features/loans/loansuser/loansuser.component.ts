// 📁 loans/loansuser/loansuser.component.ts
import { Component, OnInit } from '@angular/core';
import { LoanService } from 'src/app/core/services/loan.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-loansuser',
    templateUrl: './loansuser.component.html',
    styleUrls: ['./loansuser.component.css'],
    standalone: false
})
export class LoansUserComponent implements OnInit {
  loans: any[] = [];
  @ViewChild('confirmTpl') confirmTpl!: TemplateRef<any>;

  loading = true;
  error = '';
  
  // ✅ PROPIEDADES PARA VISTA ADMINISTRATIVA
  isAdminView = false;
  pageTitle = '';
  
  // ✅ FILTROS PARA ADMIN
  selectedStatus = '';
  selectedUser = '';
  searchText = '';
  uniqueUsers: string[] = [];

  // ✅ DATOS PARA EL MODAL
  dialogData: any = {};

  constructor(
    private loanService: LoanService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.determineViewType();
    this.loadLoans();
  }

  // ✅ DETERMINAR QUÉ VISTA MOSTRAR
  private determineViewType(): void {
    this.isAdminView = this.authService.isAdminOrLibrarian();
    
    if (this.isAdminView) {
      this.pageTitle = 'Gestión de Préstamos';
    } else {
      this.pageTitle = 'Mis Préstamos';
    }
    
  }

  // ✅ MODAL DE CONFIRMACIÓN MEJORADO
  private async confirmDialog(message: string, title = 'Confirmación', type: 'warning' | 'danger' = 'warning'): Promise<boolean> {
    // Almacenar los datos en la propiedad del componente
    this.dialogData = { 
      title, 
      message, 
      type,
      icon: type === 'danger' ? 'delete_forever' : 'help_outline',
      confirmText: type === 'danger' ? 'Eliminar' : 'Confirmar',
      confirmColor: type === 'danger' ? 'warn' : 'primary'
    };

    const ref = this.dialog.open(this.confirmTpl, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
    
    const result = await firstValueFrom(ref.afterClosed());
    return result === true;
  }

  // ✅ CARGAR PRÉSTAMOS SEGÚN EL ROL
  loadLoans(): void {
    this.loading = true;
    this.error = '';
    
    const serviceCall = this.isAdminView 
      ? this.loanService.getAll()     // Admin/Librarian: todos los préstamos
      : this.loanService.getByUser(); // User: solo sus préstamos
    
    serviceCall.subscribe({
      next: (res) => {
        this.loans = res.data;
        
        if (this.isAdminView) {
          this.updateUniqueUsers();
        }
        
        this.loading = false;
        
      },
      error: (err) => {
        console.error('❌ Error al cargar préstamos:', err);
        this.error = err.message || 'Error al cargar los préstamos.';
        this.loading = false;
        
        this.snackBar.open(this.error, 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // ✅ ACTUALIZAR LISTA DE USUARIOS ÚNICOS (para filtros admin)
  private updateUniqueUsers(): void {
    this.uniqueUsers = [...new Set(this.loans.map(loan => loan.username))].filter(Boolean);
  }

  // ✅ DEVOLVER PRÉSTAMO CON MODAL MEJORADO
  async returnLoan(loanId: string): Promise<void> {
    const confirmed = await this.confirmDialog(
      '¿Estás seguro de que deseas marcar este préstamo como devuelto?',
      'Confirmar Devolución',
      'warning'
    );

    if (!confirmed) {
      return;
    }

    this.loanService.markAsReturned(loanId).subscribe({
      next: (res) => {
        this.snackBar.open(
          res.message || 'Préstamo marcado como devuelto', 
          'Cerrar', 
          { 
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
        this.loadLoans();
      },
      error: (err) => {
        console.error('❌ Error al devolver préstamo:', err);
        this.snackBar.open(
          err.message || 'Error al devolver préstamo', 
          'Cerrar', 
          { 
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  // ✅ ELIMINAR PRÉSTAMO CON MODAL MEJORADO (solo admin)
  async deleteLoan(loanId: string): Promise<void> {
    const confirmed = await this.confirmDialog(
      '¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.',
      'Eliminar Préstamo',
      'danger'
    );

    if (!confirmed) {
      return;
    }

    this.loanService.delete(loanId).subscribe({
      next: (res) => {
        this.snackBar.open(
          res.message || 'Préstamo eliminado correctamente', 
          'Cerrar', 
          { 
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
        this.loadLoans();
      },
      error: (err) => {
        console.error('❌ Error al eliminar préstamo:', err);
        this.snackBar.open(
          err.message || 'Error al eliminar préstamo', 
          'Cerrar', 
          { 
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  // ✅ FILTROS PARA ADMIN
  applyFilters(): void {}

  clearFilters(): void {
    this.selectedStatus = '';
    this.selectedUser = '';
    this.searchText = '';
  }

  // ✅ MÉTODOS HELPER
  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Activo';
      case 'returned': return 'Devuelto';
      case 'overdue': return 'Vencido';
      default: return status || 'N/A';
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'primary';
      case 'returned': return 'accent';
      case 'overdue': return 'warn';
      default: return '';
    }
  }

  // ✅ GETTERS PARA TEMPLATE
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get canDeleteLoans(): boolean {
    return this.authService.isAdmin();
  }

  get filteredLoans(): any[] {
    let filtered = [...this.loans];

    if (this.selectedStatus) {
      filtered = filtered.filter(loan => loan.status === this.selectedStatus);
    }

    if (this.selectedUser) {
      filtered = filtered.filter(loan => loan.username === this.selectedUser);
    }

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.bookTitle?.toLowerCase().includes(search) ||
        loan.username?.toLowerCase().includes(search) ||
        loan.bookAuthor?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }
}
