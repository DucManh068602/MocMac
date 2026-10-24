import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../auth.service';

type AuthMode = 'login' | 'register';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-dangnhap',
  standalone: false,
  templateUrl: './dangnhap.html',
  styleUrl: './dangnhap.scss',
})
export class DangnhapComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly bars = [0, 1, 2];

  mode = signal<AuthMode>('login');
  loading = signal(false);
  submitted = signal(false);
  feedback = signal<{ type: 'error' | 'success'; message: string } | null>(null);
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword = signal(false);

  readonly isAdminMode = signal(false);

  readonly loginForm = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [false],
  });

  readonly registerForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      agree: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatchValidator }
  );

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.feedback.set(null);
    this.submitted.set(false);
  }

  openAdminLogin(): void {
    this.isAdminMode.set(true);
    this.mode.set('login');
    this.feedback.set(null);
    this.submitted.set(false);
    this.loginForm.reset({ identifier: '', password: '', remember: false });
  }

  backToCustomer(): void {
    this.isAdminMode.set(false);
    this.mode.set('login');
    this.feedback.set(null);
    this.submitted.set(false);
  }

  get passwordStrength(): number {
    const value = this.registerForm.controls.password.value;
    if (!value) return 0;
    let score = 1;
    if (value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  get strengthLabel(): string {
    return ['Chưa nhập', 'Yếu', 'Trung bình', 'Mạnh'][this.passwordStrength];
  }

  hasError(form: AbstractControl, field: string, errorKey?: string): boolean {
    const control = form.get(field);
    if (!control) return false;
    if (!this.submitted() && !control.touched && !control.dirty) return false;
    if (errorKey) {
      return control.hasError(errorKey);
    }
    return control.invalid;
  }

  onLogin(): void {
    this.submitted.set(true);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.feedback.set(null);
    const { identifier, password, remember } = this.loginForm.getRawValue();
    this.auth.login(identifier ?? '', password ?? '').subscribe({
      next: (response: any) => {
        this.auth.saveSession(response, remember ?? false);
        this.feedback.set({ type: 'success', message: `Xin chào ${response.user?.name || ''}!` });
        this.loading.set(false);

        const email = (response.user?.email || '').toLowerCase();
        const isAdmin = email.endsWith('@admin.mocmac.vn') || response.user?.role === 'admin';

        if (this.isAdminMode() || isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['']);
        }
      },
      error: (error: unknown) => {
        this.showRequestError(error);
        this.loading.set(false);
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.feedback.set(null);
    const { fullName, email, phone, password } = this.registerForm.getRawValue();
    this.auth.register({ name: fullName, email, phone, password }).subscribe({
      next: (response: any) => {
        this.auth.saveSession(response, false);
        this.feedback.set({ type: 'success', message: 'Tạo tài khoản thành công.' });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.showRequestError(error);
        this.loading.set(false);
      },
    });
  }

  private showRequestError(error: unknown): void {
    const message =
      error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : 'Không thể kết nối máy chủ. Vui lòng thử lại sau.';
    this.feedback.set({ type: 'error', message });
  }

  loginWithSocial(provider: 'google' | 'facebook'): void {
    console.log('Đăng nhập bằng', provider);
  }
}
