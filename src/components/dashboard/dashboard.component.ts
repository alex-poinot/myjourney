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
                      {{ getTotalMissionsInGroup(group) }} mission(s) - {{ getTotalClientsInGroup(group) }} client(s) - Avancement moyen: {{ getMainGroupAverage(group) }}%
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
                      <span class="client-summary">({{ getTotalMissionsInClient(group, client) }} mission(s))</span>
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
      top: 49px;
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
  allMissions: MissionData[] = [];
  completeGroupedData: GroupData[] = [];
  currentPage = 1;
  itemsPerPage = 50;
  totalMissions = 0;
  totalPages = 0;
  startIndex = 0;
  endIndex = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeData();
    this.updatePagination();
  }

  initializeData(): void {
    // Récupérer les données des missions depuis l'API
    this.http.get<{ success: boolean; data: MissionData[]; count: number; timestamp: string }>('http://localhost:3000/api/missions/getAllMissionsDashboard')
      .subscribe((response) => {
        let data = response.data;
        
        const realData: MissionData[] = data;

        // Grouper d'abord par numeroGroupe, puis par numeroClient
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
        
        // Sauvegarder les données complètes pour les compteurs
        this.completeGroupedData = JSON.parse(JSON.stringify(this.groupedData));
        
        // Créer une liste plate de toutes les missions pour la pagination
        this.allMissions = this.groupedData.flatMap(group => 
          group.clients.flatMap(client => client.missions)
        );
        
        this.updatePagination();
      }, (error) => {
        console.error('Erreur lors de la récupération des missions :', error);
      });
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.totalMissions / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(this.startIndex + this.itemsPerPage, this.totalMissions);
    
    // Obtenir les missions paginées
    const paginatedMissions = this.allMissions.slice(this.startIndex, this.endIndex);
    
    // Reconstruire la structure groupée avec seulement les missions paginées
    const groupedPaginated = new Map<string, GroupData>();
    
    paginatedMissions.forEach(mission => {
      const groupKey = mission.numeroGroupe;
      const clientKey = mission.numeroClient;
      
      if (!groupedPaginated.has(groupKey)) {
        groupedPaginated.set(groupKey, {
          numeroGroupe: mission.numeroGroupe,
          nomGroupe: mission.nomGroupe,
          clients: new Map<string, ClientGroup>(),
          expanded: true
        } as any);
      }
      
      const group = groupedPaginated.get(groupKey)!;
      const clientsMap = group.clients as any;
      
      if (!clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, {
          numeroClient: mission.numeroClient,
          nomClient: mission.nomClient,
          missions: [],
          expanded: true
        });
      }
      
      clientsMap.get(clientKey).missions.push(mission);
    });
    
    // Convertir les Maps en arrays
    this.paginatedData = Array.from(groupedPaginated.values()).map(group => ({
      ...group,
      clients: Array.from((group.clients as any).values())
    }));
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
    // Trouver le groupe complet correspondant
    const completeGroup = this.completeGroupedData.find(g => g.numeroGroupe === group.numeroGroupe);
    if (!completeGroup) return 0;
    
    return completeGroup.clients.reduce((total, client) => total + client.missions.length, 0);
  }

  getTotalClientsInGroup(group: GroupData): number {
    // Trouver le groupe complet correspondant
    const completeGroup = this.completeGroupedData.find(g => g.numeroGroupe === group.numeroGroupe);
    if (!completeGroup) return 0;
    
    return completeGroup.clients.length;
  }

  getTotalMissionsInClient(group: GroupData, client: ClientGroup): number {
    // Trouver le groupe complet correspondant
    const completeGroup = this.completeGroupedData.find(g => g.numeroGroupe === group.numeroGroupe);
    if (!completeGroup) return 0;
    
    // Trouver le client complet correspondant
    const completeClient = completeGroup.clients.find(c => c.numeroClient === client.numeroClient);
    if (!completeClient) return 0;
    
    return completeClient.missions.length;
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