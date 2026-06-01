'use client';

import { Box, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconLeaf } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Box style={{ minHeight: '100vh', background: 'radial-gradient(circle at 78% 0%, rgba(255,255,255,0.92) 0%, rgba(247,248,247,0.72) 28%, transparent 52%), radial-gradient(circle at 14% 8%, rgba(243,244,245,0.9) 0%, rgba(247,248,247,0.5) 34%, transparent 58%), linear-gradient(180deg, #F3F4F5 0%, #F7F8F7 22%, #F7F8F7 100%)' }}>
      <Box
        style={{
          height: 64,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #DCE5DD',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <Group justify="space-between" style={{ width: '100%' }}>
          <Group gap={12}>
            <Tooltip label="Go back" position="right">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                radius="xl"
                onClick={() => router.back()}
                aria-label="Go back"
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Group gap={8}>
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconLeaf size={16} color="white" strokeWidth={2} />
              </Box>
              <Text fw={700} size="sm" style={{ color: '#0F172A' }}>
                Sigma Arome
              </Text>
            </Group>
          </Group>
          <Text size="xs" style={{ color: '#9CA3AF' }}>Account Settings</Text>
        </Group>
      </Box>

      <Box style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {children}
      </Box>
    </Box>
  );
}
