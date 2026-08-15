-- ==========================================
-- Stride v0.1 Database Schema - Module 01: Enums & Common Functions
-- ==========================================

-- Goal Lifecycle Status Enum (Safe Re-runnable DO Block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status') THEN
    CREATE TYPE public.goal_status AS ENUM (
      'planning',
      'active',
      'paused',
      'completed',
      'archived'
    );
  END IF;
END $$;

-- Priority System Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE public.priority_level AS ENUM (
      'low',
      'medium',
      'high',
      'critical'
    );
  END IF;
END $$;

-- Milestone Status Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') THEN
    CREATE TYPE public.milestone_status AS ENUM (
      'pending',
      'in_progress',
      'completed',
      'skipped'
    );
  END IF;
END $$;

-- Task Status Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM (
      'todo',
      'in_progress',
      'completed',
      'archived'
    );
  END IF;
END $$;

-- Shared updated_at timestamp trigger function (Hardened search_path = '')
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';
