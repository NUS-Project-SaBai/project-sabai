CREATE POLICY "authenticated can receive notifications broadcast"
  ON "realtime"."messages"
  FOR SELECT
  TO authenticated
  USING (
    (realtime.messages.extension = 'broadcast')
    AND (realtime.topic() = 'notifications')
  );