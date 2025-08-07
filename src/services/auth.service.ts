import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { loginRequest, graphConfig } from '../auth/auth.config';

export interface UserProfile {
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private msalService: MsalService,
    private http: HttpClient
  ) {
    this.checkAuthenticationStatus();
  }

  private checkAuthenticationStatus(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalService.instance.setActiveAccount(accounts[0]);
      this.isAuthenticatedSubject.next(true);
      // Charger le profil utilisateur de manière asynchrone
      this.loadUserProfile().catch(error => {
        console.error('Erreur lors du chargement du profil:', error);
      });
    }
  }

  async login(): Promise<void> {
    try {
      const result = await firstValueFrom(this.msalService.loginPopup(loginRequest));
      if (result) {
        this.msalService.instance.setActiveAccount(result.account);
        this.isAuthenticatedSubject.next(true);
        await this.loadUserProfile();
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  logout(): void {
    this.msalService.logout();
    this.isAuthenticatedSubject.next(false);
    this.userProfileSubject.next(null);
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const account = this.msalService.instance.getActiveAccount();
      if (!account) return;

      // Acquérir un token pour Microsoft Graph
      const tokenResponse = await firstValueFrom(this.msalService.acquireTokenSilent({
        scopes: loginRequest.scopes,
        account: account
      }));

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${tokenResponse.accessToken}`
      });

      // Récupérer les informations du profil
      const profile = await this.http.get<any>(graphConfig.graphMeEndpoint, { headers }).toPromise();
      
      // Récupérer la photo de profil
      let photoUrl = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
      try {
        const photoBlob = await this.http.get(graphConfig.graphPhotoEndpoint, { 
          headers, 
          responseType: 'blob' 
        }).toPromise();
        
        if (photoBlob) {
          photoUrl = URL.createObjectURL(photoBlob);
        }
      } catch (photoError) {
        console.log('Photo de profil non disponible, utilisation de l\'image par défaut');
      }

      const userProfile: UserProfile = {
        displayName: profile.displayName || profile.userPrincipalName,
        mail: profile.mail || profile.userPrincipalName,
        userPrincipalName: profile.userPrincipalName,
        jobTitle: profile.jobTitle,
        department: profile.department,
        photoUrl: photoUrl
      };

      this.userProfileSubject.next(userProfile);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}