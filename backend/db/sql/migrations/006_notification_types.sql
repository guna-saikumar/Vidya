-- Add missing notification types for administrative broadcasts
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'alert';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'event';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
