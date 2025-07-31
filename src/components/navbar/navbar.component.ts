import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabGroup {
  name: string;
  tabs: string[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar">
      <!-- Logo et titre -->
      <div class="navbar-brand">
        <div class="logo">🤖</div>
        <h1 class="brand-title">MyJourney</h1>
      </div>

      <!-- Groupes d'onglets -->
      <div class="navbar-tabs">
        <div *ngFor="let group of tabGroups" class="tab-group">
          <span class="group-label">{{ group.name }}</span>
          <div class="tabs">
            <button 
              *ngFor="let tab of group.tabs" 
              class="tab"
              [class.active]="activeTab === tab"
              (click)="onTabClick(tab)">
              {{ tab }}
            </button>
          </div>
        </div>
      </div>

      <!-- Profil utilisateur -->
      <div class="navbar-profile">
        <img [src]="userPhoto" [alt]="userName" class="profile-photo">
        <span class="profile-name">{{ userName }}</span>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 12px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      font-size: 32px;
      background: linear-gradient(45deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .brand-title {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(45deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .navbar-tabs {
      display: flex;
      gap: 32px;
      flex: 1;
      justify-content: center;
    }

    .tab-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .group-label {
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tabs {
      display: flex;
      gap: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 4px;
    }

    .tab {
      background: transparent;
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab:hover {
      background: rgba(255,255,255,0.15);
    }

    .tab.active {
      background: #3b82f6;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    .navbar-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .profile-photo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.2);
      object-fit: cover;
    }

    .profile-name {
      font-weight: 600;
      color: #f1f5f9;
    }

    @media (max-width: 1200px) {
      .navbar-tabs {
        gap: 16px;
      }
      .tab {
        padding: 6px 8px;
        font-size: 12px;
      }
    }

    @media (max-width: 768px) {
      .navbar {
        flex-wrap: wrap;
        gap: 16px;
      }
      .navbar-tabs {
        order: 3;
        width: 100%;
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: 8px;
      }
    }
  `]
})
export class NavbarComponent {
  @Input() activeTab: string = 'Accueil';
  @Input() userName: string = 'Jean Dupont';
  @Input() userPhoto: string = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
  @Output() tabChange = new EventEmitter<string>();

  tabGroups: TabGroup[] = [
    {
      name: 'Avant la mission',
      tabs: ['LAB', 'Conflit Check', 'QAC', 'QAM', 'LDM']
    },
    {
      name: 'Pendant la mission',
      tabs: ['NOG', 'Checklist', 'Révision', 'Supervision']
    },
    {
      name: 'Fin de mission',
      tabs: ['NDS/CR Mission', 'QMM', 'Plaquette', 'Restitution communication client']
    }
  ];

  onTabClick(tab: string): void {
    this.tabChange.emit(tab);
  }
}