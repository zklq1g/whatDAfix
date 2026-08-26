-- =============================================================================
-- whatDAfix — Production-Ready Supabase Schema
-- =============================================================================

-- 1. Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;           -- 20m radius geospatial queries
-- NOTE: gen_random_uuid() is built-in to Postgres 13+; no uuid-ossp needed.


-- 2. Enums
-- =============================================================================
CREATE TYPE user_role     AS ENUM ('citizen', 'worker', 'admin');
CREATE TYPE ticket_status AS ENUM ('open', 'wip', 'resolved', 'rejected');


-- 3. Profiles Table (Linked to Supabase Auth)
-- =============================================================================
CREATE TABLE profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users NOT NULL,
  display_name TEXT,
  role         user_role   NOT NULL DEFAULT 'citizen',
  trust_score  INT         NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 4. Security Definer Helper (Breaks RLS Infinite Recursion)
-- =============================================================================
-- Called inside RLS policies to safely read the current user's role
-- WITHOUT re-entering the profiles RLS check loop.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;


-- 5. Tickets Table (Core Data)
-- =============================================================================
CREATE TABLE tickets (
  -- Identity
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by         UUID        NOT NULL REFERENCES profiles(id),
  assigned_to        UUID        REFERENCES profiles(id),

  -- Location & Classification
  location           GEOGRAPHY(POINT, 4326) NOT NULL,
  category           TEXT,
  severity           INT         CHECK (severity BETWEEN 0 AND 100),

  -- Clustering (20m Spatial Cluster Feature)
  cluster_id         UUID        REFERENCES tickets(id),
  upvote_count       INT         NOT NULL DEFAULT 0,

  -- Status & Lifecycle
  status             ticket_status NOT NULL DEFAULT 'open',
  frt_deadline       TIMESTAMPTZ,
  wip_started_at     TIMESTAMPTZ,
  sla_deadline       TIMESTAMPTZ,
  resolved_at        TIMESTAMPTZ,

  -- Evidence (Zero-Trust Proof-of-Work)
  before_image_url   TEXT,
  after_image_url    TEXT,
  proof_of_work_hash TEXT,

  -- AI Metadata
  ai_confidence      FLOAT       CHECK (ai_confidence BETWEEN 0 AND 1),
  ai_label           TEXT,

  -- Timestamps
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 6. Indexes (Performance)
-- =============================================================================
CREATE INDEX tickets_location_idx   ON tickets USING GIST(location);
CREATE INDEX tickets_status_idx     ON tickets(status);
CREATE INDEX tickets_created_by_idx ON tickets(created_by);
CREATE INDEX tickets_cluster_id_idx ON tickets(cluster_id);


-- 7. Auto-Update updated_at Trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_set_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- 8. Auto-Set FRT Deadline on Insert (created_at + 24 hours)
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_frt_deadline()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.frt_deadline = NEW.created_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_set_frt_deadline
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_frt_deadline();


-- 9. Enable Row Level Security (RLS)
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets  ENABLE ROW LEVEL SECURITY;


-- 10. RLS Policies — Profiles
-- =============================================================================
CREATE POLICY "profiles: self select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: self update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles: self insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: admin select all"
  ON profiles FOR SELECT
  USING (get_my_role() = 'admin');


-- 11. RLS Policies — Tickets
-- =============================================================================
CREATE POLICY "tickets: authenticated insert"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tickets: select by role"
  ON tickets FOR SELECT
  USING (
    auth.uid() = created_by
    OR get_my_role() IN ('worker', 'admin')
  );

CREATE POLICY "tickets: update by role"
  ON tickets FOR UPDATE
  USING (get_my_role() IN ('worker', 'admin'));

CREATE POLICY "tickets: admin delete"
  ON tickets FOR DELETE
  USING (get_my_role() = 'admin');


-- 12. Auth Sync Trigger (Auto-create profile on signup)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, trust_score)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous Citizen'), 
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'citizen'::user_role), 
    50
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 13. Dynamic SLA Trigger (Set SLA when status moves to 'wip')
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_sla_deadline()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only run if status is changing to 'wip'
  IF OLD.status IS DISTINCT FROM 'wip' AND NEW.status = 'wip' THEN
    NEW.wip_started_at = NOW();
    
    -- Dynamic SLA logic based on severity
    IF NEW.severity >= 80 THEN
      NEW.sla_deadline = NOW() + INTERVAL '48 hours'; -- High severity
    ELSIF NEW.severity >= 50 THEN
      NEW.sla_deadline = NOW() + INTERVAL '3 days';   -- Medium severity
    ELSE
      NEW.sla_deadline = NOW() + INTERVAL '7 days';   -- Low severity
    END IF;
  END IF;
  
  -- Log resolution time
  IF OLD.status IS DISTINCT FROM 'resolved' AND NEW.status = 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_set_sla_deadline
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_sla_deadline();


-- 14. Storage RLS (For civic-evidence bucket)
-- NOTE: Create the 'civic-evidence' bucket in the Supabase Dashboard first!
-- =============================================================================
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'civic-evidence');

-- Allow anyone to view the images (needed for the public dashboard)
CREATE POLICY "Public can view evidence"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'civic-evidence');

-- Allow workers/admins to update/overwrite
CREATE POLICY "Workers can update evidence"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'civic-evidence')
WITH CHECK (bucket_id = 'civic-evidence');

-- =============================================================================
-- Schema complete. Run in: Supabase Dashboard → SQL Editor
-- =============================================================================
