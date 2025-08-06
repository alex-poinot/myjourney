import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatCheckboxModule
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
            <mat-checkbox 
              *ngFor="let group of columnGroups" 
              [(ngModel)]="group.visible"
              (change)="updateDisplayedColumns()">
              {{ group.name }}
            </mat-checkbox>
          </div>
        </div>
      </div>

      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Missions ({{ getTotalMissions() }} au total, {{ groupedData.length }} groupes)</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="flatDataSource" matSort class="mission-table">
              
              <!-- Colonne Information -->
              <ng-container matColumnDef="groupExpander">
                <th mat-header-cell *matHeaderCellDef class="expander-header">Groupe</th>
                <td mat-cell *matCellDef="let mission" class="expander-cell">
                  <button 
                    *ngIf="mission.isGroupHeader"
                    mat-icon-button
                    (click)="toggleGroup(mission.groupKey)"
                    class="group-toggle">
                    <mat-icon>{{ getGroupExpanded(mission.groupKey) ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </button>
                </td>
              </ng-container>

              <ng-container matColumnDef="numeroGroupe">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="info-header">N° Groupe</th>
                <td mat-cell *matCellDef="let mission" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="mission.isGroupHeader" class="group-header-text">{{ mission.numeroGroupe }}</span>
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.numeroGroupe }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="nomGroupe">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="info-header">Nom Groupe</th>
                <td mat-cell *matCellDef="let mission" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="mission.isGroupHeader" class="group-header-text">{{ mission.nomGroupe }} ({{ getGroupMissionCount(mission.groupKey) }} missions)</span>
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.nomGroupe }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="numeroClient">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="info-header">N° Client</th>
                <td mat-cell *matCellDef="let mission" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.numeroClient }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="nomClient">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="info-header">Nom Client</th>
                <td mat-cell *matCellDef="let mission" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.nomClient }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="mission">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="info-header">Mission</th>
                <td mat-cell *matCellDef="let mission" [class.group-header]="mission.isGroupHeader" [class.mission-row]="!mission.isGroupHeader">
                  <span *ngIf="!mission.isGroupHeader" class="mission-indent">{{ mission.mission }}</span>
                </td>
              </ng-container>

              <!-- Colonnes Avant Mission -->
              <ng-container matColumnDef="avantMissionProgress">
                <th mat-header-cell *matHeaderCellDef class="avant-mission-header">Avant Mission (%)</th>
                <td mat-cell *matCellDef="let mission" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle" [attr.data-percentage]="mission.avantMission.percentage">
                    {{ mission.avantMission.percentage }}%
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="avantMissionTasks">
                <th mat-header-cell *matHeaderCellDef class="avant-mission-header">Tâches</th>
                <td mat-cell *matCellDef="let mission" class="tasks-cell" [class.group-header]="mission.isGroupHeader">
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
              </ng-container>

              <!-- Colonnes Pendant Mission -->
              <ng-container matColumnDef="pendantMissionProgress">
                <th mat-header-cell *matHeaderCellDef class="pendant-mission-header">Pendant Mission (%)</th>
                <td mat-cell *matCellDef="let mission" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle" [attr.data-percentage]="mission.pendantMission.percentage">
                    {{ mission.pendantMission.percentage }}%
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="pendantMissionTasks">
                <th mat-header-cell *matHeaderCellDef class="pendant-mission-header">Tâches</th>
                <td mat-cell *matCellDef="let mission" class="tasks-cell" [class.group-header]="mission.isGroupHeader">
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
              </ng-container>

              <!-- Colonnes Fin Mission -->
              <ng-container matColumnDef="finMissionProgress">
                <th mat-header-cell *matHeaderCellDef class="fin-mission-header">Fin Mission (%)</th>
                <td mat-cell *matCellDef="let mission" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle" [attr.data-percentage]="mission.finMission.percentage">
                    {{ mission.finMission.percentage }}%
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="finMissionTasks">
                <th mat-header-cell *matHeaderCellDef class="fin-mission-header">Tâches</th>
                <td mat-cell *matCellDef="let mission" class="tasks-cell" [class.group-header]="mission.isGroupHeader">
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
              </ng-container>

              <!-- Colonne Progrès Global -->
              <ng-container matColumnDef="overallProgress">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="overall-header">Progrès Global</th>
                <td mat-cell *matCellDef="let mission" class="percentage-cell" [class.group-header]="mission.isGroupHeader">
                  <div *ngIf="!mission.isGroupHeader" class="progress-circle large" [attr.data-percentage]="mission.overallProgress">
                    {{ mission.overallProgress }}%
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  [class.group-header-row]="row.isGroupHeader"
                  [class.mission-data-row]="!row.isGroupHeader"></tr>
            </table>
          </div>

          <mat-paginator 
            [pageSizeOptions]="[25, 50, 100]" 
            [pageSize]="50"
            showFirstLastButtons
            aria-label="Sélectionner la page des missions">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      background: #f8fafc;
      height: calc(100vh - 80px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dashboard-header {
      margin-bottom: 24px;
      flex-shrink: 0;
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

    .table-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .table-card mat-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0 !important;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
    }

    .mission-table {
      width: 100%;
      background: white;
    }

    /* Expander column */
    .expander-header {
      background: var(--gray-800) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      width: 60px !important;
      border-right: 1px solid rgba(255,255,255,0.2) !important;
    }

    .expander-cell {
      width: 60px !important;
      text-align: center !important;
      padding: 8px !important;
    }

    .group-toggle {
      color: var(--primary-color);
    }

    /* Headers avec couleurs par section */
    .info-header {
      background: var(--primary-dark) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(255,255,255,0.2) !important;
    }

    .avant-mission-header {
      background: var(--primary-color) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(255,255,255,0.2) !important;
    }

    .pendant-mission-header {
      background: var(--secondary-color) !important;
      color: var(--primary-color) !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(34, 109, 104, 0.2) !important;
    }

    .fin-mission-header {
      background: var(--primary-color) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
      border-right: 1px solid rgba(255,255,255,0.2) !important;
    }

    .overall-header {
      background: var(--primary-dark) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 16px 12px !important;
    }

    /* Cellules du tableau */
    .mat-mdc-cell {
      padding: 12px !important;
      border-bottom: 1px solid var(--gray-100) !important;
      font-size: 14px !important;
    }

    .mission-data-row:hover {
      background: var(--gray-50) !important;
    }

    /* Styles pour les groupes */
    .group-header-row {
      background: var(--primary-light) !important;
      font-weight: 600 !important;
    }

    .group-header-row:hover {
      background: rgba(100, 206, 199, 0.3) !important;
    }

    .group-header {
      background: var(--primary-light) !important;
      font-weight: 600 !important;
      color: var(--primary-dark) !important;
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
      text-align: center !important;
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
      text-align: center !important;
      padding: 8px !important;
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
    mat-paginator {
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
      
      .mat-mdc-cell {
        padding: 8px !important;
        font-size: 12px !important;
      }
      
      .info-header,
      .avant-mission-header,
      .pendant-mission-header,
      .fin-mission-header,
      .overall-header {
        padding: 12px 8px !important;
        font-size: 12px !important;
      }

      .column-toggles {
        flex-direction: column;
        gap: 8px;
      }
    }

    /* Sticky header */
    .mat-mdc-header-row {
      position: sticky;
      top: 0;
      z-index: 10;
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

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<FlatMissionData>();
  flatDataSource = new MatTableDataSource<any>();
  groupedData: GroupedMissionData[] = [];
  expandedGroups: Set<string> = new Set();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.updateDisplayedColumns();
    this.initializeDataFromApi();
  }

  ngAfterViewInit(): void {
    this.flatDataSource.paginator = this.paginator;
    this.flatDataSource.sort = this.sort;
  }

  updateDisplayedColumns(): void {
    this.displayedColumns = [];
    this.columnGroups.forEach(group => {
      if (group.visible) {
        this.displayedColumns.push(...group.columns);
      }
    });
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

    this.dataSource.data = flatData;
    this.createGroupedData(flatData);
    this.updateFlatDataSource();
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

  private updateFlatDataSource(): void {
    const flatData: any[] = [];
    
    this.groupedData.forEach(group => {
      // Add group header
      const groupHeader = {
        ...group.missions[0],
        isGroupHeader: true,
        groupKey: group.groupKey
      };
      flatData.push(groupHeader);
      
      // Add missions if group is expanded
      if (group.expanded) {
        group.missions.forEach(mission => {
          flatData.push({
            ...mission,
            isGroupHeader: false,
            groupKey: group.groupKey
          });
        });
      }
    });
    
    this.flatDataSource.data = flatData;
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
    
    this.updateFlatDataSource();
  }

  getGroupExpanded(groupKey: string): boolean {
    return this.expandedGroups.has(groupKey);
  }

  getGroupMissionCount(groupKey: string): number {
    const group = this.groupedData.find(g => g.groupKey === groupKey);
    return group ? group.missions.length : 0;
  }

  getTotalMissions(): number {
    return this.dataSource.data.length;
  }

  private getTasksSummary(phase: any): string {
    const tasks = Object.keys(phase).filter(key => key !== 'percentage');
    const completedTasks = tasks.filter(task => phase[task]).length;
    return `${completedTasks}/${tasks.length}`;
  }
}