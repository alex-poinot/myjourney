import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NogEditorComponent } from './components/nog-editor/nog-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    DashboardComponent,
    NogEditorComponent
  ],
  template: `
    <div class="app">
      <app-navbar 
        [activeTab]="currentTab" 
        (tabChange)="onTabChange($event)">
      </app-navbar>
      
      <main class="main-content">
        <app-dashboard *ngIf="currentTab === 'Accueil'"></app-dashboard>
        <app-nog-editor *ngIf="currentTab === 'NOG'"></app-nog-editor>
        
        <!-- Placeholder pour les autres onglets -->
        <div *ngIf="!['Accueil', 'NOG'].includes(currentTab)" class="placeholder-page">
          <div class="placeholder-content">
            <h1>{{ currentTab }}</h1>
            <p>Cette page est en cours de développement.</p>
            <div class="placeholder-icon">🚧</div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app {
      background: #f1f5f9;
      min-height: 100vh;
    }

    .main-content {
      min-height: calc(100vh - 80px);
      display: flex;
      flex: 1;
    }

    .placeholder-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 80px);
      background: white;
      margin: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .placeholder-content {
      text-align: center;
      color: #64748b;
    }

    .placeholder-content h1 {
      font-size: 32px;
      margin: 0 0 16px 0;
      color: #374151;
      font-weight: 700;
    }

    .placeholder-content p {
      font-size: 18px;
      margin: 0 0 24px 0;
    }

    .placeholder-icon {
      font-size: 64px;
      opacity: 0.5;
    }
  `]
})
export class App {
  currentTab = 'Accueil';

  onTabChange(tab: string): void {
    this.currentTab = tab;
  }
}

bootstrapApplication(App);

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
      .app-container {
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
export class App implements OnInit, OnDestroy {
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
      this.modulesSubject.next(sortedModules);
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
      const filename = `document-${new Date().toISOString().split('T')[0]}.pdf`;
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

bootstrapApplication(App);