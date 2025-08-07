import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './auth/auth.config';
import { AuthService } from './services/auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NogEditorComponent } from './components/nog-editor/nog-editor.component';

export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export function initializeMsal(msalService: MsalService): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      msalService.instance.initialize().then(() => {
        msalService.handleRedirectObservable().subscribe(() => {
          resolve();
        });
      });
    });
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, DashboardComponent, NogEditorComponent],
  template: `
    <div class="app-container">
      <app-navbar (tabChange)="onTabSelected($event)"></app-navbar>
      <main class="main-content">
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
      min-height: calc(100vh - 70px);
    }
    
    .main-content {
      margin-top: 70px;
      background: #f8fafc;
      min-height: calc(100vh - 70px);
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

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    MsalService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMsal,
      deps: [MsalService],
      multi: true
    },
    AuthService
  ]
});