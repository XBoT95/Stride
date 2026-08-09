-- ==========================================
-- Stride v0.1 Database Schema - Module 01: Enums & Common Functions
-- ==========================================

-- Goal Lifecycle Status Enum
CREATE TYPE public.goal_status AS ENUM (
  'planning',
  'active',
  'paused',
  'completed',
  'archived'
);

-- Priority System Enum
CREATE TYPE public.priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Milestone Status Enum
CREATE TYPE public.milestone_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'skipped'
);

-- Task Status Enum
CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'completed',
  'archived'
);

-- Shared updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
