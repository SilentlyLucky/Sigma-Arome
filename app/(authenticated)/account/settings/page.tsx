'use client';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconLock } from '@tabler/icons-react';
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
  if (password.length >= 10 && complexity >= 3) return 4;
  return 3;
}

const STRENGTH_COLORS = ['#E5E7EB', '#EF4444', '#F97316', '#EAB308', '#22C55E'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export default function AccountSettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
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

  if (loadError) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red">
        {loadError}
      </Alert>
    );
  }

  return (
    <Stack gap={32}>
      <div>
        <Title order={2} fw={700} style={{ color: '#0F172A' }}>
          Account Settings
        </Title>
        <Text size="sm" style={{ color: '#6B7280', marginTop: 4 }}>
          Manage your profile and security preferences.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        {/* ── Profile Card ─────────────────────────────── */}
        <Paper
          withBorder
          radius="lg"
          style={{ overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          {/* Green gradient hero band */}
          <Box
            style={{
              height: 80,
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
            }}
          />

          {/* Avatar overlapping the hero */}
          <Box style={{ display: 'flex', justifyContent: 'center', marginTop: -36 }}>
            {!user ? (
              <Skeleton circle height={72} />
            ) : (
              <Avatar
                size={72}
                radius="xl"
                style={{
                  border: '4px solid white',
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  fontSize: 26,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(46,125,50,0.2)',
                }}
              >
                {initials}
              </Avatar>
            )}
          </Box>

          <Stack gap="md" p="xl" pt="lg">
            <Text
              size="xs"
              fw={600}
              tt="uppercase"
              ta="center"
              style={{ color: '#9CA3AF', letterSpacing: '0.06em' }}
            >
              Profile
            </Text>

            <SimpleGrid cols={2} spacing="sm">
              {!user ? (
                <>
                  <Skeleton height={56} radius="sm" />
                  <Skeleton height={56} radius="sm" />
                </>
              ) : (
                <>
                  <TextInput
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    placeholder="First name"
                  />
                  <TextInput
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    placeholder="Last name"
                  />
                </>
              )}
            </SimpleGrid>

            {!user ? (
              <Skeleton height={56} radius="sm" />
            ) : (
              <TextInput
                label="Email"
                value={user.email}
                readOnly
                rightSection={<IconLock size={14} color="#9CA3AF" />}
                styles={{ input: { color: '#6B7280', cursor: 'not-allowed' } }}
              />
            )}

            {profileError && (
              <Alert icon={<IconAlertCircle size={14} />} color="red" py="xs">
                {profileError}
              </Alert>
            )}

            <Button
              color="green"
              disabled={!user}
              loading={savingProfile}
              leftSection={profileSaved ? <IconCheck size={16} /> : undefined}
              onClick={handleSaveProfile}
              style={{
                backgroundColor: profileSaved ? '#16A34A' : '#2E7D32',
                transition: 'background-color 0.2s',
              }}
            >
              {profileSaved ? 'Saved' : 'Save Changes'}
            </Button>
          </Stack>
        </Paper>

        {/* ── Password Card ─────────────────────────────── */}
        <Paper
          withBorder
          radius="lg"
          style={{ overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          {/* Thin gradient top accent stripe */}
          <Box
            style={{
              height: 5,
              background: 'linear-gradient(90deg, #1B5E20, #4CAF50, #1B5E20)',
            }}
          />

          <Stack gap="md" p="xl">
            <div>
              <Text
                size="xs"
                fw={600}
                tt="uppercase"
                style={{ color: '#9CA3AF', letterSpacing: '0.06em' }}
              >
                Password & Security
              </Text>
              <Text size="sm" style={{ color: '#6B7280', marginTop: 4 }}>
                Choose a strong password with at least 8 characters.
              </Text>
            </div>

            <PasswordInput
              label="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.currentTarget.value);
                setPasswordError(null);
              }}
              placeholder="Enter new password"
              error={
                passwordError && newPassword.length > 0 && newPassword.length < 8
                  ? passwordError
                  : undefined
              }
            />

            {/* 4-segment strength bar */}
            <Box>
              <Group gap={4} mb={4} grow>
                {[1, 2, 3, 4].map((seg) => (
                  <Box
                    key={seg}
                    style={{
                      height: 5,
                      borderRadius: 999,
                      backgroundColor:
                        strength >= seg ? STRENGTH_COLORS[strength] : '#E5E7EB',
                      transition: 'background-color 0.2s',
                    }}
                  />
                ))}
              </Group>
              {newPassword.length > 0 && (
                <Text size="xs" fw={500} style={{ color: STRENGTH_COLORS[strength] }}>
                  {STRENGTH_LABELS[strength]}
                </Text>
              )}
            </Box>

            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.currentTarget.value);
                setConfirmError(null);
              }}
              placeholder="Repeat new password"
              error={confirmError ?? undefined}
            />

            {passwordError && (newPassword.length === 0 || newPassword.length >= 8) && (
              <Alert icon={<IconAlertCircle size={14} />} color="red" py="xs">
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert icon={<IconCheck size={14} />} color="green" py="xs">
                Password updated successfully.
              </Alert>
            )}

            <Button
              color="green"
              disabled={!user || !canSubmitPassword}
              loading={savingPassword}
              onClick={handleChangePassword}
              style={{ backgroundColor: '#2E7D32' }}
            >
              Update Password
            </Button>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
