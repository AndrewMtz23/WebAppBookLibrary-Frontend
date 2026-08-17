// 📁 logs-list.component.ts - VERSIÓN CORREGIDA
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { LogEntry } from 'src/app/shared/models/log-entry.model';
import { LogService } from 'src/app/core/services/log.service';

@Component({
  selector: 'app-logs-list',
  templateUrl: './logs-list.component.html',
  styleUrls: ['./logs-list.component.css']
})
export class LogsListComponent implements OnInit {
  // ✅ Usar MatTableDataSource para funcionalidades avanzadas
  dataSource = new MatTableDataSource<LogEntry>([]);
  displayedColumns: string[] = ['timestamp', 'level', 'message', 'username', 'actions'];
  
  loading = true;
  error = '';
  
  // ✅ Filtros
  selectedLevel = '';
  searchText = '';
  selectedDateRange = '';
  
  // ✅ ViewChild para paginación y ordenamiento
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  ngAfterViewInit(): void {
    // ✅ Configurar paginación y ordenamiento
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // ✅ CORRIGIENDO EL ERROR DE FILTRO - siempre retornar boolean
    this.dataSource.filterPredicate = (data: LogEntry, filter: string): boolean => {
      if (!filter) return true; // ✅ Si no hay filtro, mostrar todo
      
      try {
        const filterObj = JSON.parse(filter);
        
        // Filtro por nivel
        const levelMatch = !filterObj.level || 
          (data.level?.toLowerCase().includes(filterObj.level.toLowerCase()) ?? false);
        
        // Filtro por texto en mensaje
        const textMatch = !filterObj.text || 
          (data.message?.toLowerCase().includes(filterObj.text.toLowerCase()) ?? false) ||
          (data.username?.toLowerCase().includes(filterObj.text.toLowerCase()) ?? false);
        
        return levelMatch && textMatch;
      } catch (e) {
        // ✅ Si hay error parseando el JSON, mostrar todo
        return true;
      }
    };
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';
    
    this.logService.getRecent().subscribe({
      next: (res: any) => {
        const logs = res.data ?? res;
        this.dataSource.data = logs;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los logs del sistema.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // ✅ Método para aplicar filtros
  applyFilters(): void {
    const filterValue = {
      level: this.selectedLevel,
      text: this.searchText
    };
    
    this.dataSource.filter = JSON.stringify(filterValue);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // ✅ Limpiar filtros
  clearFilters(): void {
    this.selectedLevel = '';
    this.searchText = '';
    this.dataSource.filter = '';
  }

  // ✅ Obtener clase CSS para el nivel de log
  getLevelClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'error': return 'level-error';
      case 'warn': case 'warning': return 'level-warning';
      case 'info': return 'level-info';
      case 'debug': return 'level-debug';
      default: return 'level-default';
    }
  }

  // ✅ Obtener icono para el nivel de log
  getLevelIcon(level: string): string {
    switch (level?.toLowerCase()) {
      case 'error': return 'error';
      case 'warn': case 'warning': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'bug_report';
      default: return 'radio_button_unchecked';
    }
  }

  // ✅ Exportar logs (opcional)
  exportLogs(): void {
    const csvContent = this.dataSource.filteredData.map(log => 
      `"${log.timestamp}","${log.level}","${log.message?.replace(/"/g, '""')}","${log.username || ''}"`
    ).join('\n');
    
    const header = 'Timestamp,Level,Message,Username\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ✅ Refrescar logs
  refreshLogs(): void {
    this.loadLogs();
  }

  // ✅ Ver detalles del log (si necesitas expandir información)
  viewLogDetails(log: LogEntry): void {
    // Implementar si necesitas mostrar más detalles en un modal
    console.log('Log details:', log);
  }
}