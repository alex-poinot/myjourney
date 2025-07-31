import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, BehaviorSubject } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';

import { ModuleService } from '../../services/module.service';
import { PdfService } from '../../services/pdf.service';
import { Module } from '../../models/module.interface';

import { TextModuleComponent } from '../text-module/text-module.component';
import { ImageModuleComponent } from '../image-module/image-module.component';
import { TableModuleComponent } from '../table-module/table-module.component';
import { TitleModuleComponent } from '../title-module/title-module.component';
import { SubtitleModuleComponent } from '../subtitle-module/subtitle-module.component';
import { PreviewComponent } from '../preview/preview.component';

@Component({
  selector: 'app-nog-editor',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TextModuleComponent,
    ImageModuleComponent,
    TableModuleComponent,
    TitleModuleComponent,
    SubtitleModuleComponent,
    PreviewComponent
  ],
  template: `
    <div class="nog-container">
      <!-- Sidebar -->
      <div class="sidebar" [class.collapsed]="sidebarCollapsed">
        <!-- Toggle Button -->
        <div class="sidebar-toggle" (click)="toggleSidebar()">
          <span class="toggle-icon">{{ sidebarCollapsed ? '→' : '←' }}</span>
        </div>
        
        <div class="sidebar-header">
          <h1 *ngIf="!sidebarCollapsed">📄 Éditeur NOG</h1>
          <h1 *ngIf="sidebarCollapsed" class="collapsed-title">📄</h1>
          <p *ngIf="!sidebarCollapsed">Glissez-déposez des modules</p>
        </div>
        
        <div class="modules-list">
          <h3 *ngIf="!sidebarCollapsed">Modules disponibles</h3>
          <div class="module-templates" 
               cdkDropList
               [cdkDropListData]="moduleService.moduleTemplates"
               cdkDropListSortingDisabled="true"
               [cdkDropListConnectedTo]="['modules-drop-list']">
            <div *ngFor="let template of moduleService.moduleTemplates" 
                 class="module-template"
                 cdkDrag
                 [cdkDragData]="template">
              <div class="template-icon">{{ template.icon }}</div>
              <div class="template-info" *ngIf="!sidebarCollapsed">
                <div class="template-name">{{ template.name }}</div>
                <div class="template-description">{{ template.description }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="sidebar-actions" *ngIf="!sidebarCollapsed">
          <button class="export-btn" 
                  (click)="exportToPdf()"
                  [disabled]="modules.length === 0">
            📥 Exporter en PDF
          </button>
          <button class="clear-btn" 
                  (click)="clearAll()"
                  [disabled]="modules.length === 0">
            🗑️ Tout effacer
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Editor Section -->
        <div class="editor-section">
          <div class="editor-header">
            <h2>Édition des modules NOG</h2>
            <span class="module-count">{{ modules.length }} module(s)</span>
          </div>
          
          <div class="modules-editor"
               cdkDropList
               id="modules-drop-list"
               [cdkDropListData]="modules"
               (cdkDropListDropped)="onModuleDrop($event)"
               [cdkDropListConnectedTo]="[]">
            <div *ngIf="modules.length === 0" class="empty-state">
              <div class="empty-icon">📝</div>
              <h3>Commencez à créer votre document NOG</h3>
              <p>Glissez un module depuis la sidebar pour commencer</p>
            </div>
            
            <div *ngFor="let module of sortedModules; trackBy: trackByModuleId; let i = index" 
                 class="module-wrapper"
                 cdkDrag
                 [cdkDragData]="module">
              <div class="drag-handle" cdkDragHandle>
                <div class="drag-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
              </div>
              
              <div class="module-content">
                <app-text-module 
                  *ngIf="module.type === 'text'"
                  [module]="module"
                  (moduleChange)="updateModule($event)"
                  (deleteModule)="deleteModule($event)">
                </app-text-module>
                
                <app-image-module 
                  *ngIf="module.type === 'image'"
                  [module]="module"
                  (moduleChange)="updateModule($event)"
                  (deleteModule)="deleteModule($event)">
                </app-image-module>
                
                <app-table-module 
                  *ngIf="module.type === 'table'"
                  [module]="module"
                  (moduleChange)="updateModule($event)"
                  (deleteModule)="deleteModule($event)">
                </app-table-module>
                
                <app-title-module 
                  *ngIf="module.type === 'title'"
                  [module]="module"
                  (moduleChange)="updateModule($event)"
                  (deleteModule)="deleteModule($event)">
                </app-title-module>
                
                <app-subtitle-module 
                  *ngIf="module.type === 'subtitle'"
                  [module]="module"
                  (moduleChange)="updateModule($event)"
                  (deleteModule)="deleteModule($event)">
                </app-subtitle-module>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="preview-section">
          <app-preview [modules]="modules"></app-preview>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isExporting" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Génération du PDF en cours...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nog-container {
      display: flex;
      min-height: calc(100vh - 80px);
      background: #f1f5f9;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    /* Sidebar */
    .sidebar {
      width: 320px;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 4px rgba(0,0,0,0.05);
      transition: width 0.3s ease;
      position: relative;
    }
    .sidebar.collapsed {
      width: 60px;
    }
    .sidebar-toggle {
      position: absolute;
      top: 50%;
      right: -15px;
      width: 30px;
      height: 30px;
      background: #2563eb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s;
    }
    .sidebar-toggle:hover {
      background: #1d4ed8;
      transform: scale(1.1);
    }
    .toggle-icon {
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
    }
    .sidebar-header h1 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
    }
    .collapsed-title {
      text-align: center;
      font-size: 24px;
    }
    .sidebar-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .modules-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
    .modules-list h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #374151;
      font-weight: 600;
    }
    .module-template {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 8px;
      position: relative;
    }
    .module-template:hover {
      border-color: #2563eb;
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .sidebar.collapsed .module-template {
      justify-content: center;
      padding: 12px 8px;
      border: none;
    }
    .sidebar.collapsed .module-template:hover .template-info {
      display: block;
      position: absolute;
      left: 100%;
      top: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      white-space: nowrap;
      margin-left: 8px;
    }
    .template-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 6px;
    }
    .template-info {
      flex: 1;
    }
    .template-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .template-description {
      font-size: 12px;
      color: #64748b;
    }
    .sidebar-actions {
      padding: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .export-btn, .clear-btn {
      padding: 12px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .export-btn {
      background: #16a34a;
      color: white;
    }
    .export-btn:hover:not(:disabled) {
      background: #15803d;
      transform: translateY(-1px);
    }
    .export-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
    .clear-btn {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .clear-btn:hover:not(:disabled) {
      background: #e2e8f0;
      color: #475569;
    }
    .clear-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      gap: 24px;
      padding: 24px;
      overflow: hidden;
    }
    .editor-section, .preview-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 128px);
    }
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .editor-header h2 {
      margin: 0;
      color: #1e293b;
      font-size: 20px;
      font-weight: 600;
    }
    .module-count {
      background: #e0e7ff;
      color: #3730a3;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .modules-editor {
      flex: 1;
      overflow-y: auto;
      padding-right: 8px;
      min-height: 200px;
    }
    .module-wrapper {
      position: relative;
      margin-bottom: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .drag-handle {
      width: 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      opacity: 0;
      transition: opacity 0.2s;
      background: #f1f5f9;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
      margin-top: 8px;
    }
    .module-wrapper:hover .drag-handle {
      opacity: 1;
    }
    .drag-handle:active {
      cursor: grabbing;
    }
    .drag-dots {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px;
    }
    .dot {
      width: 3px;
      height: 3px;
      background: #64748b;
      border-radius: 50%;
    }
    .module-content {
      flex: 1;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }
    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .loading-content {
      background: white;
      padding: 32px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-content p {
      margin: 0;
      color: #374151;
      font-weight: 500;
    }
    
    /* CDK Drag & Drop Styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      opacity: 0.9;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
      border: 2px dashed #cbd5e1;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 16px;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-style: italic;
    }
    .cdk-drag-placeholder::after {
      content: "Déposez le module ici";
    }
    .cdk-drop-list-receiving .cdk-drag {
      display: none;
    }
    .modules-editor.cdk-drop-list-dragging .module-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .main-content {
        flex-direction: column;
      }
      .preview-section {
        max-height: 500px;
      }
    }
    @media (max-width: 768px) {
      .nog-container {
        flex-direction: column;
      }
      .sidebar {
        width: 100%;
        height: auto;
      }
      .main-content {
        padding: 16px;
      }
    }
  `]
})
export class NogEditorComponent implements OnInit, OnDestroy {
  modules: Module[] = [];
  isExporting = false;
  sidebarCollapsed = false;
  private modulesSubject = new BehaviorSubject<Module[]>([]);
  private destroy$ = new Subject<void>();

  constructor(
    public moduleService: ModuleService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.moduleService.modules$
      .pipe(takeUntil(this.destroy$))
      .subscribe(modules => {
        this.modules = modules;
        this.modulesSubject.next(modules);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get sortedModules(): Module[] {
    return [...this.modules].sort((a, b) => a.order - b.order);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onModuleDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer === event.container) {
      // Réorganisation des modules existants
      const currentModules = [...this.modules];
      const sortedModules = currentModules.sort((a, b) => a.order - b.order);
      
      // Déplacer l'élément
      moveItemInArray(sortedModules, event.previousIndex, event.currentIndex);
      
      // Mettre à jour tous les ordres
      sortedModules.forEach((module, index) => {
        module.order = index + 1;
      });
      
      // Mettre à jour le service avec tous les modules modifiés
      sortedModules.forEach(module => {
        this.moduleService.updateModule(module);
      });
    } else {
      // Ajout d'un nouveau module depuis la sidebar
      const template = event.item.data;
      this.moduleService.addModule(template.type);
    }
  }

  updateModule(module: Module): void {
    this.moduleService.updateModule(module);
  }

  deleteModule(id: string): void {
    this.moduleService.removeModule(id);
  }

  clearAll(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les modules ?')) {
      this.modules.forEach(module => {
        this.moduleService.removeModule(module.id);
      });
    }
  }

  async exportToPdf(): Promise<void> {
    if (this.modules.length === 0) {
      alert('Ajoutez au moins un module avant d\'exporter le PDF');
      return;
    }

    this.isExporting = true;
    
    try {
      const filename = `nog-document-${new Date().toISOString().split('T')[0]}.pdf`;
      await this.pdfService.exportToPdf('pdf-content', filename);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF');
    } finally {
      this.isExporting = false;
    }
  }

  trackByModuleId(index: number, module: Module): string {
    return module.id;
  }
}