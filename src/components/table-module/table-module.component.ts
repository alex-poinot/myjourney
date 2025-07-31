import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from '../../models/module.interface';

@Component({
  selector: 'app-table-module',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-container">
      <div class="module-header">
        <span class="module-type">📊 Tableau</span>
        <button class="delete-btn" (click)="onDelete()">×</button>
      </div>
      <div class="module-content">
        <div class="table-actions">
          <button class="action-btn" (click)="addColumn()">+ Colonne</button>
          <button class="action-btn" (click)="addRow()">+ Ligne</button>
        </div>
        
        <div class="table-container">
          <table class="editable-table">
            <thead>
              <tr>
                <th *ngFor="let header of module.headers; let i = index">
                  <textarea 
                    [(ngModel)]="module.headers[i]" 
                    (input)="onInput($event)"
                    placeholder="En-tête"
                    rows="1"
                    (keydown)="onKeyDown($event, 'header', -1, i)"
                    [attr.data-header]="i">
                  </textarea>
                  <button class="remove-btn" (click)="removeColumn(i)" 
                          *ngIf="module.headers.length > 1">×</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of module.rows; let i = index">
                <td *ngFor="let cell of row; let j = index">
                  <textarea 
                    [(ngModel)]="module.rows[i][j]" 
                    (input)="onInput($event)"
                    placeholder="Données"
                    rows="1"
                    (keydown)="onKeyDown($event, 'cell', i, j)"
                    [attr.data-cell]="i + '-' + j">
                  </textarea>
                </td>
                <td class="row-actions">
                  <button class="remove-btn" (click)="removeRow(i)" 
                          *ngIf="module.rows.length > 1">×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 16px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      border-radius: 8px 8px 0 0;
    }
    .module-type {
      font-weight: 600;
      color: #334155;
    }
    .delete-btn {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .delete-btn:hover {
      background: #dc2626;
    }
    .module-content {
      padding: 16px;
    }
    .table-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .action-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .action-btn:hover {
      background: #1d4ed8;
    }
    .table-container {
      overflow-x: auto;
    }
    .editable-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1d5db;
    }
    .editable-table th,
    .editable-table td {
      border: 1px solid #d1d5db;
      padding: 4px;
      position: relative;
      vertical-align: top;
    }
    .editable-table th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .editable-table textarea {
      width: 100%;
      border: none;
      padding: 4px;
      background: transparent;
      font-size: 14px;
      resize: none;
      overflow: hidden;
      min-height: 20px;
      font-family: inherit;
      line-height: 1.4;
    }
    .editable-table textarea:focus {
      outline: 2px solid #64CEC7;
      outline-offset: -2px;
    }
    .remove-btn {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 2px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      font-size: 10px;
      line-height: 1;
      position: absolute;
      top: 2px;
      right: 2px;
    }
    .remove-btn:hover {
      background: #dc2626;
    }
    .row-actions {
      width: 30px;
      background: #f9fafb;
      text-align: center;
      border-left: 2px solid #e5e7eb !important;
    }
  `]
})
export class TableModuleComponent {
  @Input() module!: TableModule;
  @Output() moduleChange = new EventEmitter<TableModule>();
  @Output() deleteModule = new EventEmitter<string>();

  onUpdate(): void {
    this.moduleChange.emit(this.module);
  }

  onKeyDown(event: KeyboardEvent, type: 'header' | 'cell', rowIndex: number, colIndex: number): void {
    // Navigation avec Tab et Enter seulement
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      
      let nextElement: HTMLElement | null = null;
      
      if (type === 'header') {
        if (event.shiftKey) {
          // Aller à la colonne précédente
          if (colIndex > 0) {
            nextElement = document.querySelector(`[data-header="${colIndex - 1}"]`) as HTMLElement;
          }
        } else {
          // Aller à la colonne suivante ou première cellule
          if (colIndex < this.module.headers.length - 1) {
            nextElement = document.querySelector(`[data-header="${colIndex + 1}"]`) as HTMLElement;
          } else if (this.module.rows.length > 0) {
            nextElement = document.querySelector(`[data-cell="0-0"]`) as HTMLElement;
          }
        }
      } else {
        if (event.shiftKey) {
          // Aller à la cellule précédente
          if (colIndex > 0) {
            nextElement = document.querySelector(`[data-cell="${rowIndex}-${colIndex - 1}"]`) as HTMLElement;
          } else if (rowIndex > 0) {
            nextElement = document.querySelector(`[data-cell="${rowIndex - 1}-${this.module.headers.length - 1}"]`) as HTMLElement;
          }
        } else {
          // Aller à la cellule suivante
          if (colIndex < this.module.headers.length - 1) {
            nextElement = document.querySelector(`[data-cell="${rowIndex}-${colIndex + 1}"]`) as HTMLElement;
          } else if (rowIndex < this.module.rows.length - 1) {
            nextElement = document.querySelector(`[data-cell="${rowIndex + 1}-0"]`) as HTMLElement;
          }
        }
      }
      
      if (nextElement) {
        nextElement.focus();
      }
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    
    // Auto-resize on input
    target.style.height = 'auto';
    target.style.height = Math.max(20, target.scrollHeight) + 'px';
    
    this.onUpdate();
  }

  onDelete(): void {
    this.deleteModule.emit(this.module.id);
  }

  addColumn(): void {
    this.module.headers.push('Nouvelle colonne');
    this.module.rows.forEach(row => row.push(''));
    this.onUpdate();
  }

  addRow(): void {
    const newRow = new Array(this.module.headers.length).fill('');
    this.module.rows.push(newRow);
    this.onUpdate();
  }

  removeColumn(index: number): void {
    if (this.module.headers.length > 1) {
      this.module.headers.splice(index, 1);
      this.module.rows.forEach(row => row.splice(index, 1));
      this.onUpdate();
    }
  }

  removeRow(index: number): void {
    if (this.module.rows.length > 1) {
      this.module.rows.splice(index, 1);
      this.onUpdate();
    }
  }
}