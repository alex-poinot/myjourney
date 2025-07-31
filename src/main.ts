import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NogEditorComponent } from './components/nog-editor/nog-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, DashboardComponent, NogEditorComponent],
  template: `
    <div class="app-container">
      <app-navbar (tabChange)="onTabSelected($event)"></app-navbar>
      <main class="main-content" [class.navbar-collapsed]="false">
        <app-dashboard *ngIf="currentTab === 'dashboard'"></app-dashboard>
        <app-nog-editor *ngIf="currentTab === 'NOG'"></app-nog-editor>
        <div *ngIf="currentTab !== 'dashboard' && currentTab !== 'NOG'" class="coming-soon">
          <h2>{{ currentTab }}</h2>
          <p>Cette fonctionnalité sera bientôt disponible.</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
    }
    
    .main-content {
      margin-left: 280px;
      flex: 1;
      background: #f8fafc;
      min-height: 100vh;
      transition: margin-left 0.3s ease;
    }

    .main-content.navbar-collapsed {
      margin-left: 70px;
    }
    
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
      padding: 20px;
    }
    
    .coming-soon h2 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .coming-soon p {
      color: #666;
      font-size: 16px;
    }
  `]
})
export class AppComponent {
  currentTab = 'dashboard';

  onTabSelected(tab: string) {
    this.currentTab = tab;
  }
}

bootstrapApplication(AppComponent);