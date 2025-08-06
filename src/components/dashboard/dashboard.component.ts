import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

interface MissionData {
  numeroGroupe: string;
  nomGroupe: string;
  numeroClient: string;
  nomClient: string;
  mission: string;
  avantMission: {
    percentage: number;
    lab: boolean;
    conflitCheck: boolean;
    qac: boolean;
    qam: boolean;
    ldm: boolean;
  };
  pendantMission: {
    percentage: number;
    nog: boolean;
    checklist: boolean;
    revision: boolean;
    supervision: boolean;
  };
  finMission: {
    percentage: number;
    ndsCr: boolean;
    qmm: boolean;
    plaquette: boolean;
    restitution: boolean;
  };
}

interface ClientGroup {
  numeroClient: string;
  nomClient: string;
  missions: MissionData[];
  expanded: boolean;
}

interface GroupData {
  numeroGroupe: string;
  nomGroupe: string;
  clients: ClientGroup[];
  expanded: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Tableau de bord des missions</h1>
        <p>Vue d'ensemble de l'avancement de toutes les missions</p>
      </div>

      <div class="table-controls">
        <div class="pagination-info">
          Affichage de {{ startIndex + 1 }} à {{ endIndex }} sur {{ totalMissions }} missions
        </div>
        <div class="pagination-controls">
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)">
            ← Précédent
          </button>
          <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)">
            Suivant →
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="mission-table">
          <thead>
            <tr>
              <!--<th rowspan="2" class="group-header">
                <button class="collapse-btn" (click)="toggleAllGroups()">
                  {{ allGroupsExpanded ? '▼' : '▶' }}
                </button>
              </th>-->
              <!-- Groupe Information -->
              <th colspan="5" class="column-group-header information">
                Information
              </th>
              <!-- Groupe Avant la mission -->
              <th [attr.colspan]="avantMissionCollapsed ? 1 : 6" class="column-group-header avant-mission">
                <button class="collapse-btn" (click)="toggleColumnGroup('avantMission')">
                  {{ avantMissionCollapsed ? '▶' : '▼' }}
                </button>
                Avant la mission
              </th>
              <!-- Groupe Pendant la mission -->
              <th [attr.colspan]="pendantMissionCollapsed ? 1 : 5" class="column-group-header pendant-mission">
                <button class="collapse-btn" (click)="toggleColumnGroup('pendantMission')">
                  {{ pendantMissionCollapsed ? '▶' : '▼' }}
                </button>
                Pendant la mission
              </th>
              <!-- Groupe Fin de mission -->
              <th [attr.colspan]="finMissionCollapsed ? 1 : 5" class="column-group-header fin-mission">
                <button class="collapse-btn" (click)="toggleColumnGroup('finMission')">
                  {{ finMissionCollapsed ? '▶' : '▼' }}
                </button>
                Fin de mission
              </th>
            </tr>
            <tr>
              <!-- Information columns -->
              <th class="column-header">N° Groupe</th>
              <th class="column-header">Nom Groupe</th>
              <th class="column-header">N° Client</th>
              <th class="column-header">Nom Client</th>
              <th class="column-header">Mission</th>
              
              <!-- Avant la mission columns -->
              <th class="column-header percentage">%</th>
              <th *ngIf="!avantMissionCollapsed" class="column-header">LAB</th>
              <th *ngIf="!avantMissionCollapsed" class="column-header">Conflit Check</th>
              <th *ngIf="!avantMissionCollapsed" class="column-header">QAC</th>
              <th *ngIf="!avantMissionCollapsed" class="column-header">QAM</th>
              <th *ngIf="!avantMissionCollapsed" class="column-header">LDM</th>
              
              <!-- Pendant la mission columns -->
              <th class="column-header percentage">%</th>
              <th *ngIf="!pendantMissionCollapsed" class="column-header">NOG</th>
              <th *ngIf="!pendantMissionCollapsed" class="column-header">Checklist</th>
              <th *ngIf="!pendantMissionCollapsed" class="column-header">Révision</th>
              <th *ngIf="!pendantMissionCollapsed" class="column-header">Supervision</th>
              
              <!-- Fin de mission columns -->
              <th class="column-header percentage">%</th>
              <th *ngIf="!finMissionCollapsed" class="column-header">NDS/CR</th>
              <th *ngIf="!finMissionCollapsed" class="column-header">QMM</th>
              <th *ngIf="!finMissionCollapsed" class="column-header">Plaquette</th>
              <th *ngIf="!finMissionCollapsed" class="column-header">Restitution</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let group of paginatedData; let groupIndex = index">
              <!-- Ligne de groupe -->
              <tr class="group-row main-group" (click)="toggleMainGroup(groupIndex)">
                <!--<td class="group-cell">
                  <button class="collapse-btn">
                    {{ group.expanded ? '▼' : '▶' }}
                  </button>
                  <strong>{{ group.numeroGroupe }} - {{ group.nomGroupe }}</strong>
                </td>-->
                <td colspan="100%" class="group-summary">
                  <div class="group-cell">
                    <div class="collapse-btn-container">
                      <button class="collapse-btn">
                        {{ group.expanded ? '▼' : '▶' }}
                      </button>
                    </div>
                    <div class="group-info">
                      <strong>{{ group.numeroGroupe }} - {{ group.nomGroupe }}</strong>
                      {{ getTotalMissionsInGroup(group) }} mission(s) - {{ group.clients.length }} client(s) - Avancement moyen: {{ getMainGroupAverage(group) }}%
                    </div>
                  </div>
                </td>
              </tr>
              
              <!-- Groupes de clients -->
              <ng-container *ngFor="let client of group.clients; let clientIndex = index">
                <!-- Ligne de sous-groupe (client) -->
                <tr class="group-row client-group" 
                    [class.hidden]="!group.expanded"
                    (click)="toggleClientGroup(groupIndex, clientIndex)">
                  <!--<td class="client-indent"></td>-->
                  <td class="client-cell" colspan="5">
                    <div class="client-row">
                      <button class="collapse-btn">
                        {{ client.expanded ? '▼' : '▶' }}
                      </button>
                      <strong>{{ client.numeroClient }} - {{ client.nomClient }}</strong>
                      <span class="client-summary">({{ client.missions.length }} mission(s))</span>
                    </div>
                  </td>
                  
                  <!-- Colonnes vides pour l'alignement -->
                  <td class="percentage-cell">
                    <div class="progress-circle" [attr.data-percentage]="getClientAverage(client, 'avantMission')">
                      {{ getClientAverage(client, 'avantMission') }}%
                    </div>
                  </td>
                  <td *ngIf="!avantMissionCollapsed" [attr.colspan]="avantMissionCollapsed ? 0 : 5"></td>
                  
                  <td class="percentage-cell">
                    <div class="progress-circle" [attr.data-percentage]="getClientAverage(client, 'pendantMission')">
                      {{ getClientAverage(client, 'pendantMission') }}%
                    </div>
                  </td>
                  <td *ngIf="!pendantMissionCollapsed" [attr.colspan]="pendantMissionCollapsed ? 0 : 4"></td>
                  
                  <td class="percentage-cell">
                    <div class="progress-circle" [attr.data-percentage]="getClientAverage(client, 'finMission')">
                      {{ getClientAverage(client, 'finMission') }}%
                    </div>
                  </td>
                  <td *ngIf="!finMissionCollapsed" [attr.colspan]="finMissionCollapsed ? 0 : 4"></td>
                </tr>
                
                <!-- Missions du client -->
                <tr *ngFor="let mission of client.missions" 
                    class="mission-row" 
                    [class.hidden]="!group.expanded || !client.expanded">
                  <!--<td class="mission-indent"></td>-->
                  
                  <!-- Information -->
                  <td>{{ mission.numeroGroupe }}</td>
                  <td>{{ mission.nomGroupe }}</td>
                  <td>{{ mission.numeroClient }}</td>
                  <td>{{ mission.nomClient }}</td>
                  <td>{{ mission.mission }}</td>
                  
                  <!-- Avant la mission -->
                  <td class="percentage-cell">
                    <div class="progress-circle" [attr.data-percentage]="mission.avantMission.percentage">
                      {{ mission.avantMission.percentage }}%
                    </div>
                  </td>
                  <td *ngIf="!avantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.avantMission.lab">
                      {{ mission.avantMission.lab ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!avantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.avantMission.conflitCheck">
                      {{ mission.avantMission.conflitCheck ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!avantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.avantMission.qac">
                      {{ mission.avantMission.qac ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!avantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.avantMission.qam">
                      {{ mission.avantMission.qam ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!avantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.avantMission.ldm">
                      {{ mission.avantMission.ldm ? '✅' : '⏳' }}
                    </span>
                  </td>
                  
                  <!-- Pendant la mission -->
                  <td class="percentage-cell">
                    <div class="progress-circle" [attr.data-percentage]="mission.pendantMission.percentage">
                      {{ mission.pendantMission.percentage }}%
                    </div>
                  </td>
                  <td *ngIf="!pendantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.pendantMission.nog">
                      {{ mission.pendantMission.nog ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!pendantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.pendantMission.checklist">
                      {{ mission.pendantMission.checklist ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!pendantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.pendantMission.revision">
                      {{ mission.pendantMission.revision ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!pendantMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.pendantMission.supervision">
                      {{ mission.pendantMission.supervision ? '✅' : '⏳' }}
                    </span>
                  </td>
                  
                  <!-- Fin de mission -->
                  <td class="percentage-cell">
                    <div class="progress-circle" [attr.data-percentage]="mission.finMission.percentage">
                      {{ mission.finMission.percentage }}%
                    </div>
                  </td>
                  <td *ngIf="!finMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.finMission.ndsCr">
                      {{ mission.finMission.ndsCr ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!finMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.finMission.qmm">
                      {{ mission.finMission.qmm ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!finMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.finMission.plaquette">
                      {{ mission.finMission.plaquette ? '✅' : '⏳' }}
                    </span>
                  </td>
                  <td *ngIf="!finMissionCollapsed" class="status-cell">
                    <span class="status-icon" [class.completed]="mission.finMission.restitution">
                      {{ mission.finMission.restitution ? '✅' : '⏳' }}
                    </span>
                  </td>
                </tr>
              </ng-container>
            </ng-container>
          </tbody>
        </table>
      </div>

      <div class="pagination-footer">
        <div class="pagination-controls">
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === 1"
            (click)="goToPage(1)">
            ← Première
          </button>
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)">
            ← Précédent
          </button>
          
          <div class="page-numbers">
            <button 
              *ngFor="let page of getVisiblePages()" 
              class="page-btn"
              [class.active]="page === currentPage"
              (click)="goToPage(page)">
              {{ page }}
            </button>
          </div>
          
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)">
            Suivant →
          </button>
          <button 
            class="pagination-btn" 
            [disabled]="currentPage === totalPages"
            (click)="goToPage(totalPages)">
            Dernière →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hidden {
      display: none;
    }
    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 70px);
      background: var(--gray-50);
      overflow: hidden;
    }

    .dashboard-header {
      flex-shrink: 0;
      padding: 24px 24px 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dashboard-header h1 {
      margin: 0 0 8px 0;
      color: var(--primary-color);
      font-size: 28px;
      font-weight: 700;
    }

    .dashboard-header p {
      margin: 0;
      color: var(--gray-600);
      font-size: 16px;
    }

    .table-controls {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid var(--gray-200);
    }

    .pagination-info {
      font-size: 14px;
      color: var(--gray-600);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pagination-btn {
      padding: 8px 12px;
      border: 1px solid var(--gray-300);
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: var(--gray-50);
      border-color: var(--primary-color);
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 14px;
      color: var(--gray-700);
      font-weight: 500;
    }

    .table-wrapper {
      flex: 1;
      overflow: auto;
      margin: 0 24px;
      background: white;
      border-radius: 12px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--gray-200);
    }

    .mission-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      min-width: 100%;
    }

    .column-group-header {
      background: var(--primary-color);
      color: white;
      padding: 12px 16px;
      font-weight: 600;
      text-align: center;
      border-bottom: 2px solid var(--secondary-color);
      position: relative;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .group-cell {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .client-row {
      padding-left: 16px;
      display: flex;
      align-items: center;
    }
    
    .column-group-header.information {
      background: var(--primary-dark);
    }

    .column-group-header.avant-mission {
      background: var(--primary-color);
    }

    .column-group-header.pendant-mission {
      background: var(--secondary-color);
      color: var(--primary-color);
    }

    .column-group-header.fin-mission {
      background: var(--primary-color);
    }

    .column-header {
      background: var(--gray-100);
      color: var(--gray-700);
      padding: 10px 12px;
      font-weight: 600;
      text-align: center;
      border-bottom: 1px solid var(--gray-200);
      white-space: nowrap;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .column-header.percentage {
      background: rgba(34, 109, 104, 0.1);
      color: var(--primary-color);
      min-width: 60px;
    }

    .group-row.main-group {
      background: var(--gray-50);
      cursor: pointer;
      transition: background-color 0.2s;
      font-weight: 600;
    }

    .group-row.main-group:hover {
      background: var(--gray-100);
    }

    .group-row.client-group {
      background: rgba(100, 206, 199, 0.1);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .group-row.client-group:hover {
      background: rgba(100, 206, 199, 0.2);
    }

    .client-indent {
      width: 40px;
      background: rgba(100, 206, 199, 0.1);
    }

    .client-cell {
      padding: 10px 16px;
      font-weight: 500;
      color: var(--secondary-color);
    }

    .client-summary {
      font-size: 12px;
      color: var(--gray-600);
      font-weight: normal;
      margin-left: 8px;
    }
    .group-summary {
      padding: 12px 16px;
      color: var(--gray-600);
      font-style: italic;
    }

    .mission-row {
      border-bottom: 1px solid var(--gray-100);
      transition: all 0.2s;
    }

    .mission-row:hover {
      background: var(--gray-50);
    }

    .mission-row.hidden {
      display: none;
    }

    .mission-indent {
      width: 60px;
      background: var(--gray-50);
    }

    .mission-row td {
      padding: 10px 12px;
      text-align: center;
      vertical-align: middle;
    }

    .percentage-cell {
      padding: 8px !important;
    }

    .progress-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 11px;
      margin: 0 auto;
      position: relative;
    }

    .progress-circle[data-percentage="0"] {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-color);
    }

    .progress-circle[data-percentage="25"] {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning-color);
    }

    .progress-circle[data-percentage="50"] {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning-color);
    }

    .progress-circle[data-percentage="75"] {
      background: rgba(100, 206, 199, 0.1);
      color: var(--success-color);
    }

    .progress-circle[data-percentage="100"] {
      background: rgba(100, 206, 199, 0.1);
      color: var(--success-color);
    }

    .status-cell {
      padding: 8px !important;
    }

    .status-icon {
      font-size: 16px;
      display: inline-block;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 12px;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .collapse-btn:hover {
      background: rgba(255,255,255,0.1);
    }

    .column-group-header .collapse-btn {
      margin-right: 8px;
    }

    .pagination-footer {
      flex-shrink: 0;
      padding: 16px 24px;
      background: white;
      border-top: 1px solid var(--gray-200);
    }

    .page-numbers {
      display: flex;
      gap: 4px;
    }

    .page-btn {
      padding: 8px 12px;
      border: 1px solid var(--gray-300);
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      min-width: 40px;
      transition: all 0.2s;
    }

    .page-btn:hover {
      background: var(--gray-50);
      border-color: var(--primary-color);
    }

    .page-btn.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .table-controls {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .pagination-controls {
        justify-content: center;
      }
      
      .page-numbers {
        display: none;
      }
    }

    @media (max-width: 1200px) {
      .mission-table {
        font-size: 12px;
      }
      
      .column-header,
      .mission-row td {
        padding: 8px 6px;
      }
      
      .progress-circle {
        width: 35px;
        height: 35px;
        font-size: 10px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  avantMissionCollapsed = false;
  pendantMissionCollapsed = false;
  finMissionCollapsed = false;
  allGroupsExpanded = true;

  groupedData: GroupData[] = [];
  paginatedData: GroupData[] = [];
  currentPage = 1;
  itemsPerPage = 50;
  totalMissions = 0;
  totalPages = 0;
  startIndex = 0;
  endIndex = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeDataFromRealData();
    this.updatePagination();
  }

  initializeDataFromRealData(): void {
    const realData: MissionData[] = [
      {
        "numeroGroupe": "114629",
        "nomGroupe": "Bpifrance Investissement",
        "numeroClient": "436284",
        "nomClient": "Bpifrance Capital Régions 3",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "114629",
        "nomGroupe": "Bpifrance Investissement",
        "numeroClient": "436296",
        "nomClient": "BPIFRANCE DIGITAL VENTURE 3",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "114629",
        "nomGroupe": "Bpifrance Investissement",
        "numeroClient": "436298",
        "nomClient": "FRENCH TOUCH CAPITAL 1",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "114629",
        "nomGroupe": "Bpifrance Investissement",
        "numeroClient": "436367",
        "nomClient": "BPIFRANCE MID CAP EQUITY 3",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "114629",
        "nomGroupe": "Bpifrance Investissement",
        "numeroClient": "436388",
        "nomClient": "BPIFRANCE MID CAP FBI 3",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "114629",
        "nomGroupe": "Bpifrance Investissement",
        "numeroClient": "436506",
        "nomClient": "BPIFRANCE INNOVATION 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "411264",
        "nomClient": "QUALIUM INVESTISSEMENT ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "411264",
        "nomClient": "QUALIUM INVESTISSEMENT ",
        "mission": "Mission Spé",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "421637",
        "nomClient": "FPCI QUALIUM FUND",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "421638",
        "nomClient": "FPCI QUALIUM FUND II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "424878",
        "nomClient": "QUALIUM FUND III UP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "424879",
        "nomClient": "Qualium Fund III SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411264",
        "nomGroupe": "QUALIUM INVESTISSEMENT ",
        "numeroClient": "430978",
        "nomClient": "FPCI CO-INVEST QFIII - AMEXIO",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411488",
        "nomGroupe": "MONTAGU V FPCI",
        "numeroClient": "411488",
        "nomClient": "MONTAGU V FPCI",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411488",
        "nomGroupe": "MONTAGU V FPCI",
        "numeroClient": "414955",
        "nomClient": "MONTAGU IV FPCI",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "411488",
        "nomGroupe": "MONTAGU V FPCI",
        "numeroClient": "423108",
        "nomClient": "MONTAGU VI FPCI",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "415436",
        "nomClient": "Meanings Capital Partners",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "415436",
        "nomClient": "Meanings Capital Partners",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "415436",
        "nomClient": "Meanings Capital Partners",
        "mission": "Mission Spé",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "418215",
        "nomClient": "HOLDING MCP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "418216",
        "nomClient": "MANCO MCP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "425698",
        "nomClient": "FPS OCTAVE 1",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "425699",
        "nomClient": "FPS OCTAVE 2 - Compartiment 1",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "426892",
        "nomClient": "EXCLUSIVE REAL ESTATE III",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "427249",
        "nomClient": "MEANINGS PRIVATE EQUITY FUND IV SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "428024",
        "nomClient": "FPS NEUILLY",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "428562",
        "nomClient": "MEANINGS PRIVATE EQUITY FUND IV GP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "428696",
        "nomClient": "MEANINGS REAL ESTATE FUND GP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "428697",
        "nomClient": "MPEG HOLDING ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "430229",
        "nomClient": "MEANINGS PRIVATE EQUITY FUND YODA ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "430417",
        "nomClient": "MPEF IV HOLDING",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "434572",
        "nomClient": "Meanings Infrastructure Fund SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "436548",
        "nomClient": "FPS OCTAVE 2 - Compartiment 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "436871",
        "nomClient": "Meanings Private Equity Feeder Fund",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "415436",
        "nomGroupe": "MEANINGS CAPITAL PARTNERS",
        "numeroClient": "437362",
        "nomClient": "WOOD",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "416423",
        "nomGroupe": "Eurazeo Global Investor ",
        "numeroClient": "416423",
        "nomClient": "Eurazeo Global Investor ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "416571",
        "nomGroupe": "FPCI IBIONEXT GROWTH FUND",
        "numeroClient": "416571",
        "nomClient": "FPCI IBIONEXT GROWTH FUND",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "418585",
        "nomClient": "I&P",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "418585",
        "nomClient": "I&P",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "418585",
        "nomClient": "I&P",
        "mission": "Mission Spé",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "418675",
        "nomClient": "I&P ENTREPRENEURS & DEVELOPPEMENT",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "420829",
        "nomClient": "I&P Conseil",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "420829",
        "nomClient": "I&P Conseil",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "436949",
        "nomClient": "I&P ASSOCIES",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "418585",
        "nomGroupe": "I&P",
        "numeroClient": "436951",
        "nomClient": "I&P GROUPE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "419003",
        "nomClient": "21 INVEST FRANCE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "419003",
        "nomClient": "21 INVEST FRANCE",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431381",
        "nomClient": "FPCI 21 CENTRALE PARTNERS IV",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431382",
        "nomClient": "FPCI 21 CENTRALE PARTNERS IV AV",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431383",
        "nomClient": "FPCI 21 CENTRALE PARTNERS V",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431384",
        "nomClient": "FPCI 21 INVEST FRANCE VI",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431385",
        "nomClient": "FPCI 21 PEP Fund",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431391",
        "nomClient": "FPCI 21 PEP FUND II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431392",
        "nomClient": "FPCI 21 PEP FUND III",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431393",
        "nomClient": "FPCI 21 VOLTAIRE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431394",
        "nomClient": "FPCI 21 SYNERLAB",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431397",
        "nomClient": "FPCI 21 PHOENIX",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "431401",
        "nomClient": "FPCI 21 CONEX",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "433133",
        "nomClient": "21 RHODIUM",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "434113",
        "nomClient": "21 ROCAMED",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419003",
        "nomGroupe": "21 INVEST FRANCE",
        "numeroClient": "434545",
        "nomClient": "FPCI 21 DONORA",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419907",
        "nomGroupe": "EQT PARTNERS SAS",
        "numeroClient": "419907",
        "nomClient": "EQT PARTNERS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "419907",
        "nomGroupe": "EQT PARTNERS SAS",
        "numeroClient": "419907",
        "nomClient": "EQT PARTNERS",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "425922",
        "nomGroupe": "MARK PARIS URBAN REGENERATION SLP",
        "numeroClient": "425922",
        "nomClient": "MARK PARIS URBAN REGENERATION GP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "425922",
        "nomGroupe": "MARK PARIS URBAN REGENERATION SLP",
        "numeroClient": "426966",
        "nomClient": "MARK PARIS URBAN REGENERATION SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "425922",
        "nomGroupe": "MARK PARIS URBAN REGENERATION SLP",
        "numeroClient": "426966",
        "nomClient": "MARK PARIS URBAN REGENERATION SLP",
        "mission": "Mission Spé",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "427344",
        "nomClient": "ARMEN",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "427344",
        "nomClient": "ARMEN",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "427984",
        "nomClient": "ARMEN PARTNERS LIMITED UK",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "428251",
        "nomClient": "ARMEN GP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "429557",
        "nomClient": "ARMEN GP STAKES FUND I - Comp 1",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "429558",
        "nomClient": "ARMEN GP STAKES FUND I CO-INVE TEAM",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "429559",
        "nomClient": "ARMEN INVEST",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "429718",
        "nomClient": "ARMEN TEAM",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "429721",
        "nomClient": "ARMEN FO",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "431369",
        "nomClient": "ARMEN SAS GERMAN BRANCH ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "431812",
        "nomClient": "ARMEN GP STAKES FUND I - Comp 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "432502",
        "nomClient": "ARMEN US, LLC",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "432503",
        "nomClient": "ARMEN (ASIA) PTE LTD",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "436035",
        "nomClient": "ARMEN GP STAKES FUND I CO INVEST I ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "427344",
        "nomGroupe": "ARMEN",
        "numeroClient": "437108",
        "nomClient": "ARMEN GP STAKES PARTICIPATIONS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "430487",
        "nomGroupe": "FRANCE INVEST",
        "numeroClient": "430487",
        "nomClient": "FRANCE INVEST",
        "mission": "Mission Spé",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431223",
        "nomClient": "SMALT CAPITAL",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431224",
        "nomClient": "FCPR ALTERMED - Compartiment APEF",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431226",
        "nomClient": "FPCR ECO RESPONSABLE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431227",
        "nomClient": "FIP NEOVERIS AVENIR ECONOMIE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431231",
        "nomClient": "FIP NEOVERIS CORSE 2014",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431232",
        "nomClient": "FIP NEOVERIS CORSE 2015",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431233",
        "nomClient": "FIP NEOVERIS CORSE 2016",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431234",
        "nomClient": "FIP NEOVERIS CORSE 2017",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431235",
        "nomClient": "FIP NEOVERIS CORSE 2018",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431236",
        "nomClient": "FIP NEOVERIS CORSE 2019",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431237",
        "nomClient": "FIP NEOVERIS CORSE 2020",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431238",
        "nomClient": "FIP NEOVERIS FRANCE CROISSANCE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431239",
        "nomClient": "FIP OCEANIS 2017",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431241",
        "nomClient": "FPS RUN CROISSANCE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431242",
        "nomClient": "FPS RUN DEVELOPPEMENT",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431243",
        "nomClient": "FPCI RUNaissance",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431247",
        "nomClient": "SLP SMALT ENR",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431248",
        "nomClient": "FPCI SUD HORIZON",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "431249",
        "nomClient": "FCPR ENERGREEN",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431223",
        "nomGroupe": "SMALT CAPITAL",
        "numeroClient": "434173",
        "nomClient": "SMALT HORIZON 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "430235",
        "nomClient": "VIVALTO SANTE CO-INVEST C SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "430674",
        "nomClient": "FPCI Vivapharma Co-Invest",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "431502",
        "nomClient": "VIVALTO PARTNERS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "431551",
        "nomClient": "FPCI FINANCIERE VIVALDI CO-INVEST",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "434071",
        "nomClient": "VIVALTO CAPITAL I GP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "434566",
        "nomClient": "VIVALTO SANTE CO-INVEST",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "434567",
        "nomClient": "VIVALTO SANTE CO-INVEST B",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "434568",
        "nomClient": "VIVALTO CAPITAL INVESTOR I",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "434569",
        "nomClient": "VIVALTO SANTE SUB-FUND",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "434571",
        "nomClient": "VIVALTO CAPITAL I PARTNERS ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "431502",
        "nomGroupe": "VIVALTO PARTNERS",
        "numeroClient": "436468",
        "nomClient": "VIVALTO VIE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432049",
        "nomGroupe": "QUADRILLE CAPITAL",
        "numeroClient": "436507",
        "nomClient": "QUADRILLE SECONDARY IIII SLP ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432049",
        "nomGroupe": "QUADRILLE CAPITAL",
        "numeroClient": "436508",
        "nomClient": "Quadrille Secondary II SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432049",
        "nomGroupe": "QUADRILLE CAPITAL",
        "numeroClient": "436509",
        "nomClient": "Quadrille Technologies III - Comp 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432051",
        "nomGroupe": "GENEO CAPITAL ENTREPRENEUR",
        "numeroClient": "432261",
        "nomClient": "SCR GENEO CAPITAL",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432051",
        "nomGroupe": "GENEO CAPITAL ENTREPRENEUR",
        "numeroClient": "432265",
        "nomClient": "GENEO MEZZANINE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "432067",
        "nomClient": "NOTEUS PARTNERS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "432067",
        "nomClient": "NOTEUS PARTNERS",
        "mission": "Mission Paie",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "432407",
        "nomClient": "NOTEUS HOLDING UK LIMITED",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "432408",
        "nomClient": "NOTEUS PARTNERS UK LLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "432484",
        "nomClient": "NOTEUS GERMAN BRANCH",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "434002",
        "nomClient": "NOTEUS PARTNERS CENTAUR GP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "434003",
        "nomClient": "NOTEUS PARTNERS CENTAUR SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "432067",
        "nomGroupe": "NOTEUS PARTNERS",
        "numeroClient": "436474",
        "nomClient": "NOTEUS SPANISH BRANCH",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "433591",
        "nomGroupe": "SAMBA CAPITAL",
        "numeroClient": "425835",
        "nomClient": "AMS CAPITAL",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "433591",
        "nomGroupe": "SAMBA CAPITAL",
        "numeroClient": "433591",
        "nomClient": "SAMBA CAPITAL",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "433591",
        "nomGroupe": "SAMBA CAPITAL",
        "numeroClient": "433669",
        "nomClient": "AMS CAPITAL II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "433591",
        "nomGroupe": "SAMBA CAPITAL",
        "numeroClient": "436948",
        "nomClient": "MARBATIN",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "434083",
        "nomGroupe": "HATTIGNY LOISIRS HOLDING",
        "numeroClient": "129336",
        "nomClient": "BOIS DES HARCHOLINS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "434083",
        "nomGroupe": "HATTIGNY LOISIRS HOLDING",
        "numeroClient": "434083",
        "nomClient": "HATTIGNY LOISIRS HOLDING",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "434083",
        "nomGroupe": "HATTIGNY LOISIRS HOLDING",
        "numeroClient": "434083",
        "nomClient": "HATTIGNY LOISIRS HOLDING",
        "mission": "Mission Spé",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436215",
        "nomClient": "ARCHIMED SAS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436513",
        "nomClient": "MED ACCESS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436514",
        "nomClient": "MED VET",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436549",
        "nomClient": "SLP MED III A",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436552",
        "nomClient": "SLP MED III B",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436954",
        "nomClient": "MED II S.L.P.",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436955",
        "nomClient": "MED PLATFORM I – COMPARTMENT 1",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436956",
        "nomClient": "MED PLATFORM I – COMPARTMENT 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436957",
        "nomClient": "MED PLATFORM I – COMPARTMENT 3",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436958",
        "nomClient": "MED PLATFORM I - B SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436959",
        "nomClient": "MED BIO",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436961",
        "nomClient": "MPI-COI-CARSO SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436962",
        "nomClient": "MPI-COI-NAMSA SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436963",
        "nomClient": "MPI COI PROLLENIUM SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "436215",
        "nomGroupe": "ARCHIMED SAS",
        "numeroClient": "436964",
        "nomClient": "MPI COI SUAN SLP",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437014",
        "nomGroupe": "FPCI INDIGO CAPITAL",
        "numeroClient": "437014",
        "nomClient": "FPCI INDIGO CAPITAL",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437014",
        "nomGroupe": "FPCI INDIGO CAPITAL",
        "numeroClient": "437015",
        "nomClient": "FPCI INDIGO CAPITAL K",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437014",
        "nomGroupe": "FPCI INDIGO CAPITAL",
        "numeroClient": "437016",
        "nomClient": "FPCI INDIGO CAPITAL II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437014",
        "nomGroupe": "FPCI INDIGO CAPITAL",
        "numeroClient": "437018",
        "nomClient": "FPCI AZUR ",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437014",
        "nomGroupe": "FPCI INDIGO CAPITAL",
        "numeroClient": "437021",
        "nomClient": "FPCI-IC SRWK",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437014",
        "nomGroupe": "FPCI INDIGO CAPITAL",
        "numeroClient": "437022",
        "nomClient": "SLP INDIGO CAPITAL III",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437063",
        "nomClient": "ELEVATION CAPITAL PARTNERS",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437064",
        "nomClient": "FPCI ELEVATION GRAVITY",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437065",
        "nomClient": "FPCI Elevation Early Growth",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437067",
        "nomClient": "FPCI Elevation Early Growth II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437068",
        "nomClient": "FPCI Elevation Growth",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437069",
        "nomClient": "FPCI Food Invest",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437071",
        "nomClient": "FIP Inter Invest Outre-Mer 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437072",
        "nomClient": "FIP Inter Invest Outre-Mer 3",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437073",
        "nomClient": "FIP Inter Invest Outre-Mer 4",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437075",
        "nomClient": "FIP Inter Invest Outre-Mer 5",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437076",
        "nomClient": "FPCI CAOMIE",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437077",
        "nomClient": "FPCI Elevation Miriad",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437081",
        "nomClient": "FPCI Elevation Miriad 2",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437083",
        "nomClient": "FPCI Elevation Varsity Feeder Fund",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437084",
        "nomClient": "FPCI Elevation Secondary",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437085",
        "nomClient": "FCPR Elevation Immo",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437087",
        "nomClient": "FCPR Elevation Immo II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437088",
        "nomClient": "FPCI Elevation Immo Remploi",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437089",
        "nomClient": "FPCI Food Invest II",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      },
      {
        "numeroGroupe": "437063",
        "nomGroupe": "ELEVATION CAPITAL PARTNERS",
        "numeroClient": "437383",
        "nomClient": "FIP OUTRE-MER INTER INVEST N°1",
        "mission": "Mission EC",
        "avantMission": {
          "percentage": 75,
          "lab": true,
          "conflitCheck": true,
          "qac": true,
          "qam": false,
          "ldm": false
        },
        "pendantMission": {
          "percentage": 25,
          "nog": true,
          "checklist": false,
          "revision": false,
          "supervision": false
        },
        "finMission": {
          "percentage": 0,
          "ndsCr": false,
          "qmm": false,
          "plaquette": false,
          "restitution": false
        }
      }
    ];

    console.log('Données réelles chargées:', realData);

    // Grouper d'abord par numeroGroupe, puis par numeroClient (exactement comme avant)
    const groupedByGroupe = realData.reduce((acc, mission) => {
      const groupKey = mission.numeroGroupe;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          numeroGroupe: mission.numeroGroupe,
          nomGroupe: mission.nomGroupe,
          missions: []
        };
      }
      acc[groupKey].missions.push(mission);
      return acc;
    }, {} as { [key: string]: { numeroGroupe: string; nomGroupe: string; missions: MissionData[] } });

    // Créer la structure finale avec double groupement
    this.groupedData = Object.values(groupedByGroupe).map(group => {
      // Grouper les missions par numeroClient
      const clientGroups = group.missions.reduce((acc, mission) => {
        const clientKey = mission.numeroClient;
        if (!acc[clientKey]) {
          acc[clientKey] = {
            numeroClient: mission.numeroClient,
            nomClient: mission.nomClient,
            missions: [],
            expanded: true
          };
        }
        acc[clientKey].missions.push(mission);
        return acc;
      }, {} as { [key: string]: ClientGroup });

      return {
        numeroGroupe: group.numeroGroupe,
        nomGroupe: group.nomGroupe,
        clients: Object.values(clientGroups),
        expanded: true
      };
    });

    this.totalMissions = this.groupedData.reduce((total, group) => 
      total + group.clients.reduce((clientTotal, client) => 
        clientTotal + client.missions.length, 0), 0);
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.groupedData.length / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(this.startIndex + this.itemsPerPage, this.groupedData.length);
    
    this.paginatedData = this.groupedData.slice(this.startIndex, this.endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  toggleColumnGroup(group: 'avantMission' | 'pendantMission' | 'finMission'): void {
    switch (group) {
      case 'avantMission':
        this.avantMissionCollapsed = !this.avantMissionCollapsed;
        break;
      case 'pendantMission':
        this.pendantMissionCollapsed = !this.pendantMissionCollapsed;
        break;
      case 'finMission':
        this.finMissionCollapsed = !this.finMissionCollapsed;
        break;
    }
  }

  toggleMainGroup(index: number): void {
    this.paginatedData[index].expanded = !this.paginatedData[index].expanded;
    
    // Quand on ouvre/ferme le groupe, synchroniser tous les clients avec l'état du groupe
    this.paginatedData[index].clients.forEach(client => {
      client.expanded = this.paginatedData[index].expanded;
    });
  }

  toggleClientGroup(groupIndex: number, clientIndex: number): void {
    this.paginatedData[groupIndex].clients[clientIndex].expanded = 
      !this.paginatedData[groupIndex].clients[clientIndex].expanded;
  }

  toggleAllGroups(): void {
    this.allGroupsExpanded = !this.allGroupsExpanded;
    this.paginatedData.forEach(group => {
      group.expanded = this.allGroupsExpanded;
      group.clients.forEach(client => {
        client.expanded = this.allGroupsExpanded;
      });
    });
  }

  getTotalMissionsInGroup(group: GroupData): number {
    return group.clients.reduce((total, client) => total + client.missions.length, 0);
  }

  getMainGroupAverage(group: GroupData): number {
    const allMissions = group.clients.flatMap(client => client.missions);
    if (allMissions.length === 0) return 0;
    
    const total = allMissions.reduce((sum, mission) => {
      const avg = (mission.avantMission.percentage + mission.pendantMission.percentage + mission.finMission.percentage) / 3;
      return sum + avg;
    }, 0);
    
    return Math.round(total / allMissions.length);
  }

  getClientAverage(client: ClientGroup, phase: 'avantMission' | 'pendantMission' | 'finMission'): number {
    if (client.missions.length === 0) return 0;
    
    const total = client.missions.reduce((sum, mission) => {
      return sum + mission[phase].percentage;
    }, 0);
    
    return Math.round(total / client.missions.length);
  }
}