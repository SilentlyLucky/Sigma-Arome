'use client';

import { Box, Group, Paper, SimpleGrid, Skeleton, Stack } from '@mantine/core';

interface DashboardLoadingProps {
  cards?: number;
  graphPanels?: number;
  queuePanels?: number;
}

function KpiSkeleton() {
  return (
    <Paper p="md" radius="md" withBorder style={{ minHeight: 136 }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={10} style={{ flex: 1 }}>
          <Skeleton height={12} width="55%" radius="xl" />
          <Skeleton height={36} width={56} radius="sm" />
          <Skeleton height={12} width="78%" radius="xl" />
        </Stack>
        <Skeleton height={56} width={56} radius="md" />
      </Group>
    </Paper>
  );
}

function GraphSkeleton() {
  return (
    <Paper p="md" radius="md" withBorder style={{ minHeight: 220 }}>
      <Stack gap="md" h="100%">
        <Skeleton height={18} width="42%" radius="xl" />
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'end', gap: 16, minHeight: 150 }}>
          {[64, 112, 86, 136].map((height, index) => (
            <Skeleton key={index} height={height} radius="sm" />
          ))}
        </Box>
        <Group grow gap="sm">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} height={10} radius="xl" />
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}

function QueueSkeleton() {
  return (
    <Paper p="md" radius="md" withBorder style={{ minHeight: 184 }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={18} width="45%" radius="xl" />
          <Skeleton height={14} width={64} radius="xl" />
        </Group>
        {[0, 1, 2].map((item) => (
          <Group key={item} gap="sm" wrap="nowrap">
            <Skeleton height={34} width={34} radius="md" />
            <Stack gap={6} style={{ flex: 1 }}>
              <Skeleton height={12} width="68%" radius="xl" />
              <Skeleton height={10} width="42%" radius="xl" />
            </Stack>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export function DashboardListLoading({ rows = 3 }: { rows?: number }) {
  return (
    <Stack gap="sm" aria-label="Loading list data">
      {Array.from({ length: rows }).map((_, index) => (
        <Paper key={index} p="md" withBorder>
          <Group gap="sm" wrap="nowrap">
            <Skeleton height={36} width={36} radius="md" />
            <Stack gap={6} style={{ flex: 1 }}>
              <Skeleton height={13} width="62%" radius="xl" />
              <Skeleton height={11} width="38%" radius="xl" />
            </Stack>
            <Skeleton height={24} width={72} radius="xl" />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

export function DashboardLoading({ cards = 4, graphPanels = 2, queuePanels = 2 }: DashboardLoadingProps) {
  const cardCount = Math.max(1, cards);
  const graphCount = Math.max(0, graphPanels);
  const queueCount = Math.max(0, queuePanels);
  const desktopCards = Math.min(cardCount, 4);
  const mobileCards = cardCount === 1 ? 1 : 2;

  return (
    <Stack gap="lg" aria-label="Loading dashboard data">
      <SimpleGrid cols={{ base: mobileCards, sm: desktopCards }} spacing="md">
        {Array.from({ length: cardCount }).map((_, index) => (
          <KpiSkeleton key={index} />
        ))}
      </SimpleGrid>

      {graphCount > 0 && (
        <SimpleGrid cols={{ base: 1, lg: graphCount > 1 ? 2 : 1 }} spacing="md">
          {Array.from({ length: graphCount }).map((_, index) => (
            <GraphSkeleton key={index} />
          ))}
        </SimpleGrid>
      )}

      {queueCount > 0 && (
        <SimpleGrid cols={{ base: 1, lg: queueCount > 2 ? 3 : 2 }} spacing="md">
          {Array.from({ length: queueCount }).map((_, index) => (
            <QueueSkeleton key={index} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
