'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Loader } from '@mantine/core';

/**
 * Bin editing (including allowed hazard classes) now happens inline on the
 * Warehouse Location page (Bins tab → click a bin). This legacy detail route
 * redirects there to keep old links working.
 */
export default function EditWarehouseLocationRedirect() {
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
