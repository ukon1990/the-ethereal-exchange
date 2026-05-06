import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, firstValueFrom, from, map, of, switchMap, tap } from 'rxjs';

import {
  AuthConfirmResponse,
  AuthLoginResponse,
  AuthMeResponse,
  AuthSignupResponse,
} from '@api/auth/auth.model';

export type AuthUser = {
  readonly email: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<AuthUser | null>(null);
  readonly loaded = signal(false);

  refresh(): Promise<AuthUser | null> {
    return firstValueFrom(
      this.http.get<AuthMeResponse>('/auth/me').pipe(
        map((response) => (response.authenticated ? { email: response.email } : null)),
        tap((user) => this.user.set(user)),
        catchError(() => {
          this.user.set(null);
          return of(null);
        }),
        finalize(() => this.loaded.set(true)),
      ),
    );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthLoginResponse>('/auth/login', { email, password })
      .pipe(switchMap((response) => from(this.refresh()).pipe(map(() => response))));
  }

  requestVerificationCode(email: string, password: string) {
    return this.http.post<AuthSignupResponse>('/auth/signup', {
      email,
      password,
    });
  }

  confirmEmailCode(email: string, code: string) {
    return this.http.post<AuthConfirmResponse>('/auth/confirm', {
      email,
      code,
    });
  }

  setSignedOut(): void {
    this.user.set(null);
    this.loaded.set(true);
  }
}
