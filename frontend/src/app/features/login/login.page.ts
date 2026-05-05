import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type LoginMode = 'login' | 'signup' | 'confirm';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login.page.html',
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly mode = signal<LoginMode>('login');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmationCode = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected setMode(mode: LoginMode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.notice.set(null);
  }

  protected async submit(): Promise<void> {
    this.error.set(null);
    this.notice.set(null);
    this.loading.set(true);
    try {
      if (this.mode() === 'signup') {
        await this.signup();
      } else if (this.mode() === 'confirm') {
        await this.confirm();
      } else {
        await this.login();
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      this.loading.set(false);
    }
  }

  private async login(): Promise<void> {
    await requestAuth('/auth/login', {
      email: this.email(),
      password: this.password(),
    });
    window.location.assign('/');
  }

  private async signup(): Promise<void> {
    const response = await requestAuth<{ confirmed: boolean }>('/auth/signup', {
      email: this.email(),
      password: this.password(),
    });
    if (response.confirmed) {
      this.notice.set('Account created. You can sign in now.');
      this.mode.set('login');
      return;
    }
    this.notice.set('Enter the confirmation code sent to your email.');
    this.mode.set('confirm');
  }

  private async confirm(): Promise<void> {
    await requestAuth('/auth/confirm', {
      email: this.email(),
      code: this.confirmationCode(),
    });
    this.notice.set('Email confirmed. You can sign in now.');
    this.mode.set('login');
  }
}

async function requestAuth<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Authentication failed');
  }
  return payload;
}
