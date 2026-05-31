'use client';

import { Stack, Title, Text, Group, Badge, Button, Paper, Alert, Divider, Table, RingProgress, Center } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX, IconHandStop, IconRobot } from '@tabler/icons-react';
import { Textarea } from '@/components/ui/textarea';

interface Batch {
  id: string;
  batch_number: string;
  material_id: string;
  batch_type: string;
  qty: number;
  unit: string;
  status: string;
  expiry_date: string | null;
}
interface Inspection {
  id: string;
  inspection_number: string;
  status: string;
  decision: string | null;
  decision_reason: string | null;
}
interface CVResult {
  defect_type: string;
  confidence_score: number;
  recommendation: string;
  is_simulated: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  qc_pending: 'orange',
  under_qc: 'blue',
  approved: 'green',
  hold: 'yellow',
  rejected: 'red',
};

const REC_COLORS: Record<string, string> = {
  approve: 'green',
  review: 'orange',
  reject: 'red',
};

const INSPECTABLE_STATUSES = ['qc_pending', 'under_qc', 'hold'];

export default function QCInspectPage() {
  const router = useRouter();
  const { id } = useParams();
  const batchId = id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [cvResult, setCvResult] = useState<CVResult | null>(null);
  const [reason, setReason] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);

  // Poll for CV result — used when the auto-trigger hasn't completed yet
  const pollCvResult = async (inspectionId: string, maxAttempts = 10): Promise<CVResult | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const cv = await fetch(`/api/items/cv_results?filter[qc_id][_eq]=${inspectionId}&limit=1`)
          .then(r => r.json());
        const result: CVResult | null = cv?.data?.[0] ?? null;
        if (result) return result;
      } catch { /* keep polling */ }
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    return null;
  };

  useEffect(() => {
    // Load batch
    fetch(`/api/items/batches/${batchId}`)
      .then(r => r.json()).then(d => setBatch(d?.data ?? null)).catch(() => {});

    // Load existing inspection (auto-created by backend when batch hit qc_pending)
    fetch(`/api/items/qc_inspections?filter[batch_id][_eq]=${batchId}&sort[]=-started_at&limit=1`)
      .then(r => r.json())
      .then(async d => {
        const insp: Inspection | null = d?.data?.[0] ?? null;
        setInspection(insp);

        if (insp?.id) {
          // Try to load the pre-generated CV result immediately
          const cv = await fetch(`/api/items/cv_results?filter[qc_id][_eq]=${insp.id}&limit=1`)
            .then(r => r.json()).catch(() => null);
          const cvData: CVResult | null = cv?.data?.[0] ?? null;

          if (cvData) {
            setCvResult(cvData);
          } else {
            // CV not ready yet — poll for it (auto-trigger may still be running)
            setCvLoading(true);
            const polled = await pollCvResult(insp.id);
            setCvResult(polled);
            setCvLoading(false);
          }
        }
      }).catch(() => {});
  }, [batchId]);

  const makeDecision = async (decision: 'approved' | 'hold' | 'rejected') => {
    if ((decision === 'hold' || decision === 'rejected') && !reason.trim()) {
      notifications.show({ title: 'Required', message: 'Hold/Reject requires a reason', color: 'orange' });
      return;
    }
    if (!inspection) return;
    setDeciding(true);
    try {
      await fetch(`/api/items/qc_inspections/${inspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          status: decision,
          decision_reason: reason || null,
          completed_at: new Date().toISOString(),
        }),
      });
      await fetch(`/api/items/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision }),
      });
      setBatch(b => b ? { ...b, status: decision } : b);
      setInspection(i => i ? { ...i, decision } : i);
      notifications.show({
        title: 'Decision Recorded',
        message: `Batch marked as ${decision}`,
        color: decision === 'approved' ? 'green' : decision === 'hold' ? 'yellow' : 'red',
      });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setDeciding(false);
    }
  };

  if (!batch) return <Text>Loading...</Text>;

  const canDecide = !!inspection && (!inspection.decision || inspection.decision === 'pending');
  const isCompleted = !!inspection && !!inspection.decision && inspection.decision !== 'pending';
  const isInspectable = INSPECTABLE_STATUSES.includes(batch.status);

  const confidencePct = cvResult ? Math.round(cvResult.confidence_score * 100) : 0;
  const ringColor = cvResult
    ? cvResult.recommendation === 'approve' ? 'green'
      : cvResult.recommendation === 'reject' ? 'red'
      : 'orange'
    : 'gray';

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2}>QC Inspection</Title>
          <Text c="dimmed" size="sm">Batch: <strong>{batch.batch_number}</strong></Text>
        </div>
        <Badge size="lg" color={STATUS_COLORS[batch.status] ?? 'gray'} variant="light">
          {batch.status.replace(/_/g, ' ')}
        </Badge>
      </Group>

      {/* Batch summary */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="xl">
          <Text size="sm"><strong>Quantity:</strong> {batch.qty} {batch.unit}</Text>
          <Text size="sm"><strong>Type:</strong> {batch.batch_type?.replace(/_/g, ' ') ?? 'N/A'}</Text>
          <Text size="sm"><strong>Expiry:</strong> {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}</Text>
        </Group>
      </Paper>

      {/* Image quality score - shown as soon as available, above the decision panel */}
      {cvLoading && (
        <Alert color="blue" variant="light" icon={<IconRobot size={16} />}>
          Image quality check is running. Results will appear here automatically.
        </Alert>
      )}

      {cvResult && isInspectable && (
        <>
          <Divider label="Image Quality Check" labelPosition="left" />
          <Paper p="md" radius="md" withBorder>
            <Group align="flex-start" gap="xl">
              {/* Confidence ring */}
              <Center>
                <RingProgress
                  size={90}
                  thickness={8}
                  roundCaps
                  sections={[{ value: confidencePct, color: ringColor }]}
                  label={
                    <Center>
                      <Text size="sm" fw={700}>{confidencePct}%</Text>
                    </Center>
                  }
                />
              </Center>

              {/* Image check details */}
              <Stack gap={6} style={{ flex: 1 }}>
                <Alert icon={<IconAlertCircle size={14} />} color="blue" variant="light" p="xs">
                  <Text size="xs">
                    This is a suggestion only. The inspector makes the final QC decision.
                  </Text>
                </Alert>
                <Table withTableBorder>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={500} w={160}>Detected issue</Table.Td>
                      <Table.Td>
                        <Badge color={cvResult.defect_type === 'none' ? 'green' : 'red'} variant="light">
                          {cvResult.defect_type === 'none' ? 'None' : cvResult.defect_type.replace(/_/g, ' ')}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Confidence</Table.Td>
                      <Table.Td>{confidencePct}%</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Suggested decision</Table.Td>
                      <Table.Td>
                        <Badge size="md" color={REC_COLORS[cvResult.recommendation] ?? 'gray'} variant="filled">
                          {cvResult.recommendation.toUpperCase()}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Stack>
            </Group>
          </Paper>
        </>
      )}

      {/* ── QC DECISION PANEL ── */}
      {canDecide && (
        <>
          <Divider label="Your QC Decision" labelPosition="left" />
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              <Textarea
                label="Reason for hold or rejection"
                placeholder="Required for Hold or Reject. Optional for Approve."
                value={reason}
                onChange={(v) => setReason(String(v ?? ''))}
              />
              <Group>
                <Button leftSection={<IconCheck size={16} />} color="green" loading={deciding} onClick={() => makeDecision('approved')}>
                  Approve
                </Button>
                <Button leftSection={<IconHandStop size={16} />} color="yellow" loading={deciding} onClick={() => makeDecision('hold')}>
                  Hold
                </Button>
                <Button leftSection={<IconX size={16} />} color="red" loading={deciding} onClick={() => makeDecision('rejected')}>
                  Reject
                </Button>
              </Group>
            </Stack>
          </Paper>
        </>
      )}

      {/* Completed state */}
      {isCompleted && (
        <>
          {cvResult && (
            <>
              <Divider label="Image Quality Check" labelPosition="left" />
              <Paper p="md" radius="md" withBorder>
                <Group align="flex-start" gap="xl">
                  <Center>
                    <RingProgress
                      size={90}
                      thickness={8}
                      roundCaps
                      sections={[{ value: confidencePct, color: ringColor }]}
                      label={
                        <Center>
                          <Text size="sm" fw={700}>{confidencePct}%</Text>
                        </Center>
                      }
                    />
                  </Center>
                  <Stack gap={6} style={{ flex: 1 }}>
                    <Table withTableBorder>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td fw={500} w={160}>Detected issue</Table.Td>
                          <Table.Td>
                            <Badge color={cvResult.defect_type === 'none' ? 'green' : 'red'} variant="light">
                              {cvResult.defect_type === 'none' ? 'None' : cvResult.defect_type.replace(/_/g, ' ')}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td fw={500}>Confidence</Table.Td>
                          <Table.Td>{confidencePct}%</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td fw={500}>Suggested decision</Table.Td>
                          <Table.Td>
                            <Badge size="md" color={REC_COLORS[cvResult.recommendation] ?? 'gray'} variant="filled">
                              {cvResult.recommendation.toUpperCase()}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                        {cvResult.is_simulated && (
                          <Table.Tr>
                            <Table.Td fw={500}>Source</Table.Td>
                            <Table.Td><Badge size="xs" color="gray" variant="outline">Simulated</Badge></Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Stack>
                </Group>
              </Paper>
            </>
          )}
          <Alert
            color={inspection!.decision === 'approved' ? 'green' : inspection!.decision === 'hold' ? 'yellow' : 'red'}
            variant="light"
          >
            <Text fw={500}>Decision: {inspection!.decision?.toUpperCase()}</Text>
            {inspection!.decision_reason && <Text size="sm" mt={4}>{inspection!.decision_reason}</Text>}
          </Alert>
        </>
      )}

      <Button variant="subtle" onClick={() => router.push('/qc/queue')}>← Back to Inspections</Button>
    </Stack>
  );
}
