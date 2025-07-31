import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    <nav class="navbar-vertical">
      <!-- Logo et titre -->
      <div class="navbar-header">
        <div class="logo">🤖</div>
        <h1 class="brand-title" [class.hidden]="isCollapsed">MyJourney</h1>
        <button class="collapse-toggle" (click)="toggleNavbar()">
          {{ isCollapsed ? '→' : '←' }}
        </button>
      </div>

      <!-- Menu vertical -->
      <div class="navbar-menu">
        <div *ngFor="let group of tabGroups" 
             class="menu-group"
             (mouseenter)="onGroupHover(group, true)"
             (mouseleave)="onGroupHover(group, false)">
          
          <!-- Icône du groupe -->
          <div class="group-icon" 
               [class.active]="isGroupActive(group)"
               (click)="toggleGroup(group)">
            <span class="icon">{{ group.icon }}</span>
            <span class="group-name" *ngIf="!isCollapsed">{{ group.name }}</span>
            <span class="expand-icon" *ngIf="!isCollapsed">
              {{ group.collapsed ? '▶' : '▼' }}
            </span>
          </div>
          
          <!-- Liste des onglets (visible si pas collapsed ou au hover) -->
          <div class="tab-list" 
               [class.visible]="(!group.collapsed && !isCollapsed) || group.hovered"
               [class.hover-menu]="isCollapsed && group.hovered">
            <div *ngFor="let tab of group.tabs" 
                 class="tab-item"
                 [class.active]="activeTab === tab"
                 (click)="onTabClick(tab)">
              <span class="tab-name">{{ tab }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Profil utilisateur -->
      <div class="navbar-profile" [class.collapsed]="isCollapsed">
        <img [src]="userPhoto" [alt]="userName" class="profile-photo">
        <span class="profile-name" *ngIf="!isCollapsed">{{ userName }}</span>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-vertical {
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      width: 280px;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      box-shadow: 2px 0 8px rgba(0,0,0,0.15);
      z-index: 100;
      transition: width 0.3s ease;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .navbar-vertical.collapsed {
      width: 70px;
    }

    .navbar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      position: relative;
    }

    .logo {
      font-size: 28px;
      background: linear-gradient(45deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
      padding: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      flex-shrink: 0;
    }

    .brand-title {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      margin-left: 12px;
      background: linear-gradient(45deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: opacity 0.3s ease;
      flex: 1;
    }

    .brand-title.hidden {
      opacity: 0;
      width: 0;
      margin: 0;
      overflow: hidden;
    }

    .collapse-toggle {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      flex: 1;
      flex-shrink: 0;
    }

    .collapse-toggle:hover {
      background: rgba(255,255,255,0.2);
    }

    .navbar-menu {
      flex: 1;
      padding: 16px 0;
      overflow-y: auto;
    }

    .menu-group {
      margin-bottom: 8px;
      position: relative;
    }

    .group-icon {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 8px;
      margin: 0 8px;
      position: relative;
    }

    .group-icon:hover {
      background: rgba(255,255,255,0.1);
    }

    .group-icon.active {
      background: rgba(59, 130, 246, 0.3);
      border-left: 3px solid #3b82f6;
    }

    .icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .group-name {
      margin-left: 12px;
      font-weight: 500;
      flex: 1;
      transition: opacity 0.3s ease;
    }

    .expand-icon {
      font-size: 12px;
      color: #cbd5e1;
      transition: transform 0.2s ease;
    }

    .tab-list {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      background: rgba(0,0,0,0.2);
      margin: 0 8px;
      border-radius: 6px;
    }

    .tab-list.visible {
      max-height: 300px;
      padding: 8px 0;
    }

    .tab-list.hover-menu {
      position: absolute;
      left: 100%;
      top: 0;
      width: 200px;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 4px 0 12px rgba(0,0,0,0.3);
      z-index: 1000;
      margin: 0;
      border-radius: 8px;
      max-height: none;
      padding: 8px;
    }

    .tab-item {
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
      margin: 2px 0;
    }

    .tab-item:hover {
      background: rgba(255,255,255,0.15);
    }

    .tab-item.active {
      background: #3b82f6;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      font-weight: 600;
    }

    .tab-name {
      font-size: 14px;
    }

    .navbar-profile {
      display: flex;
      align-items: center;
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      gap: 12px;
      transition: all 0.3s ease;
    }

    .navbar-profile.collapsed {
      justify-content: center;
      padding: 16px 8px;
    }

    .profile-photo {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.2);
      object-fit: cover;
      flex-shrink: 0;
    }

    .profile-name {
      font-weight: 500;
      color: #f1f5f9;
      font-size: 14px;
      transition: opacity 0.3s ease;
    }

    /* Scrollbar personnalisée */
    .navbar-menu::-webkit-scrollbar {
      width: 4px;
    }

    .navbar-menu::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
    }

    .navbar-menu::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
    }

    .navbar-menu::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.5);
    }
  `]
})
export class NavbarComponent {
  @Input() activeTab: string = 'Accueil';
  @Input() userName: string = 'Jean Dupont';
  @Input() userPhoto: string = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
  @Output() tabChange = new EventEmitter<string>();

  isCollapsed = false;

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

  toggleNavbar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleGroup(group: TabGroup): void {
    if (!this.isCollapsed) {
      group.collapsed = !group.collapsed;
    }
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
}