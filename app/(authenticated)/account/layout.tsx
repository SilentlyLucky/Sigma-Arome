'use client';

import { Box, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconLeaf } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#F4F7F5' }}>
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
