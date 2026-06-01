'use client';

import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { AlertCircle, Check, Edit3, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CurrentUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

function getInitials(first: string | null, last: string | null, email: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return email[0].toUpperCase();
}

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0;
  if (password.length < 6) return 1;
  if (password.length < 8) return 2;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const complexity = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  if (password.length >= 8 && complexity === 4) return 4;
  return 3;
}

const STRENGTH_COLORS = ['#D7DCE3', '#EF4444', '#F97316', '#EAB308', '#1F9D45'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_HINTS = [
  'Password strength',
  'Weak: too short. Use at least 8 characters.',
  'Fair: add more length before using this password.',
  'Good: add the missing uppercase, lowercase, number, or symbol for stronger protection.',
  'Strong: long enough and uses mixed character types.',
];

const cardStyles = {
  root: {
    background: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#E2E7E2',
    borderRadius: 8,
    boxShadow: '0 22px 60px rgba(15, 23, 42, 0.07)',
  },
};

const inputStyles = {
  label: {
    color: '#17243A',
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    minHeight: 58,
    borderRadius: 8,
    borderColor: '#DDE4DD',
    color: '#17243A',
    fontWeight: 600,
    boxShadow: 'inset 0 1px 0 rgba(15, 23, 42, 0.02)',
  },
};

export default function AccountSettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) throw new Error('Failed to load user');
        const data = await res.json();
        const u = data.data as CurrentUser;
        setUser(u);
        setFirstName(u.first_name ?? '');
        setLastName(u.last_name ?? '');
      } catch {
        setLoadError('Could not load your account. Please refresh the page.');
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.errors?.[0]?.message ?? 'Failed to save changes');
      }
      setUser((prev) =>
        prev
          ? {
              ...prev,
              first_name: firstName.trim() || null,
              last_name: lastName.trim() || null,
            }
          : prev,
      );
      window.dispatchEvent(new Event('account-profile-updated'));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!user) return;
    setConfirmError(null);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.errors?.[0]?.message ?? 'Failed to update password');
      }
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  }

  const strength = getPasswordStrength(newPassword);
  const initials = user ? getInitials(user.first_name, user.last_name, user.email) : '?';
  const canSubmitPassword = newPassword.length >= 8 && newPassword === confirmPassword;
  const meetsLength = newPassword.length >= 8;
  const meetsComplexity =
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);
  const RequirementIcon = ({ met }: { met: boolean }) =>
    met ? <Check size={17} color="#1F9D45" /> : <XCircle size={17} color="#D04437" />;

  if (loadError) {
    return (
      <Alert icon={<AlertCircle size={16} />} color="red" radius={8}>
        {loadError}
      </Alert>
    );
  }

  return (
    <Stack gap={34}>
      <Box>
        <Group gap={12} align="center">
          <Title order={1} fw={850} style={{ color: '#07122A', letterSpacing: '-0.025em', fontSize: 'clamp(32px, 4vw, 44px)' }}>
            Account Settings
          </Title>
          <ShieldCheck size={28} color="#2C8A3A" strokeWidth={2.2} />
        </Group>
        <Text size="lg" mt={14} style={{ color: '#667085', lineHeight: 1.5 }}>
          Manage your profile information and security preferences.
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={{ base: 22, lg: 30 }}>
        <Paper withBorder p={{ base: 22, md: 36 }} styles={cardStyles}>
          <Stack gap={30}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Group gap={26} align="center" wrap="nowrap">
                {!user ? (
                  <Skeleton circle height={88} width={88} />
                ) : (
                  <Avatar
                    size={88}
                    radius="xl"
                    style={{
                      background: '#D9F0DE',
                      border: '4px solid #F7FBF8',
                      color: '#1F8F3A',
                      fontSize: 28,
                      fontWeight: 850,
                      boxShadow: '0 0 0 3px #CFE9D5',
                    }}
                  >
                    {initials}
                  </Avatar>
                )}
                <Box>
                  <Text fw={850} size="xl" style={{ color: '#111C31', lineHeight: 1.2 }}>
                    Profile Information
                  </Text>
                  <Text size="md" mt={10} style={{ color: '#657185', lineHeight: 1.5, maxWidth: 300 }}>
                    Update your personal information and contact details.
                  </Text>
                </Box>
              </Group>
              <ActionIcon
                variant="default"
                radius={8}
                size={54}
                aria-label="Edit profile"
                styles={{ root: { borderColor: '#DDE4DD', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)' } }}
              >
                <Edit3 size={22} color="#465467" />
              </ActionIcon>
            </Group>

            <Divider color="#E0E5E0" />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={18}>
              {!user ? (
                <>
                  <Skeleton height={84} radius={8} />
                  <Skeleton height={84} radius={8} />
                </>
              ) : (
                <>
                  <TextInput
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    placeholder="First name"
                    styles={inputStyles}
                  />
                  <TextInput
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    placeholder="Last name"
                    styles={inputStyles}
                  />
                </>
              )}
            </SimpleGrid>

            {!user ? (
              <Skeleton height={84} radius={8} />
            ) : (
              <TextInput
                label="Email address"
                value={user.email}
                readOnly
                description="Email is managed by authentication and cannot be changed here."
                rightSection={<LockKeyhole size={21} color="#8A95A6" />}
                styles={{
                  ...inputStyles,
                  description: {
                    color: '#8A95A6',
                    fontWeight: 600,
                    marginTop: 8,
                  },
                  input: {
                    ...inputStyles.input,
                    background: '#F4F6F4',
                    borderColor: '#D6DDD6',
                    color: '#8A95A6',
                    cursor: 'not-allowed',
                    opacity: 0.82,
                    paddingRight: 50,
                  },
                }}
              />
            )}

            {profileError && (
              <Alert icon={<AlertCircle size={16} />} color="red" radius={8}>
                {profileError}
              </Alert>
            )}

            <Button
              fullWidth
              size="lg"
              radius={8}
              disabled={!user}
              loading={savingProfile}
              leftSection={<Check size={18} />}
              onClick={handleSaveProfile}
              styles={{
                root: {
                  minHeight: 58,
                  background: 'linear-gradient(180deg, #22933E 0%, #187730 100%)',
                  boxShadow: '0 8px 18px rgba(31, 143, 58, 0.2)',
                  fontWeight: 850,
                },
              }}
            >
              {profileSaved ? 'Saved' : 'Save Changes'}
            </Button>

            <Paper withBorder radius={8} p={22} mt={18} style={{ background: 'rgba(250, 253, 251, 0.9)', borderColor: '#DDE9DE' }}>
              <Group gap={18} align="flex-start" wrap="nowrap">
                <ShieldCheck size={31} color="#2C8A3A" strokeWidth={2.2} />
                <Box>
                  <Text fw={850} style={{ color: '#1F7A35' }}>
                    Your information is secure
                  </Text>
                  <Text size="sm" mt={8} style={{ color: '#657185', lineHeight: 1.45 }}>
                    We use industry-standard encryption to protect your data.
                  </Text>
                </Box>
              </Group>
            </Paper>
          </Stack>
        </Paper>

        <Paper withBorder p={{ base: 22, md: 36 }} styles={cardStyles}>
          <Stack gap={28}>
            <Group gap={26} align="center" wrap="nowrap">
              <ThemeIcon
                size={88}
                radius={8}
                variant="light"
                color="green"
                styles={{ root: { background: '#EEF7EF', color: '#1F8F3A' } }}
              >
                <LockKeyhole size={38} strokeWidth={2.1} />
              </ThemeIcon>
              <Box>
                <Text fw={850} size="xl" style={{ color: '#111C31', lineHeight: 1.2 }}>
                  Password & Security
                </Text>
                <Text size="md" mt={10} style={{ color: '#657185', lineHeight: 1.5, maxWidth: 330 }}>
                  Update your password to keep your account secure.
                </Text>
              </Box>
            </Group>

            <Divider color="#E0E5E0" />

            <PasswordInput
              label="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.currentTarget.value);
                setPasswordError(null);
              }}
              placeholder="Enter new password"
              error={passwordError && newPassword.length > 0 && newPassword.length < 8 ? passwordError : undefined}
              styles={inputStyles}
            />

            <Box>
              <Group gap={8} align="center" wrap="nowrap">
                {[1, 2, 3, 4].map((seg) => (
                  <Box
                    key={seg}
                    style={{
                      height: 7,
                      flex: 1,
                      borderRadius: 999,
                      backgroundColor: strength >= seg ? STRENGTH_COLORS[strength] : '#D7DCE3',
                      transition: 'background-color 160ms ease',
                    }}
                  />
                ))}
                <Text size="sm" style={{ color: '#8A95A6', width: 138, textAlign: 'right' }}>
                  {newPassword ? STRENGTH_LABELS[strength] : 'Password strength'}
                </Text>
              </Group>
              <Text
                size="sm"
                mt={10}
                style={{
                  color: newPassword ? STRENGTH_COLORS[strength] : '#8A95A6',
                  fontWeight: newPassword ? 700 : 600,
                  lineHeight: 1.4,
                }}
              >
                {STRENGTH_HINTS[strength]}
              </Text>
            </Box>

            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.currentTarget.value);
                setConfirmError(null);
              }}
              placeholder="Repeat new password"
              error={
                confirmError ??
                (confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match.' : undefined)
              }
              styles={inputStyles}
            />

            <Paper withBorder radius={8} p={22} style={{ background: 'rgba(250, 253, 251, 0.9)', borderColor: '#DDE9DE' }}>
              <Group gap={18} align="flex-start" wrap="nowrap">
                <ShieldCheck size={31} color="#2C8A3A" strokeWidth={2.2} />
                <Box>
                  <Text fw={850} style={{ color: '#1F7A35' }}>
                    Password requirements
                  </Text>
                  <Stack gap={8} mt={12}>
                    <Group gap={10} wrap="nowrap">
                      <RequirementIcon met={meetsLength} />
                      <Text size="sm" style={{ color: '#657185' }}>
                        At least 8 characters long
                      </Text>
                    </Group>
                    <Group gap={10} wrap="nowrap">
                      <RequirementIcon met={meetsComplexity} />
                      <Text size="sm" style={{ color: '#657185' }}>
                        Include uppercase, lowercase, number & symbol
                      </Text>
                    </Group>
                  </Stack>
                </Box>
              </Group>
            </Paper>

            {passwordError && (newPassword.length === 0 || newPassword.length >= 8) && (
              <Alert icon={<AlertCircle size={16} />} color="red" radius={8}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert icon={<Check size={16} />} color="green" radius={8}>
                Password updated successfully.
              </Alert>
            )}

            <Button
              fullWidth
              size="lg"
              radius={8}
              disabled={!user || !canSubmitPassword}
              loading={savingPassword}
              leftSection={<LockKeyhole size={18} />}
              onClick={handleChangePassword}
              styles={{
                root: {
                  minHeight: 58,
                  background: 'linear-gradient(180deg, #207B35 0%, #17672D 100%)',
                  boxShadow: '0 8px 18px rgba(31, 143, 58, 0.2)',
                  fontWeight: 850,
                },
              }}
            >
              Update Password
            </Button>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
