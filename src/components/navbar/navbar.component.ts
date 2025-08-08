import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../../services/auth.service';

export interface TabGroup {
  name: string;
  tabs: string[];
  icon: string;
  collapsed: boolean;
  hovered?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar-horizontal">
      <!-- Logo et titre -->
      <div class="navbar-brand" (click)="goToHome()">
        <div class="logo-robot">🤖</div>
        <h1 class="brand-title">MyJourney</h1>
      </div>

      <!-- Menu horizontal -->
      <div class="navbar-menu">
        <div *ngFor="let group of tabGroups" 
             class="menu-group"
             (mouseenter)="onGroupHover(group, true)"
             (mouseleave)="onGroupHover(group, false)">
          
          <!-- Icône du groupe -->
          <div class="group-button" 
               [class.active]="isGroupActive(group)"
               (click)="toggleGroup(group)">
            <span class="group-name">{{ group.name }}</span>
            <span class="expand-icon">{{ group.collapsed ? '▼' : '▲' }}</span>
          </div>
          
          <!-- Dropdown des onglets -->
          <div class="dropdown-menu" 
               [class.visible]="!group.collapsed || group.hovered">
            <div *ngFor="let tab of group.tabs" 
                 class="dropdown-item"
                 [class.active]="activeTab === tab"
                 (click)="onTabClick(tab)">
              {{ tab }}
            </div>
          </div>
        </div>
      </div>

      <!-- Profil utilisateur -->
      <div class="navbar-profile">
        <img [src]="currentUser?.photoUrl || defaultPhoto" [alt]="currentUser?.displayName || 'Utilisateur'" class="profile-photo">
        <span class="profile-name">{{ currentUser?.displayName || 'Utilisateur' }}</span>
        <button class="logout-btn" (click)="logout()" title="Se déconnecter">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-horizontal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: white;
      color: var(--gray-800);
      box-shadow: var(--shadow-md);
      border-bottom: 2px solid var(--primary-color);
      z-index: 100;
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 32px;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 8px 12px;
      border-radius: 8px;
    }

    .navbar-brand:hover {
      background: rgba(34, 109, 104, 0.05);
    }

    .logo {
      font-size: 28px;
    }

    .logo-robot {
      font-size: 32px;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
    }

    .brand-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .navbar-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .menu-group {
      position: relative;
    }

    .group-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 8px;
      white-space: nowrap;
    }

    .group-button:hover {
      background: rgba(34, 109, 104, 0.05);
    }

    .group-button.active {
      background: rgba(34, 109, 104, 0.1);
      border: 1px solid var(--primary-color);
    }

    .group-name {
      font-weight: 500;
      font-size: 14px;
    }

    .expand-icon {
      font-size: 10px;
      color: var(--primary-color);
      transition: transform 0.2s ease;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 200px;
      background: white;
      border: 1px solid var(--primary-color);
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      z-index: 1000;
      margin-top: 8px;
    }

    .dropdown-menu.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-item {
      padding: 10px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 6px;
      margin: 4px;
      font-size: 14px;
    }

    .dropdown-item:hover {
      background: rgba(37, 99, 235, 0.05);
    }

    .dropdown-item.active {
      background: var(--primary-color);
      color: white;
      font-weight: 600;
    }

    .navbar-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .navbar-profile:hover {
      background: rgba(34, 109, 104, 0.05);
    }

    .profile-photo {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--primary-color);
      object-fit: cover;
    }

    .profile-name {
      font-weight: 500;
      color: var(--gray-700);
      font-size: 14px;
    }
    
    .logout-btn {
      background: none;
      border: none;
      color: var(--gray-600);
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      margin-left: 8px;
    }
    
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-color);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .navbar-horizontal {
        padding: 0 16px;
        gap: 16px;
      }
      
      .group-name {
        display: none;
      }
      
      .profile-name {
        display: none;
      }
      
      .profile-info {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .navbar-horizontal {
        height: 60px;
        padding: 0 12px;
        gap: 8px;
      }
      
      .brand-title {
        font-size: 16px;
      }
      
      .logo {
        font-size: 24px;
        padding: 4px;
      }
    }
  `]
})
export class NavbarComponent {
  @Input() activeTab: string = 'dashboard';
  @Output() tabChange = new EventEmitter<string>();
  
  currentUser: UserProfile | null = null;
  defaultPhoto = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';

  tabGroups: TabGroup[] = [
    {
      name: 'Avant la mission',
      tabs: ['LAB', 'Conflit Check', 'QAC', 'QAM', 'LDM'],
      icon: '📋',
      collapsed: true
    },
    {
      name: 'Pendant la mission',
      tabs: ['NOG', 'Checklist', 'Révision', 'Supervision'],
      icon: '⚙️',
      collapsed: true
    },
    {
      name: 'Fin de mission',
      tabs: ['NDS/CR Mission', 'QMM', 'Plaquette', 'Restitution communication client'],
      icon: '✅',
      collapsed: true
    }
  ];

  constructor(private authService: AuthService) {
    this.authService.userProfile$.subscribe(user => {
      this.currentUser = user;
      // Charger la photo de profil si elle n'est pas encore chargée
      if (user && !user.photoUrl) {
        this.loadUserPhoto();
      }
    });
  }

  private async loadUserPhoto(): Promise<void> {
    // Cette méthode sera appelée automatiquement par AuthService
    // lors du chargement du profil utilisateur
  }

  toggleGroup(group: TabGroup): void {
    group.collapsed = !group.collapsed;
  }

  onGroupHover(group: TabGroup, isHovered: boolean): void {
    (group as any).hovered = isHovered;
  }

  isGroupActive(group: TabGroup): boolean {
    return group.tabs.includes(this.activeTab);
  }

  onTabClick(tab: string): void {
    this.tabChange.emit(tab);
  }

  goToHome(): void {
    this.tabChange.emit('dashboard');
  }
  
  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }
}