'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Loader } from '@mantine/core';

/**
 * The Floor Plan now lives in the Warehouse Locations page (Overview tab).
 * This legacy route redirects there to keep old links working.
 */
export default function WarehouseMapRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/warehouse/warehouse-locations');
  }, [router]);
  return (
    <Group justify="center" py="xl">
      <Loader />
    </Group>
  );
}
