import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Tableau de bord des missions</h1>
        <p>Vue d'ensemble de l'avancement de toutes les missions</p>
      </div>

      <div class="table-container">
        <table class="mission-table">
          <thead>
            <tr>
              <th rowspan="2" class="group-header">
                <button class="collapse-btn" (click)="toggleAllGroups()">
                  {{ allGroupsExpanded ? '▼' : '▶' }}
                </button>
              </th>
              <!-- Groupe Information -->
              <th colspan="5" class="column-group-header information">
                Information
              </th>
              <!-- Groupe Avant la mission -->
              <th colspan="{{ avantMissionCollapsed ? 1 : 6 }}" class="column-group-header avant-mission">
                <button class="collapse-btn" (click)="toggleColumnGroup('avantMission')">
                  {{ avantMissionCollapsed ? '▶' : '▼' }}
                </button>
                Avant la mission
              </th>
              <!-- Groupe Pendant la mission -->
              <th colspan="{{ pendantMissionCollapsed ? 1 : 5 }}" class="column-group-header pendant-mission">
                <button class="collapse-btn" (click)="toggleColumnGroup('pendantMission')">
                  {{ pendantMissionCollapsed ? '▶' : '▼' }}
                </button>
                Pendant la mission
              </th>
              <!-- Groupe Fin de mission -->
              <th colspan="{{ finMissionCollapsed ? 1 : 5 }}" class="column-group-header fin-mission">
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
            <ng-container *ngFor="let group of groupedMissions; let groupIndex = index">
              <!-- Ligne de groupe -->
              <tr class="group-row" (click)="toggleGroup(groupIndex)">
                <td class="group-cell">
                  <button class="collapse-btn">
                    {{ group.expanded ? '▼' : '▶' }}
                  </button>
                  <strong>{{ group.name }}</strong>
                </td>
                <td colspan="100%" class="group-summary">
                  {{ group.missions.length }} mission(s) - Avancement moyen: {{ getGroupAverage(group) }}%
                </td>
              </tr>
              
              <!-- Missions du groupe -->
              <tr *ngFor="let mission of group.missions" 
                  class="mission-row" 
                  [class.hidden]="!group.expanded">
                <td class="mission-indent"></td>
                
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
          </tbody>
        </table>
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
      color: #1e293b;
      font-size: 28px;
      font-weight: 700;
    }

    .dashboard-header p {
      margin: 0;
      color: #64748b;
      font-size: 16px;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .mission-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .column-group-header {
      background: #1e293b;
      color: white;
      padding: 12px 16px;
      font-weight: 600;
      text-align: center;
      border-bottom: 2px solid #334155;
      position: relative;
    }

    .column-group-header.information {
      background: #0f172a;
    }

    .column-group-header.avant-mission {
      background: #1e40af;
    }

    .column-group-header.pendant-mission {
      background: #059669;
    }

    .column-group-header.fin-mission {
      background: #dc2626;
    }

    .column-header {
      background: #f1f5f9;
      color: #374151;
      padding: 10px 12px;
      font-weight: 600;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .column-header.percentage {
      background: #fef3c7;
      color: #92400e;
      min-width: 60px;
    }

    .group-row {
      background: #f8fafc;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .group-row:hover {
      background: #f1f5f9;
    }

    .group-cell {
      padding: 12px 16px;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .group-summary {
      padding: 12px 16px;
      color: #64748b;
      font-style: italic;
    }

    .mission-row {
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s;
    }

    .mission-row:hover {
      background: #fefefe;
    }

    .mission-row.hidden {
      display: none;
    }

    .mission-indent {
      width: 20px;
      background: #f8fafc;
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
      background: #fee2e2;
      color: #dc2626;
    }

    .progress-circle[data-percentage="25"] {
      background: #fef3c7;
      color: #d97706;
    }

    .progress-circle[data-percentage="50"] {
      background: #fef3c7;
      color: #d97706;
    }

    .progress-circle[data-percentage="75"] {
      background: #dcfce7;
      color: #16a34a;
    }

    .progress-circle[data-percentage="100"] {
      background: #dcfce7;
      color: #16a34a;
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

  groupedMissions: { name: string; missions: MissionData[]; expanded: boolean }[] = [];

  ngOnInit(): void {
    this.initializeMockData();
  }

  initializeMockData(): void {
    const missions: MissionData[] = [
      {
        numeroGroupe: 'G001',
        nomGroupe: 'Groupe Alpha',
        numeroClient: 'C001',
        nomClient: 'Entreprise ABC',
        mission: 'Audit financier',
        avantMission: { percentage: 75, lab: true, conflitCheck: true, qac: true, qam: false, ldm: false },
        pendantMission: { percentage: 25, nog: true, checklist: false, revision: false, supervision: false },
        finMission: { percentage: 0, ndsCr: false, qmm: false, plaquette: false, restitution: false }
      },
      {
        numeroGroupe: 'G001',
        nomGroupe: 'Groupe Alpha',
        numeroClient: 'C002',
        nomClient: 'Société XYZ',
        mission: 'Conseil stratégique',
        avantMission: { percentage: 100, lab: true, conflitCheck: true, qac: true, qam: true, ldm: true },
        pendantMission: { percentage: 50, nog: true, checklist: true, revision: false, supervision: false },
        finMission: { percentage: 25, ndsCr: true, qmm: false, plaquette: false, restitution: false }
      },
      {
        numeroGroupe: 'G002',
        nomGroupe: 'Groupe Beta',
        numeroClient: 'C003',
        nomClient: 'Corp DEF',
        mission: 'Due diligence',
        avantMission: { percentage: 50, lab: true, conflitCheck: true, qac: false, qam: false, ldm: false },
        pendantMission: { percentage: 0, nog: false, checklist: false, revision: false, supervision: false },
        finMission: { percentage: 0, ndsCr: false, qmm: false, plaquette: false, restitution: false }
      }
    ];

    // Grouper les missions par groupe
    const groups = missions.reduce((acc, mission) => {
      const groupName = mission.nomGroupe;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(mission);
      return acc;
    }, {} as { [key: string]: MissionData[] });

    this.groupedMissions = Object.entries(groups).map(([name, missions]) => ({
      name,
      missions,
      expanded: true
    }));
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

  toggleGroup(index: number): void {
    this.groupedMissions[index].expanded = !this.groupedMissions[index].expanded;
  }

  toggleAllGroups(): void {
    this.allGroupsExpanded = !this.allGroupsExpanded;
    this.groupedMissions.forEach(group => {
      group.expanded = this.allGroupsExpanded;
    });
  }

  getGroupAverage(group: { missions: MissionData[] }): number {
    if (group.missions.length === 0) return 0;
    
    const total = group.missions.reduce((sum, mission) => {
      const avg = (mission.avantMission.percentage + mission.pendantMission.percentage + mission.finMission.percentage) / 3;
      return sum + avg;
    }, 0);
    
    return Math.round(total / group.missions.length);
  }
}