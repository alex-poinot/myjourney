import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

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

interface FlatMissionData extends MissionData {
  // Propriétés calculées pour l'affichage
  avantMissionTasks: string;
  pendantMissionTasks: string;
  finMissionTasks: string;
  overallProgress: number;
}

interface GroupedMissionData {
  groupKey: string;
  groupName: string;
  missions: FlatMissionData[];
  expanded: boolean;
}

interface ColumnGroup {
  name: string;
  columns: string[];
  visible: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule,
    FormsModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Tableau de bord des missions</h1>
        <p>Vue d'ensemble de l'avancement de toutes les missions</p>
        
        <!-- Contrôles de colonnes -->
        <div class="column-controls">
          <h3>Affichage des colonnes :</h3>
          <div class="column-toggles">
            <label 
              *ngFor="let group of columnGroups" 
              class="column-toggle">
              <input 
                type="checkbox"
                [(ngModel)]="group.visible"
                (change)="updateDisplayedColumns()">
              {{ group.name }}
            </label>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h2>Missions ({{ getTotalMissions() }} au total, {{ groupedData.length }} groupes)</h2>
        </div>
        
        <div class="table-container">
          <table class="mission-table">
            <thead>
              <tr>
                <!-- Colonne Information -->
                <th *ngIf="isColumnVisible('groupExpander')" class="expander-header">Groupe</th>
                <th *ngIf="isColumnVisible('numeroGroupe')" class="info-header">N° Groupe</th>
                <th *ngIf="isColumnVisible('nomGroupe')" class="info-header">Nom Groupe</th>
                <th *ngIf="isColumnVisible('numeroClient')" class="info-header">N° Client</th>
                <th *ngIf="isColumnVisible('nomClient')" class="info-header">Nom Client</th>
                <th *ngIf="isColumnVisible('mission')" class="info-header">Mission</th>

                <!-- Colonnes Avant Mission -->
                <th *ngIf="isColumnVisible('avantMissionProgress')" class="avant-mission-header">Avant Mission (%)</th>
                <th *ngIf="isColumnVisible('avantMissionTasks')" class="avant-mission-header">Tâches</th>

                <!-- Colonnes Pendant Mission -->
                <th *ngIf="isColumnVisible('pendantMissionProgress')" class="pendant-mission-header">Pendant Mission (%)</th>
                <th *ngIf="isColumnVisible('pendantMissionTasks')" class="pendant-mission-header">Tâches</th>

                <!-- Colonnes Fin Mission -->
                <th *ngIf="isColumnVisible('finMissionProgress')" class="fin-mission-header">Fin Mission (%)</th>
                <th *ngIf="isColumnVisible('finMissionTasks')" class="fin-mission-header">Tâches</th>

                <!-- Colonne Progrès Global -->
                <th *ngIf="isColumnVisible('overallProgress')" class="overall-header">Progrès Global</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let mission of paginatedData" 
                  [class.group-header-row]="mission.isGroupHeader"
                  [class.mission-data-row]="!mission.isGroupHeader">
                
                <td *ngIf="isColumnVisible('groupExpander')" class="expander-cell">
                  <button 
                    *ngIf="mission.isGroupHeader"
                    (click)="toggleGroup(mission.groupKey)"
                    class="group-toggle">
                    {{ getGroupExpanded(mission.groupKey) ? '▲' : '▼' }}
                  </button>
                </td>

                <td *ngIf="isColumnVisible('numeroGroupe')" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="mission.isGroupHeader" class="group-header-text">{{ mission.numeroGroupe }}</span>
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.numeroGroupe }}</span>
                </td>

                <td *ngIf="isColumnVisible('nomGroupe')" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="mission.isGroupHeader" class="group-header-text">{{ mission.nomGroupe }} ({{ getGroupMissionCount(mission.groupKey) }} missions)</span>
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.nomGroupe }}</span>
                </td>

                <td *ngIf="isColumnVisible('numeroClient')" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.numeroClient }}</span>
                </td>

                <td *ngIf="isColumnVisible('nomClient')" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.nomClient }}</span>
                </td>

                <td *ngIf="isColumnVisible('mission')" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.mission }}</span>
                </td>

                <!-- Colonnes Avant Mission -->
                <td *ngIf="isColumnVisible('avantMissionProgress')" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle" [attr.data-percentage]="mission.avantMission.percentage">
                    {{ mission.avantMission.percentage }}%
                  </div>
                </td>

                <td *ngIf="isColumnVisible('avantMissionTasks')" class="tasks-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="task-icons">
                    <span class="task-icon" [class.completed]="mission.avantMission.lab" title="LAB">
                      {{ mission.avantMission.lab ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.avantMission.conflitCheck" title="Conflit Check">
                      {{ mission.avantMission.conflitCheck ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.avantMission.qac" title="QAC">
                      {{ mission.avantMission.qac ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.avantMission.qam" title="QAM">
                      {{ mission.avantMission.qam ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.avantMission.ldm" title="LDM">
                      {{ mission.avantMission.ldm ? '✅' : '⏳' }}
                    </span>
                  </div>
                </td>

                <!-- Colonnes Pendant Mission -->
                <td *ngIf="isColumnVisible('pendantMissionProgress')" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle" [attr.data-percentage]="mission.pendantMission.percentage">
                    {{ mission.pendantMission.percentage }}%
                  </div>
                </td>

                <td *ngIf="isColumnVisible('pendantMissionTasks')" class="tasks-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="task-icons">
                    <span class="task-icon" [class.completed]="mission.pendantMission.nog" title="NOG">
                      {{ mission.pendantMission.nog ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.pendantMission.checklist" title="Checklist">
                      {{ mission.pendantMission.checklist ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.pendantMission.revision" title="Révision">
                      {{ mission.pendantMission.revision ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.pendantMission.supervision" title="Supervision">
                      {{ mission.pendantMission.supervision ? '✅' : '⏳' }}
                    </span>
                  </div>
                </td>

                <!-- Colonnes Fin Mission -->
                <td *ngIf="isColumnVisible('finMissionProgress')" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle" [attr.data-percentage]="mission.finMission.percentage">
                    {{ mission.finMission.percentage }}%
                  </div>
                </td>

                <td *ngIf="isColumnVisible('finMissionTasks')" class="tasks-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="task-icons">
                    <span class="task-icon" [class.completed]="mission.finMission.ndsCr" title="NDS/CR">
                      {{ mission.finMission.ndsCr ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.finMission.qmm" title="QMM">
                      {{ mission.finMission.qmm ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.finMission.plaquette" title="Plaquette">
                      {{ mission.finMission.plaquette ? '✅' : '⏳' }}
                    </span>
                    <span class="task-icon" [class.completed]="mission.finMission.restitution" title="Restitution">
                      {{ mission.finMission.restitution ? '✅' : '⏳' }}
                    </span>
                  </div>
                </td>

                <!-- Colonne Progrès Global -->
                <td *ngIf="isColumnVisible('overallProgress')" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle large" [attr.data-percentage]="mission.overallProgress">
                    {{ mission.overallProgress }}%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <mat-paginator 
          [length]="flatData.length"
          [pageSize]="pageSize"
          [pageSizeOptions]="[25, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons
          aria-label="Sélectionner la page des missions">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      background: #f8fafc;
      min-height: calc(100vh - 80px);
    }

    .dashboard-header {
      margin-bottom: 24px;
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

    .column-controls {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--gray-200);
      margin-bottom: 16px;
    }

    .column-controls h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: var(--gray-700);
    }

    .column-toggles {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .column-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: var(--gray-700);
    }

    .column-toggle input[type="checkbox"] {
      margin: 0;
    }

    .table-card {
      background: white;
      border-radius: 8px;
      border: 1px solid var(--gray-200);
      box-shadow: var(--shadow-sm);
    }

    .table-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--gray-200);
      background: var(--gray-50);
      border-radius: 8px 8px 0 0;
    }

    .table-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-800);
    }

    .table-container {
      overflow: auto;
      max-height: 600px;
    }

    .mission-table {
      width: 100%;
      background: white;
      border-collapse: collapse;
    }

    .mission-table th,
    .mission-table td {
      padding: 12px;
      border-bottom: 1px solid var(--gray-100);
      font-size: 14px;
      text-align: left;
    }

    /* Headers avec couleurs par section */
    .expander-header {
      background: var(--gray-800) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      width: 60px !important;
      border-right: 1px solid rgba(255,255,255,0.2);
    }

    .expander-cell {
      width: 60px !important;
      text-align: center !important;
      padding: 8px !important;
    }

    .group-toggle {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .group-toggle:hover {
      background: rgba(34, 109, 104, 0.1);
    }

    .info-header {
      background: var(--primary-dark) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(255,255,255,0.2);
    }

    .avant-mission-header {
      background: var(--primary-color) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(255,255,255,0.2);
    }

    .pendant-mission-header {
      background: var(--secondary-color) !important;
      color: var(--primary-color) !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(34, 109, 104, 0.2);
    }

    .fin-mission-header {
      background: var(--primary-color) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(255,255,255,0.2);
    }

    .overall-header {
      background: var(--primary-dark) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
    }

    .mission-data-row:hover {
      background: var(--gray-50);
    }

    /* Styles pour les groupes */
    .group-header-row {
      background: var(--primary-light);
      font-weight: 600;
    }

    .group-header-row:hover {
      background: rgba(100, 206, 199, 0.3);
    }

    .group-header {
      background: var(--primary-light);
      font-weight: 600;
      color: var(--primary-dark);
    }

    .group-header-text {
      font-weight: 700;
      font-size: 15px;
    }

    .mission-row {
      background: white;
    }

    .mission-indent {
      margin-left: 20px;
      font-size: 13px;
    }

    .percentage-cell {
      text-align: center;
      padding: 8px;
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

    .progress-circle.large {
      width: 50px;
      height: 50px;
      font-size: 12px;
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

    .tasks-cell {
      text-align: center;
      padding: 8px;
    }

    .task-icons {
      display: flex;
      justify-content: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .task-icon {
      font-size: 14px;
      display: inline-block;
      cursor: help;
    }

    /* Pagination */
    ::ng-deep mat-paginator {
      border-top: 1px solid var(--gray-200);
      background: var(--gray-50);
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .task-icons {
        flex-direction: column;
        gap: 2px;
      }
      
      .task-icon {
        font-size: 12px;
      }
      
      .progress-circle {
        width: 35px;
        height: 35px;
        font-size: 10px;
      }
    }

    @media (max-width: 1200px) {
      .dashboard-container {
        padding: 16px;
      }
      
      .mission-table th,
      .mission-table td {
        padding: 8px;
        font-size: 12px;
      }
      
      .info-header,
      .avant-mission-header,
      .pendant-mission-header,
      .fin-mission-header,
      .overall-header {
        padding: 12px 8px;
        font-size: 12px;
      }

      .column-toggles {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  columnGroups: ColumnGroup[] = [
    {
      name: 'Information',
      columns: ['groupExpander', 'numeroGroupe', 'nomGroupe', 'numeroClient', 'nomClient', 'mission'],
      visible: true
    },
    {
      name: 'Avant Mission',
      columns: ['avantMissionProgress', 'avantMissionTasks'],
      visible: true
    },
    {
      name: 'Pendant Mission',
      columns: ['pendantMissionProgress', 'pendantMissionTasks'],
      visible: true
    },
    {
      name: 'Fin Mission',
      columns: ['finMissionProgress', 'finMissionTasks'],
      visible: true
    },
    {
      name: 'Progrès Global',
      columns: ['overallProgress'],
      visible: true
    }
  ];

  flatData: any[] = [];
  paginatedData: any[] = [];
  groupedData: GroupedMissionData[] = [];
  expandedGroups: Set<string> = new Set();
  
  // Pagination
  currentPage = 0;
  pageSize = 50;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeDataFromApi();
  }

  updateDisplayedColumns(): void {
    this.updatePaginatedData();
  }

  initializeDataFromApi(): void {
    // Commenté temporairement l'appel API pour utiliser des données de test
    // this.http.get<{ success: boolean; data: MissionData[]; count: number; timestamp: string }>('http://localhost:3000/api/missions/getAllMissionsDashboard')
    //   .subscribe((response) => {
    //     let data = response.data;
    //     const missions: MissionData[] = data;
    //     console.log('Missions récupérées:', missions);
    //     this.processData(missions);
    //   }, (error) => {
    //     console.error('Erreur lors de la récupération des missions :', error);
    //   });

    // Utilisation des données de test
    const testData: MissionData[] = [
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
      }
    ];

    console.log('Missions de test utilisées:', testData);
    this.processData(testData);
  }

  private processData(missions: MissionData[]): void {
    const flatData: FlatMissionData[] = missions.map(mission => ({
      ...mission,
      avantMissionTasks: this.getTasksSummary(mission.avantMission),
      pendantMissionTasks: this.getTasksSummary(mission.pendantMission),
      finMissionTasks: this.getTasksSummary(mission.finMission),
      overallProgress: Math.round(
        (mission.avantMission.percentage + mission.pendantMission.percentage + mission.finMission.percentage) / 3
      )
    }));

    this.createGroupedData(flatData);
    this.updateFlatData();
    this.updatePaginatedData();
  }

  private createGroupedData(missions: FlatMissionData[]): void {
    const groups = new Map<string, FlatMissionData[]>();
    
    missions.forEach(mission => {
      const groupKey = `${mission.numeroGroupe}-${mission.nomGroupe}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(mission);
    });

    this.groupedData = Array.from(groups.entries()).map(([groupKey, groupMissions]) => ({
      groupKey,
      groupName: groupMissions[0].nomGroupe,
      missions: groupMissions,
      expanded: this.expandedGroups.has(groupKey)
    }));

    // Expand all groups by default
    this.groupedData.forEach(group => {
      this.expandedGroups.add(group.groupKey);
      group.expanded = true;
    });
  }

  private updateFlatData(): void {
    this.flatData = [];
    
    this.groupedData.forEach(group => {
      // Add group header
      const groupHeader = {
        ...group.missions[0],
        isGroupHeader: true,
        groupKey: group.groupKey
      };
      this.flatData.push(groupHeader);
      
      // Add missions if group is expanded
      if (group.expanded) {
        group.missions.forEach(mission => {
          this.flatData.push({
            ...mission,
            isGroupHeader: false,
            groupKey: group.groupKey
          });
        });
      }
    });
  }

  private updatePaginatedData(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.flatData.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  toggleGroup(groupKey: string): void {
    if (this.expandedGroups.has(groupKey)) {
      this.expandedGroups.delete(groupKey);
    } else {
      this.expandedGroups.add(groupKey);
    }
    
    // Update grouped data
    this.groupedData.forEach(group => {
      if (group.groupKey === groupKey) {
        group.expanded = this.expandedGroups.has(groupKey);
      }
    });
    
    this.updateFlatData();
    this.updatePaginatedData();
  }

  getGroupExpanded(groupKey: string): boolean {
    return this.expandedGroups.has(groupKey);
  }

  getGroupMissionCount(groupKey: string): number {
    const group = this.groupedData.find(g => g.groupKey === groupKey);
    return group ? group.missions.length : 0;
  }

  getTotalMissions(): number {
    return this.groupedData.reduce((total, group) => total + group.missions.length, 0);
  }

  isColumnVisible(columnName: string): boolean {
    return this.columnGroups.some(group => 
      group.visible && group.columns.includes(columnName)
    );
  }

  private getTasksSummary(phase: any): string {
    const tasks = Object.keys(phase).filter(key => key !== 'percentage');
    const completedTasks = tasks.filter(task => phase[task]).length;
    return `${completedTasks}/${tasks.length}`;
  }
}