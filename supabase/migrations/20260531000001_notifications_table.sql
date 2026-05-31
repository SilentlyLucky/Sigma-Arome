CREATE TABLE IF NOT EXISTS notifications (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_role text        NOT NULL,
  type           text        NOT NULL,
  title          text        NOT NULL,
  message        text        NOT NULL,
  link           text        NOT NULL,
  read           boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role
  ON notifications (recipient_role, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_role_notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_own_notifications"
  ON notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);
