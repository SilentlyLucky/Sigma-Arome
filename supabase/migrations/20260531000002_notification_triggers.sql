-- ─── Helper function ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insert_notification(
  p_recipient_role text,
  p_type           text,
  p_title          text,
  p_message        text,
  p_link           text
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (recipient_role, type, title, message, link, read, created_at)
  VALUES (p_recipient_role, p_type, p_title, p_message, p_link, false, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Trigger 1: raw_material_orders → ordered ───────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_rmo_ordered()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'ordered' THEN
    PERFORM insert_notification(
      'warehouse',
      'material_order_created',
      'New material order incoming',
      'A new raw material order has been placed and is on its way.',
      '/warehouse/incoming'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rmo_ordered ON raw_material_orders;
CREATE TRIGGER trg_rmo_ordered
  AFTER UPDATE ON raw_material_orders
  FOR EACH ROW EXECUTE FUNCTION trg_fn_rmo_ordered();


-- ─── Trigger 2 + 2b: raw_material_receipts INSERT ───────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_receipt_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM insert_notification(
    'qc',
    'batch_received_qc',
    'New batch waiting for inspection',
    'A raw material receipt was logged. Batches are ready for QC inspection.',
    '/qc/queue'
  );
  PERFORM insert_notification(
    'ppic',
    'material_order_received',
    'Material order received',
    'A raw material receipt has been logged against one of your orders.',
    '/ppic/orders'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receipt_insert ON raw_material_receipts;
CREATE TRIGGER trg_receipt_insert
  AFTER INSERT ON raw_material_receipts
  FOR EACH ROW EXECUTE FUNCTION trg_fn_receipt_insert();


-- ─── Trigger 3: batches → approved ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_batch_approved()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    PERFORM insert_notification(
      'warehouse',
      'batch_qc_approved',
      'QC approved — assign storage',
      'A batch has been approved by QC and needs a storage location assigned.',
      '/warehouse/putaway'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_batch_approved ON batches;
CREATE TRIGGER trg_batch_approved
  AFTER UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION trg_fn_batch_approved();


-- ─── Trigger 3b + 3c: batches → rejected ────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_batch_rejected()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'rejected' THEN
    PERFORM insert_notification(
      'warehouse',
      'batch_qc_rejected',
      'QC rejected a batch',
      'A batch was rejected by QC. Review the batch and coordinate disposal.',
      '/warehouse/batches'
    );
    PERFORM insert_notification(
      'ppic',
      'batch_qc_rejected_ppic',
      'QC rejected a batch',
      'A raw material batch was rejected by QC. The order may need to be re-placed.',
      '/ppic/orders'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_batch_rejected ON batches;
CREATE TRIGGER trg_batch_rejected
  AFTER UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION trg_fn_batch_rejected();


-- ─── Trigger 3d + 3e: batches → hold ────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_batch_hold()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'hold' THEN
    PERFORM insert_notification(
      'warehouse',
      'batch_on_hold',
      'QC placed a batch on hold',
      'A batch has been put on hold by QC. Await further instructions.',
      '/warehouse/batches'
    );
    PERFORM insert_notification(
      'ppic',
      'batch_on_hold_ppic',
      'QC placed a batch on hold',
      'A raw material batch was placed on hold by QC. Monitor the situation.',
      '/ppic/orders'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_batch_hold ON batches;
CREATE TRIGGER trg_batch_hold
  AFTER UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION trg_fn_batch_hold();


-- ─── Trigger 4: production_orders → released ────────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_prod_released()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'released' THEN
    PERFORM insert_notification(
      'warehouse',
      'production_order_released',
      'New production order released',
      'A production order has been released. Prepare materials for the production floor.',
      '/warehouse/production'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prod_released ON production_orders;
CREATE TRIGGER trg_prod_released
  AFTER UPDATE ON production_orders
  FOR EACH ROW EXECUTE FUNCTION trg_fn_prod_released();


-- ─── Trigger 5: production_orders → in_progress ─────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_prod_in_progress()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'in_progress' THEN
    PERFORM insert_notification(
      'production',
      'production_order_started',
      'Materials ready — start production',
      'Materials have been issued. Your production order is ready to execute.',
      '/production/orders'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prod_in_progress ON production_orders;
CREATE TRIGGER trg_prod_in_progress
  AFTER UPDATE ON production_orders
  FOR EACH ROW EXECUTE FUNCTION trg_fn_prod_in_progress();


-- ─── Trigger 6 + 6b: production_orders → completed ──────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_prod_completed()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    PERFORM insert_notification(
      'warehouse',
      'production_order_completed_wh',
      'Production order finished',
      'A production order has been completed. Check for finished goods to put away.',
      '/warehouse/batches'
    );
    PERFORM insert_notification(
      'ppic',
      'production_order_completed_ppic',
      'Production order finished',
      'A production order has been marked as completed.',
      '/ppic/production'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prod_completed ON production_orders;
CREATE TRIGGER trg_prod_completed
  AFTER UPDATE ON production_orders
  FOR EACH ROW EXECUTE FUNCTION trg_fn_prod_completed();


-- ─── Trigger 7: material_requests → submitted ───────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_mr_submitted()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'submitted' THEN
    PERFORM insert_notification(
      'logistic',
      'material_request_submitted',
      'New material request needs coordination',
      'A material request has been submitted and is waiting for logistic coordination.',
      '/logistic/requests'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mr_submitted ON material_requests;
CREATE TRIGGER trg_mr_submitted
  AFTER UPDATE ON material_requests
  FOR EACH ROW EXECUTE FUNCTION trg_fn_mr_submitted();


-- ─── Trigger 8: material_requests → coordinated ─────────────────────────────
CREATE OR REPLACE FUNCTION trg_fn_mr_coordinated()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'coordinated' THEN
    PERFORM insert_notification(
      'warehouse',
      'material_request_coordinated',
      'Movement coordinated — ready to issue',
      'Logistic has coordinated a material request. Issue the materials to production.',
      '/warehouse/issue'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mr_coordinated ON material_requests;
CREATE TRIGGER trg_mr_coordinated
  AFTER UPDATE ON material_requests
  FOR EACH ROW EXECUTE FUNCTION trg_fn_mr_coordinated();
