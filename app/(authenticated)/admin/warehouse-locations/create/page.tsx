'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Loader } from '@mantine/core';

/**
 * Bin creation now happens inline on the Warehouse Location page (Bins tab → New Bin).
 * This legacy route redirects there to keep old links working.
 */
export default function CreateWarehouseLocationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/warehouse-locations');
  }, [router]);
  return (
    <Group justify="center" py="xl">
      <Loader />
    </Group>
  );
}
