import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../auth.service';
import { ToastService } from '../../admin/toast.service';
import { I18nService } from '../../i18n.service';

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
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  readonly i18n = inject(I18nService);
  t(vi: string, en: string): string { return this.i18n.lang() === 'en' ? en : vi; }

  readonly bars = [0, 1, 2];

  mode = signal<AuthMode>('login');
  loading = signal(false);
  submitted = signal(false);
  feedback = signal<{ type: 'error' | 'success'; message: string } | null>(null);
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword = signal(false);

  readonly forgot = signal(false);
  readonly otpSent = signal(false);
  readonly forgotLoading = signal(false);
  readonly googleOtp = signal(false);
  readonly otpRegister = signal(false);
  readonly otpRegisterLoading = signal(false);
  readonly resendCountdown = signal(0);
  private resendTimer?: ReturnType<typeof setInterval>;

  readonly isAdminMode = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
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

  readonly registerOtpForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  readonly forgotEmailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  readonly adminResetForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      resetSecret: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit(): void {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    if (path === '/dang-ky') {
      this.mode.set('register');
    }
  }

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.otpRegister.set(false);
    this.googleOtp.set(false);
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

  openForgot(): void {
    this.forgot.set(true);
    this.otpSent.set(false);
    this.feedback.set(null);
    this.submitted.set(false);
  }

  backToLogin(): void {
    this.forgot.set(false);
    this.otpSent.set(false);
    this.feedback.set(null);
  }

  sendOtp(): void {
    this.submitted.set(true);
    if (this.forgotEmailForm.invalid) {
      this.forgotEmailForm.markAllAsTouched();
      return;
    }
    this.forgotLoading.set(true);
    const email = this.forgotEmailForm.getRawValue().email ?? '';
    this.auth.forgotPassword(email).subscribe({
      next: (r: any) => {
        this.forgotLoading.set(false);
        if (r?.success) {
          this.otpSent.set(true);
          this.feedback.set({ type: 'success', message: this.t('Mã OTP đã gửi đến email của bạn.', 'An OTP code has been sent to your email.') });
        } else {
          this.feedback.set({ type: 'error', message: r?.message || this.t('Gửi mã OTP thất bại.', 'Failed to send OTP.') });
        }
      },
      error: (e: any) => {
        this.forgotLoading.set(false);
        this.feedback.set({ type: 'error', message: e?.error?.message || this.t('Gửi mã OTP thất bại.', 'Failed to send OTP.') });
      },
    });
  }

  onResetPassword(): void {
    this.submitted.set(true);
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.forgotLoading.set(true);
    const v = this.resetForm.getRawValue();
    this.auth
      .resetPassword({ email: v.email ?? '', otp: v.otp ?? '', password: v.password ?? '' })
      .subscribe({
        next: (r: any) => {
          this.forgotLoading.set(false);
          if (r?.token) {
            this.auth.saveSession(r, false);
          }
          this.feedback.set({ type: 'success', message: this.t('Đặt lại mật khẩu thành công.', 'Password reset successfully.') });
          setTimeout(() => this.router.navigate(['']), 1500);
        },
        error: (e: any) => {
          this.forgotLoading.set(false);
          this.feedback.set({ type: 'error', message: e?.error?.message || this.t('Đặt lại mật khẩu thất bại.', 'Password reset failed.') });
        },
      });
  }

  onAdminReset(): void {
    this.submitted.set(true);
    if (this.adminResetForm.invalid) {
      this.adminResetForm.markAllAsTouched();
      return;
    }
    this.forgotLoading.set(true);
    const v = this.adminResetForm.getRawValue();
    this.auth
      .adminResetPassword({ email: v.email ?? '', resetSecret: v.resetSecret ?? '', password: v.password ?? '' })
      .subscribe({
        next: (r: any) => {
          this.forgotLoading.set(false);
          if (r?.success) {
            this.feedback.set({ type: 'success', message: this.t('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.', 'Password reset successfully. Please log in again.') });
            setTimeout(() => this.backToLogin(), 1500);
          } else {
            this.feedback.set({ type: 'error', message: r?.message || this.t('Đặt lại mật khẩu thất bại.', 'Password reset failed.') });
          }
        },
        error: (e: any) => {
          this.forgotLoading.set(false);
          this.feedback.set({ type: 'error', message: e?.error?.message || this.t('Đặt lại mật khẩu thất bại.', 'Password reset failed.') });
        },
      });
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
    return this.i18n.lang() === 'en'
      ? ['Not entered', 'Weak', 'Medium', 'Strong'][this.passwordStrength]
      : ['Chưa nhập', 'Yếu', 'Trung bình', 'Mạnh'][this.passwordStrength];
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
        this.feedback.set({ type: 'success', message: this.t(`Xin chào ${response.user?.name || ''}!`, `Hello ${response.user?.name || ''}!`) });
        this.loading.set(false);

        const email = (response.user?.email || '').toLowerCase();
        const isAdmin = email.endsWith('@admin.mocmac.vn') || response.user?.role === 'admin';
        if (this.isAdminMode() || isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['']);
        }
      },
      error: (error: any) => {
        this.loading.set(false);
        if (error?.status === 403) {
          this.otpRegister.set(true);
          this.registerOtpForm.patchValue({ email: (this.loginForm.get('identifier')?.value ?? '').toString() });
          this.feedback.set({ type: 'error', message: this.t('Tài khoản chưa được kích hoạt. Vui lòng nhập mã OTP gửi đến email để kích hoạt.', 'Account not activated. Please enter the OTP sent to your email to activate.') });
        } else {
          this.toast.error(this.t('Sai tài khoản hoặc mật khẩu', 'Incorrect account or password'));
        }
        this.feedback.set(null);
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
        this.loading.set(false);
        this.mode.set('register');
        this.otpRegister.set(true);
        this.registerOtpForm.patchValue({ email });
        this.feedback.set({ type: 'success', message: this.t('Tạo tài khoản thành công. Vui lòng nhập mã OTP gửi đến email để kích hoạt.', 'Account created. Please enter the OTP sent to your email to activate.') });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        if (error instanceof HttpErrorResponse) {
          this.toast.error(error.error?.message || this.t('Đăng ký thất bại. Vui lòng thử lại.', 'Registration failed. Please try again.'));
        } else {
          this.toast.error(this.t('Đăng ký thất bại. Vui lòng thử lại.', 'Registration failed. Please try again.'));
        }
        this.feedback.set(null);
      },
    });
  }

  onVerifyRegisterOtp(): void {
    if (this.registerOtpForm.invalid) {
      this.registerOtpForm.markAllAsTouched();
      return;
    }
    this.otpRegisterLoading.set(true);
    const { email, otp } = this.registerOtpForm.getRawValue();
    this.auth.verifyRegisterOtp({ email: email ?? '', otp: otp ?? '' }).subscribe({
      next: (response: any) => {
        this.otpRegisterLoading.set(false);
        this.auth.saveSession(response, false);
        this.otpRegister.set(false);
        this.googleOtp.set(false);
        this.feedback.set({ type: 'success', message: this.t('Xác thực thành công. Chào mừng bạn đến với Mộc Mạc!', 'Verification successful. Welcome to Mộc Mạc!') });
        setTimeout(() => this.router.navigate(['']), 1500);
      },
      error: (error: unknown) => {
        this.otpRegisterLoading.set(false);
        if (error instanceof HttpErrorResponse) {
          this.toast.error(error.error?.message || this.t('Xác thực thất bại. Vui lòng kiểm tra mã OTP.', 'Verification failed. Please check the OTP code.'));
        } else {
          this.toast.error(this.t('Xác thực thất bại. Vui lòng kiểm tra mã OTP.', 'Verification failed. Please check the OTP code.'));
        }
      },
    });
  }

  resendRegisterOtp(): void {
    const email = this.registerOtpForm.get('email')?.value ?? '';
    if (!email || this.resendCountdown() > 0) return;
    this.auth.resendRegisterOtp(email).subscribe({
      next: (r: any) => {
        if (r?.success) {
          this.toast.success(this.t('Đã gửi mã OTP mới đến email của bạn.', 'A new OTP code has been sent to your email.'));
          this.startResendCountdown();
        }
      },
      error: () => {
        this.toast.error(this.t('Gửi mã OTP mới thất bại.', 'Failed to resend OTP.'));
      },
    });
  }

  private startResendCountdown(): void {
    this.resendCountdown.set(60);
    if (this.resendTimer) window.clearInterval(this.resendTimer);
    this.resendTimer = window.setInterval(() => {
      const next = this.resendCountdown() - 1;
      if (next <= 0) {
        this.resendCountdown.set(0);
        window.clearInterval(this.resendTimer);
      } else {
        this.resendCountdown.set(next);
      }
    }, 1000);
  }

  private showRequestError(error: unknown): void {
    const message =
      error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : this.t('Không thể kết nối máy chủ. Vui lòng thử lại sau.', 'Cannot connect to server. Please try again later.');
    this.feedback.set({ type: 'error', message });
  }

  loginWithSocial(provider: 'google' | 'facebook'): void {
    if (provider === 'facebook') {
      this.toast.error('Đăng nhập Facebook chưa được hỗ trợ.');
      return;
    }
    this.http.get<{ clientId: string }>('/api/auth/google/config').subscribe({
      next: ({ clientId }) => {
        if (!clientId) { this.toast.error('Đăng nhập Google chưa được cấu hình.'); return; }
        const start = () => {
          const google = (window as any).google;
          google.accounts.id.initialize({ client_id: clientId, callback: (response: { credential: string }) => this.completeGoogleLogin(response.credential) });
          google.accounts.id.prompt();
        };
        if ((window as any).google?.accounts?.id) { start(); return; }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = start;
        script.onerror = () => this.toast.error('Không tải được dịch vụ Google.');
        document.head.appendChild(script);
      },
      error: () => this.toast.error('Không thể khởi tạo đăng nhập Google.'),
    });
  }

  private completeGoogleLogin(credential: string): void {
    this.loading.set(true);
    this.http.post('/api/auth/google', { credential }).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        if (response?.requiresVerification) {
          this.googleOtp.set(true);
          this.registerOtpForm.patchValue({ email: response.email });
          this.feedback.set({ type: 'success', message: this.t('Vui lòng nhập mã OTP gửi đến email để xác thực đăng nhập Google.', 'Please enter the OTP sent to your email to verify Google login.') });
        } else {
          this.auth.saveSession(response, false);
          this.router.navigate(['/']);
        }
      },
      error: (error: HttpErrorResponse) => { this.loading.set(false); this.toast.error(error.error?.message || 'Đăng nhập Google thất bại.'); },
    });
  }

  ngOnDestroy(): void {
    if (this.resendTimer) window.clearInterval(this.resendTimer);
  }
}
