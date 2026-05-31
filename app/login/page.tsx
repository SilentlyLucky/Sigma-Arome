/**
 * Login Page Template
 *
 * Server-side proxy login page that uses the /api/auth/login proxy route
 * instead of calling Supabase directly from the browser.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

type LoginValues = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginValues, string>>;

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const body = await response.text();
  const isHtml = body.trimStart().startsWith('<!DOCTYPE') || body.trimStart().startsWith('<html');

  throw new Error(
    isHtml
      ? `Server returned an HTML page instead of JSON (${response.status}). Please refresh and try again.`
      : body || `Unexpected response from server (${response.status})`
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!values.email) {
      nextErrors.email = 'Email is required';
    } else if (!/^\S+@\S+$/.test(values.email)) {
      nextErrors.email = 'Invalid email';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include',
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Login failed');
      }

      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green',
      });

      const accessToken = data?.data?.session?.access_token;
      if (accessToken) {
        try {
          const roleRes = await fetch('/api/auth/role', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'X-Auth-Token': accessToken,
            },
          });
          if (roleRes.ok) {
            const roleData = await readJsonResponse(roleRes);
            console.log('[login] role data:', JSON.stringify(roleData));
            const dest = roleData?.redirect;
            if (dest && dest !== '/login') {
              router.push(dest);
              router.refresh();
              return;
            }
          }
        } catch (roleErr) {
          console.error('[login] role detection error:', roleErr);
        }
      }

      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to login',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-mantine-color-scheme="light" className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.brandPanel}>
          <div className={styles.brandContent}>
            <Image
              src="/Sigma_Arome_Logo_Transparent.png"
              alt="Sigma Arome"
              width={430}
              height={430}
              priority
              className={styles.brandLogo}
            />
            <div className={styles.brandDivider}>
              <span className={styles.brandDividerLine} />
              <Leaf aria-hidden="true" size={24} strokeWidth={1.8} />
              <span className={styles.brandDividerLine} />
            </div>
            <p className={styles.brandTagline}>
              Smart Operations. Natural Excellence.
            </p>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.card}>
            <div className={styles.badge}>
              <Leaf aria-hidden="true" size={36} strokeWidth={1.9} />
            </div>

            <div className={styles.headingBlock}>
              <h1 className={styles.title}>Welcome back</h1>
              <p className={styles.subtitle}>
                Sign in to your Sigma Arome account
              </p>
            </div>

            <form onSubmit={handleLogin} className={styles.form} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputShell}>
                  <Mail
                    aria-hidden="true"
                    className={styles.fieldIcon}
                    strokeWidth={2}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, email: event.target.value }));
                      setErrors((current) => ({ ...current, email: undefined }));
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`${styles.input} ${styles.inputEmail}`}
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className={styles.error}>
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputShell}>
                  <LockKeyhole
                    aria-hidden="true"
                    className={styles.fieldIcon}
                    strokeWidth={2}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, password: event.target.value }));
                      setErrors((current) => ({ ...current, password: undefined }));
                    }}
                    placeholder="Your password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`${styles.input} ${styles.passwordInput}`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                    className={styles.visibilityButton}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" size={20} strokeWidth={2} />
                    ) : (
                      <Eye aria-hidden="true" size={20} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className={styles.error}>
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.submit}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
