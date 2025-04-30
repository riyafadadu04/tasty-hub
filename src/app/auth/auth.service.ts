import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  tap,
  catchError,
  throwError,
  map,
} from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authUrl = environment.firebaseConfig.authURL;
  private apiKey = environment.firebaseConfig.apiKey;
  private dbUrl = environment.firebaseConfig.databaseURL;

  private _user = new BehaviorSubject<any>(null);
  user = this._user.asObservable();
  private tokenExpirationTimer: any;

  private _isAuthResolved = new BehaviorSubject<boolean>(false);
  isAuthResolved$ = this._isAuthResolved.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.autoLogin();
  }

  login(email: string, password: string): Observable<any> {
    const loginData = {
      email,
      password,
      returnSecureToken: true,
    };

    return this.http
      .post<any>(
        `${this.authUrl}:signInWithPassword?key=${this.apiKey}`,
        loginData
      )
      .pipe(
        catchError(this.handleError),
        tap((response) => {
          if (!response.idToken) {
            throw new Error(
              'Authentication failed. Please check your credentials.'
            );
          }
          this.storeUserData(response);
        })
      );
  }

  signup(name: string, email: string, password: string): Observable<any> {
    const signupData = {
      email,
      password,
      returnSecureToken: true,
    };
    return this.http
      .post<any>(`${this.authUrl}:signUp?key=${this.apiKey}`, signupData)
      .pipe(
        catchError(this.handleError),
        tap((response) => {
          const userId = response.localId;
          const userData = { email, name, password, userId, favorites: [] };
          console.log(userData, userId);

          this.saveUserData(userId, userData).subscribe(() => {
            console.log('User data saved:', userData);
          });

          this.storeUserData(userData);
        })
      );
  }

  logout() {
    localStorage.removeItem('userData');
    this._user.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('userData');
  }

  autoLogin() {
    const userData = JSON.parse(localStorage.getItem('userData')!);
    if (!userData) {
      this._isAuthResolved.next(true); // even if no user, login check is done
      return;
    }

    const loadedUser = {
      email: userData.email,
      userId: userData.userId,
      token: userData.token,
      tokenExpirationDate: new Date(userData.tokenExpirationDate),
    };

    if (new Date() < loadedUser.tokenExpirationDate) {
      this._user.next(loadedUser);
      const expirationDuration =
        loadedUser.tokenExpirationDate.getTime() - new Date().getTime();
      this.autoLogout(expirationDuration);
    } else {
      this.logout();
    }

    this._isAuthResolved.next(true); // done checking auth
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private saveUserData(userId: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.dbUrl}/users/${userId}.json`, userData);
  }

  private storeUserData(authData: any) {
    const expirationDate = new Date(
      new Date().getTime() + +authData.expiresIn * 1000
    );
    const user = {
      email: authData.email,
      userId: authData.localId,
      token: authData.idToken,
      tokenExpirationDate: expirationDate,
    };
    localStorage.setItem('userData', JSON.stringify(user));
    this._user.next(user);
  }

  private handleError(errorRes: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    console.log(errorRes);

    if (!errorRes.error || !errorRes.error.error) {
      return throwError(() => errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email address is already in use.';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email address does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'The password is incorrect.';
        break;
      case 'INVALID_LOGIN_CREDENTIALS':
        errorMessage = 'Invalid email and password.';
        break;
    }
    return throwError(() => errorMessage);
  }

  getCurrentUserId(): string {
    const userData = JSON.parse(localStorage.getItem('userData')!);
    return userData?.userId || '';
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get<{ myrecipes?: string[] }>(
      `${this.dbUrl}/users/${userId}.json`
    );
  }
}
