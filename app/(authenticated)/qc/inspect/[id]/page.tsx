'use client';

import { Stack, Title, Text, Group, Badge, Button, Paper, Alert, Divider, Table } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX, IconHandStop, IconEye } from '@tabler/icons-react';
import { Textarea } from '@/components/ui/textarea';

interface Batch { id: string; batch_number: string; material_id: string; batch_type: string; qty: number; unit: string; status: string; expiry_date: string | null }
interface Inspection { id: string; inspection_number: string; status: string; decision: string | null; decision_reason: string | null }
interface CVResult { defect_type: string; confidence_score: number; recommendation: string; is_simulated: boolean }

const STATUS_COLORS: Record<string, string> = { qc_pending: 'orange', under_qc: 'blue', approved: 'green', hold: 'yellow', rejected: 'red' };
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
  const [starting, setStarting] = useState(false);
  // QC templates keyed by target_type
  const [templates, setTemplates] = useState<Record<string, string>>({}); // target_type → id

  useEffect(() => {
    fetch(`/api/items/batches/${batchId}`)
      .then(r => r.json()).then(d => setBatch(d?.data ?? null)).catch(() => {});
    fetch(`/api/items/qc_inspections?filter[batch_id][_eq]=${batchId}&sort[]=-started_at&limit=1`)
      .then(r => r.json()).then(d => {
        const insp: Inspection | null = d?.data?.[0] ?? null;
        setInspection(insp);
        if (insp?.id) {
          fetch(`/api/items/cv_results?filter[qc_id][_eq]=${insp.id}&limit=1`)
            .then(r => r.json()).then(cv => setCvResult(cv?.data?.[0] ?? null)).catch(() => {});
        }
      }).catch(() => {});
    // Load active QC templates to auto-select by type
    fetch('/api/items/qc_templates?filter[status][_eq]=active&fields[]=id&fields[]=target_type&limit=20')
      .then(r => r.json()).then(d => {
        const map: Record<string, string> = {};
        for (const t of (d?.data ?? [])) {
          if (!map[t.target_type]) map[t.target_type] = t.id; // first match wins
        }
        setTemplates(map);
      }).catch(() => {});
  }, [batchId]);

  const startInspection = async () => {
    setStarting(true);
    try {
      const inspectionType = batch?.batch_type === 'finished_product' ? 'finished_product' : 'raw_material';
      // Auto-select the matching QC template for this inspection type
      const templateId = templates[inspectionType] ?? null;

      const body: Record<string, unknown> = {
        batch_id: batchId,
        inspection_type: inspectionType,
        // inspector_id is auto-filled by DaaS via user-created special — do NOT send it
      };
      // Only include qc_template_id if we found a matching template
      if (templateId) body.qc_template_id = templateId;

      const res = await fetch('/api/items/qc_inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let errMsg = 'Failed to start inspection';
        try {
          const err = await res.json();
          errMsg = err?.errors?.[0]?.message || err?.message || JSON.stringify(err);
        } catch { /* response wasn't JSON */ }
        throw new Error(errMsg);
      }
      const data = await res.json();
      const newInspection = data?.data ?? null;
      setInspection(newInspection);
      setBatch(b => b ? { ...b, status: 'under_qc' } : b);
      // Update batch status to under_qc
      await fetch(`/api/items/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_qc' }),
      }).catch(() => {});
      // Fetch CV result after a moment (action hook runs async)
      setTimeout(async () => {
        if (newInspection?.id) {
          const cv = await fetch(`/api/items/cv_results?filter[qc_id][_eq]=${newInspection.id}&limit=1`).then(r => r.json()).catch(() => null);
          setCvResult(cv?.data?.[0] ?? null);
        }
      }, 1500);
      notifications.show({ title: 'Inspection Started', message: 'CV analysis is running...', color: 'blue' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setStarting(false);
    }
  };

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
        body: JSON.stringify({ decision, status: decision, decision_reason: reason || null, completed_at: new Date().toISOString() }),
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

  // Decision pending = inspection exists but no final decision yet
  const canDecide = !!inspection && (!inspection.decision || inspection.decision === 'pending');
  const isCompleted = !!inspection && !!inspection.decision && inspection.decision !== 'pending';
  const canStartInspection = !inspection && INSPECTABLE_STATUSES.includes(batch.status);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>QC Inspection</Title>
          <Text c="dimmed" size="sm">Batch: <strong>{batch.batch_number}</strong></Text>
        </div>
        <Badge size="lg" color={STATUS_COLORS[batch.status] ?? 'gray'} variant="light">
          {batch.status.replace(/_/g, ' ')}
        </Badge>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Group gap="xl">
          <Text size="sm"><strong>Quantity:</strong> {batch.qty} {batch.unit}</Text>
          <Text size="sm"><strong>Type:</strong> {batch.batch_type?.replace(/_/g, ' ') ?? 'N/A'}</Text>
          <Text size="sm"><strong>Expiry:</strong> {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}</Text>
        </Group>
      </Paper>

      {canStartInspection && (
        <Button leftSection={<IconEye size={16} />} color="blue" loading={starting} onClick={startInspection}>
          Start QC Inspection
        </Button>
      )}

      {inspection && !cvResult && !canDecide && !isCompleted && (
        <Alert color="blue" variant="light">Inspection started — CV analysis is running. Refresh in a moment to see results.</Alert>
      )}

      {cvResult && (
        <>
          <Divider label="Computer Vision Analysis (Decision Support)" labelPosition="left" />
          <Paper p="md" radius="md" withBorder>
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light" mb="sm">
              This is AI-generated decision support only. The final QC decision is made by the inspector.
              {cvResult.is_simulated && <Text size="xs" c="dimmed" mt={4}>(Simulated result — mock model v1.0)</Text>}
            </Alert>
            <Table withTableBorder>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={500}>Defect Type</Table.Td>
                  <Table.Td>
                    <Badge color={cvResult.defect_type === 'none' ? 'green' : 'red'} variant="light">
                      {cvResult.defect_type === 'none' ? 'No Defect Detected' : cvResult.defect_type.replace(/_/g, ' ')}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>Confidence</Table.Td>
                  <Table.Td>{(cvResult.confidence_score * 100).toFixed(1)}%</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>AI Recommendation</Table.Td>
                  <Table.Td>
                    <Badge color={cvResult.recommendation === 'approve' ? 'green' : cvResult.recommendation === 'reject' ? 'red' : 'orange'} variant="light">
                      {cvResult.recommendation}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      )}

      {canDecide && (
        <>
          <Divider label="QC Decision" labelPosition="left" />
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              <Textarea
                label="Decision Reason"
                placeholder="Required for Hold/Reject. Optional for Approve."
                value={reason}
                onChange={(v) => setReason(String(v ?? ''))}
              />
              <Group>
                <Button leftSection={<IconCheck size={16} />} color="green" loading={deciding} onClick={() => makeDecision('approved')}>Approve</Button>
                <Button leftSection={<IconHandStop size={16} />} color="yellow" loading={deciding} onClick={() => makeDecision('hold')}>Hold</Button>
                <Button leftSection={<IconX size={16} />} color="red" loading={deciding} onClick={() => makeDecision('rejected')}>Reject</Button>
              </Group>
            </Stack>
          </Paper>
        </>
      )}

      {isCompleted && (
        <Alert color={inspection!.decision === 'approved' ? 'green' : inspection!.decision === 'hold' ? 'yellow' : 'red'} variant="light">
          <Text fw={500}>Decision: {inspection!.decision?.toUpperCase()}</Text>
          {inspection!.decision_reason && <Text size="sm" mt={4}>{inspection!.decision_reason}</Text>}
        </Alert>
      )}

      <Button variant="subtle" onClick={() => router.push('/qc/queue')}>← Back to Queue</Button>
    </Stack>
  );
}
