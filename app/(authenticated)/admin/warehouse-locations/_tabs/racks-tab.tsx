'use client';

import { CrudTab } from './crud-tab';

export function RacksTab() {
  return (
    <CrudTab
      collection="racks"
      description="Racks within a zone (e.g. RACK-A1). A rack groups bins and has a total weight capacity."
      fields={['code', 'zone_id', 'capacity_kg', 'status']}
      createTitle="Create Rack"
      editTitle="Edit Rack"
      excludeFields={['date_created', 'date_updated']}
    />
  );
}
