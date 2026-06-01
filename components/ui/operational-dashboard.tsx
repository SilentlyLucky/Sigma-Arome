'use client';

import { Anchor, Badge, Box, Group, Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Lightbulb, TriangleAlert } from 'lucide-react';

export interface InsightItem {
  title: string;
  description: string;
  tone?: 'good' | 'watch' | 'risk' | 'info';
  href?: string;
  action?: string;
}

const toneStyles = {
  good: {
    icon: CheckCircle2,
    bg: '#EEF8F0',
    border: '#BFE7C7',
    color: '#207A38',
  },
  watch: {
    icon: Lightbulb,
    bg: '#FFF8E6',
    border: '#F6D98B',
    color: '#A76500',
  },
  risk: {
    icon: TriangleAlert,
    bg: '#FFF1EF',
    border: '#F2B8B0',
    color: '#B42318',
  },
  info: {
    icon: Lightbulb,
    bg: '#EEF6FF',
    border: '#B9D9FF',
    color: '#175CD3',
  },
};

export function OperationalInsightPanel({
  title = 'Planning Insights',
  subtitle = 'What the current work means and what to do next.',
  items,
}: {
  title?: string;
  subtitle?: string;
  items: InsightItem[];
}) {
  return (
    <Paper
      p="lg"
      radius="md"
      withBorder
      style={{
        borderColor: '#E2E5E2',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(253,253,252,0.98) 100%)',
        boxShadow: '0 16px 38px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <Stack gap={2}>
          <Text fw={800} size="sm" style={{ color: '#132018', letterSpacing: '-0.01em' }}>
            {title}
          </Text>
          <Text size="xs" style={{ color: '#66766B' }}>
            {subtitle}
          </Text>
        </Stack>
        <Badge variant="light" color="green">
          Decision Support
        </Badge>
      </Group>

      <Stack gap="sm">
        {items.map((item) => {
          const tone = toneStyles[item.tone ?? 'info'];
          const Icon = tone.icon;
          const content = (
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <Box
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tone.bg,
                  border: `1px solid ${tone.border}`,
                }}
              >
                <Icon size={17} color={tone.color} strokeWidth={2.2} />
              </Box>
              <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
                <Group gap={8} wrap="nowrap">
                  <Text fw={700} size="sm" style={{ color: '#16241B', lineHeight: 1.25 }}>
                    {item.title}
                  </Text>
                  {item.action && (
                    <Badge size="xs" variant="light" color={item.tone === 'risk' ? 'red' : 'green'}>
                      {item.action}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" style={{ color: '#65736A', lineHeight: 1.45 }}>
                  {item.description}
                </Text>
              </Stack>
              {item.href && <ArrowRight size={16} color="#7A897F" style={{ flexShrink: 0, marginTop: 8 }} />}
            </Group>
          );

          return item.href ? (
            <Anchor key={`${item.title}-${item.description}`} href={item.href} underline="never">
              <Box
                p="sm"
                style={{
                  borderRadius: 12,
                  border: '1px solid #E5E8E5',
                  backgroundColor: '#FFFFFF',
                  transition: 'transform 140ms ease, border-color 140ms ease',
                }}
              >
                {content}
              </Box>
            </Anchor>
          ) : (
            <Box
              key={`${item.title}-${item.description}`}
              p="sm"
              style={{
                borderRadius: 12,
                border: '1px solid #E5E8E5',
                backgroundColor: '#FFFFFF',
              }}
            >
              {content}
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

export function OperationalBarList({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper p="lg" radius="md" withBorder style={{ borderColor: '#E2E5E2', backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.045)' }}>
      <Group justify="space-between" align="flex-start" mb="md">
        <Stack gap={2}>
          <Text fw={800} size="sm" style={{ color: '#16241B' }}>
            {title}
          </Text>
          <Text size="xs" style={{ color: '#66766B' }}>
            {subtitle}
          </Text>
        </Stack>
        {badge}
      </Group>
      <Stack gap="md">{children}</Stack>
    </Paper>
  );
}

export function OperationalBar({
  label,
  description,
  value,
  max,
  color = '#2E7D32',
  href,
}: {
  label: string;
  description: string;
  value: number;
  max: number;
  color?: string;
  href?: string;
}) {
  const width = value === 0 ? 0 : Math.max(8, Math.round((value / Math.max(max, 1)) * 100));
  const content = (
    <Box>
      <Group justify="space-between" mb={5} wrap="nowrap">
        <Stack gap={0}>
          <Text size="xs" fw={800} tt="uppercase" style={{ color: '#4C5B51', letterSpacing: '0.04em' }}>
            {label}
          </Text>
          <Text size="xs" style={{ color: '#7A897F' }}>
            {description}
          </Text>
        </Stack>
        <Text fw={900} style={{ color: value > 0 ? color : '#B7C2BA', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Text>
      </Group>
      <Box h={8} style={{ backgroundColor: '#EDF2ED', borderRadius: 999, overflow: 'hidden' }}>
        <Box
          h="100%"
          w={`${width}%`}
          style={{ backgroundColor: value > 0 ? color : 'transparent', borderRadius: 999, transition: 'width 180ms ease' }}
        />
      </Box>
    </Box>
  );

  return href ? (
    <Anchor href={href} underline="never">
      {content}
    </Anchor>
  ) : content;
}
