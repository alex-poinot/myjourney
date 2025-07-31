import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Module } from '../../models/module.interface';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      <div class="preview-header">
        <h2>Prévisualisation du document</h2>
      </div>
      <div class="preview-content" id="pdf-content">
        <div *ngFor="let module of sortedModules" class="preview-module">
          
          <!-- Titre -->
          <h1 *ngIf="module.type === 'title' && module.level === 1" 
              class="title-h1">
            {{ module.content }}
          </h1>
          <h2 *ngIf="module.type === 'title' && module.level === 2" 
              class="title-h2">
            {{ module.content }}
          </h2>
          <h3 *ngIf="module.type === 'title' && module.level === 3" 
              class="title-h3">
            {{ module.content }}
          </h3>
          
          <!-- Sous-titre -->
          <h4 *ngIf="module.type === 'subtitle'" class="subtitle">
            {{ module.content }}
          </h4>
          
          <!-- Texte -->
          <p *ngIf="module.type === 'text'" 
             class="text-content"
             [style.font-size.px]="module.fontSize"
             [style.color]="module.color">
            {{ module.content }}
          </p>
          
          <!-- Image -->
          <div *ngIf="module.type === 'image'" class="image-content">
            <img [src]="module.src" 
                 [alt]="module.alt"
                 [style.width.px]="module.width"
                 [style.height.px]="module.height">
          </div>
          
          <!-- Tableau -->
          <div *ngIf="module.type === 'table'" class="table-content">
            <table class="preview-table">
              <thead>
                <tr>
                  <th *ngFor="let header of module.headers">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of module.rows">
                  <td *ngFor="let cell of row">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
        </div>
        
        <div *ngIf="sortedModules.length === 0" class="empty-preview">
          <p>Aucun module ajouté. Commencez par ajouter du contenu depuis la sidebar.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      background: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .preview-header {
      background: #1e293b;
      color: white;
      padding: 16px 20px;
    }
    .preview-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .preview-content {
      padding: 24px;
      min-height: 400px;
      line-height: 1.6;
    }
    .preview-module {
      margin-bottom: 20px;
    }
    .title-h1 {
      font-size: 32px;
      font-weight: 700;
      color: #226D68;
      margin: 0 0 16px 0;
      border-bottom: 3px solid #64CEC7;
      padding-bottom: 8px;
    }
    .title-h2 {
      font-size: 24px;
      font-weight: 600;
      color: #334155;
      margin: 24px 0 12px 0;
    }
    .title-h3 {
      font-size: 20px;
      font-weight: 500;
      color: #475569;
      margin: 20px 0 10px 0;
    }
    .subtitle {
      font-size: 18px;
      font-weight: 500;
      color: #64748b;
      margin: 16px 0 8px 0;
      font-style: italic;
    }
    .text-content {
      margin: 12px 0;
      text-align: justify;
    }
    .image-content {
      text-align: center;
      margin: 20px 0;
    }
    .image-content img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .table-content {
      margin: 20px 0;
      overflow-x: auto;
    }
    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .preview-table th,
    .preview-table td {
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      text-align: left;
      word-wrap: break-word;
      word-break: break-word;
      white-space: pre-wrap;
      vertical-align: top;
      max-width: 200px;
    }
    .preview-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
    }
    .preview-table tr:nth-child(even) {
      background: #f9fafb;
    }
    .empty-preview {
      text-align: center;
      color: #64748b;
      font-style: italic;
      padding: 40px 20px;
    }
  `]
})
export class PreviewComponent {
  @Input() modules: Module[] = [];

  get sortedModules(): Module[] {
    return [...this.modules].sort((a, b) => a.order - b.order);
  }
}