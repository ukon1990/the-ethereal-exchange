import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let authService: {
    login: ReturnType<typeof vitest.fn>;
    requestVerificationCode: ReturnType<typeof vitest.fn>;
    confirmEmailCode: ReturnType<typeof vitest.fn>;
    requestPasswordReset: ReturnType<typeof vitest.fn>;
    resetPassword: ReturnType<typeof vitest.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    authService = {
      login: vitest.fn().mockReturnValue(of({ authenticated: true })),
      requestVerificationCode: vitest.fn().mockReturnValue(of({ confirmed: false })),
      confirmEmailCode: vitest.fn().mockReturnValue(of({ confirmed: true })),
      requestPasswordReset: vitest.fn().mockReturnValue(of({ requested: true })),
      resetPassword: vitest.fn().mockReturnValue(of({ reset: true })),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vitest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('logs in and navigates after successful credentials', async () => {
    typeIntoInput(0, 'user@example.com');
    typeIntoInput(1, 'correct-password');

    await submitForm();

    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'correct-password');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('allows login to be retried after invalid credentials', async () => {
    authService.login
      .mockReturnValueOnce(throwError(() => authError('invalid_credentials', 'Wrong password')))
      .mockReturnValueOnce(of({ authenticated: true }));

    typeIntoInput(0, 'user@example.com');
    typeIntoInput(1, 'wrong-password');
    await submitForm();

    expect(pageText()).toContain('Wrong password');
    expect(submitButton().disabled).toBe(false);

    typeIntoInput(1, 'correct-password');
    await submitForm();

    expect(authService.login).toHaveBeenCalledTimes(2);
    expect(authService.login).toHaveBeenLastCalledWith('user@example.com', 'correct-password');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('does not call the API when required login fields are missing', async () => {
    await submitForm();

    expect(authService.login).not.toHaveBeenCalled();
    expect(pageText()).toContain('Password is required');
  });

  it('requests a verification code when creating an unconfirmed account', async () => {
    setMode('signup');
    typeIntoInput(0, 'new@example.com');
    typeIntoInput(1, 'Strong1!');
    typeIntoInput(2, 'Strong1!');

    await submitForm();

    expect(authService.requestVerificationCode).toHaveBeenCalledWith('new@example.com', 'Strong1!');
    expect(pageText()).toContain('Enter the confirmation code sent to your email.');
    expect(submitButton().textContent).toContain('Confirm email');
  });

  it('logs in immediately when signup returns a confirmed account', async () => {
    authService.requestVerificationCode.mockReturnValue(of({ confirmed: true }));

    setMode('signup');
    typeIntoInput(0, 'new@example.com');
    typeIntoInput(1, 'Strong1!');
    typeIntoInput(2, 'Strong1!');
    await submitForm();

    expect(authService.requestVerificationCode).toHaveBeenCalledWith('new@example.com', 'Strong1!');
    expect(authService.login).toHaveBeenCalledWith('new@example.com', 'Strong1!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows signup server errors without blocking another submit', async () => {
    authService.requestVerificationCode
      .mockReturnValueOnce(throwError(() => authError('user_exists', 'User already exists')))
      .mockReturnValueOnce(of({ confirmed: false }));

    setMode('signup');
    typeIntoInput(0, 'new@example.com');
    typeIntoInput(1, 'Strong1!');
    typeIntoInput(2, 'Strong1!');
    await submitForm();

    expect(pageText()).toContain('User already exists');

    await submitForm();

    expect(authService.requestVerificationCode).toHaveBeenCalledTimes(2);
    expect(submitButton().textContent).toContain('Confirm email');
  });

  it('confirms email and logs in with the current credentials', async () => {
    setMode('confirm');
    typeIntoInput(0, 'new@example.com');
    typeIntoInput(1, '123456');

    await submitForm();

    expect(authService.confirmEmailCode).toHaveBeenCalledWith('new@example.com', '123456');
    expect(authService.login).toHaveBeenCalledWith('new@example.com', '');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('moves to confirmation mode when login reports an unconfirmed user', async () => {
    authService.login.mockReturnValue(
      throwError(() => authError('user_not_confirmed', 'Confirm your email first')),
    );

    typeIntoInput(0, 'pending@example.com');
    typeIntoInput(1, 'password');
    await submitForm();

    expect(pageText()).toContain('Enter the confirmation code sent to your email.');
    expect(submitButton().textContent).toContain('Confirm email');
  });

  it('requests and completes password reset', async () => {
    setMode('forgot');
    typeIntoInput(0, 'reset@example.com');
    await submitForm();

    expect(authService.requestPasswordReset).toHaveBeenCalledWith('reset@example.com');
    expect(pageText()).toContain('password reset code has been sent');
    expect(submitButton().textContent).toContain('Reset password');

    typeIntoInput(1, 'Strong1!');
    typeIntoInput(2, 'Strong1!');
    typeIntoInput(3, '654321');
    await submitForm();

    expect(authService.resetPassword).toHaveBeenCalledWith(
      'reset@example.com',
      '654321',
      'Strong1!',
    );
    expect(pageText()).toContain('Password reset. Sign in with your new password.');
    expect(submitButton().textContent).toContain('Sign in');
  });

  it('shows reset validation and server code errors', async () => {
    authService.resetPassword.mockReturnValue(
      throwError(() => authError('code_mismatch', 'Invalid confirmation code')),
    );

    setMode('reset');
    typeIntoInput(0, 'reset@example.com');
    typeIntoInput(1, 'weak');
    typeIntoInput(2, 'weak');
    typeIntoInput(3, '111111');
    await submitForm();

    expect(authService.resetPassword).not.toHaveBeenCalled();
    expect(pageText()).toContain('New password must be at least 8 characters');

    typeIntoInput(1, 'Strong1!');
    typeIntoInput(2, 'Strong1!');
    await submitForm();

    expect(authService.resetPassword).toHaveBeenCalledWith(
      'reset@example.com',
      '111111',
      'Strong1!',
    );
    expect(pageText()).toContain('Invalid confirmation code');
  });

  it('shows a generic notice for unexpected failures', async () => {
    authService.login.mockReturnValue(throwError(() => new Error('network down')));

    typeIntoInput(0, 'user@example.com');
    typeIntoInput(1, 'password');
    await submitForm();

    expect(pageText()).toContain('Unable to complete the request. Please try again.');
    expect(submitButton().disabled).toBe(false);
  });

  it('falls back to the generic notice for malformed auth responses', async () => {
    authService.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: { code: 'unknown' } })),
    );

    typeIntoInput(0, 'user@example.com');
    typeIntoInput(1, 'password');
    await submitForm();

    expect(pageText()).toContain('Unable to complete the request. Please try again.');
  });

  function setMode(mode: 'login' | 'signup' | 'confirm' | 'forgot' | 'reset'): void {
    fixture.componentInstance['setMode'](mode);
    fixture.detectChanges();
  }

  function typeIntoInput(index: number, value: string): void {
    const input = inputs()[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function submitForm(): Promise<void> {
    form().dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function form(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function inputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input'));
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function pageText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});

function authError(code: string, message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    error: { code, error: message },
  });
}
