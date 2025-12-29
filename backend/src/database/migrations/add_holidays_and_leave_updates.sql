-- Migration: Add holidays table and update leave management schema
-- This migration adds holidays table, updates leave types, and adds approval hierarchy support

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'NATIONAL' CHECK (type IN ('NATIONAL', 'STATE', 'RELIGIOUS', 'FESTIVAL', 'GOVERNMENT')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE, -- For holidays that occur every year on same date
  recurring_month INTEGER CHECK (recurring_month BETWEEN 1 AND 12), -- For variable dates
  recurring_day INTEGER CHECK (recurring_day BETWEEN 1 AND 31),
  year INTEGER, -- NULL for recurring holidays, specific year for one-time holidays
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, name) -- Prevent duplicate holidays on same date
);

-- Create index for holiday lookups
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);

-- Update leave_requests table to support approval hierarchy
ALTER TABLE leave_requests 
  DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_leave_type_check 
  CHECK (leave_type IN ('PL', 'SL', 'CL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPENSATORY', 'BEREAVEMENT', 'OTHER'));

-- Add approval hierarchy fields
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS manager_approval_status VARCHAR(50) DEFAULT 'PENDING' CHECK (manager_approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS manager_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS hr_approval_status VARCHAR(50) DEFAULT 'PENDING' CHECK (hr_approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS hr_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS requires_hr_approval BOOLEAN DEFAULT FALSE;

-- Create leave_policies table for carry-forward and allocation rules
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('PL', 'SL', 'CL', 'MATERNITY', 'PATERNITY', 'UNPAID')),
  yearly_allocation DECIMAL(5, 2) NOT NULL DEFAULT 0,
  max_carry_forward DECIMAL(5, 2) DEFAULT 0, -- 0 means no carry-forward allowed
  max_accrual DECIMAL(5, 2), -- Maximum total (allocated + carry-forward)
  accrual_rate DECIMAL(5, 2), -- Days per month of service
  min_service_months INTEGER DEFAULT 0, -- Minimum months of service before eligibility
  applies_to_employment_type TEXT[], -- Array of employment types this applies to
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(leave_type)
);

-- Insert default leave policies
INSERT INTO leave_policies (leave_type, yearly_allocation, max_carry_forward, max_accrual, accrual_rate, min_service_months, applies_to_employment_type)
VALUES
  ('PL', 12, 5, 15, 1.0, 0, ARRAY['FULL_TIME', 'PART_TIME']),
  ('SL', 12, 0, 12, 1.0, 0, ARRAY['FULL_TIME', 'PART_TIME']),
  ('CL', 12, 0, 12, 1.0, 0, ARRAY['FULL_TIME', 'PART_TIME']),
  ('MATERNITY', 180, 0, 180, 0, 12, ARRAY['FULL_TIME']),
  ('PATERNITY', 15, 0, 15, 0, 12, ARRAY['FULL_TIME']),
  ('UNPAID', 0, 0, NULL, 0, 0, ARRAY['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'])
ON CONFLICT (leave_type) DO NOTHING;

-- Update leave_balances to support carry-forward
ALTER TABLE leave_balances
  ADD COLUMN IF NOT EXISTS carry_forward DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accrued DECIMAL(5, 2) DEFAULT 0;

-- Create index for leave request lookups
CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_status ON leave_requests(manager_approval_status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_hr_status ON leave_requests(hr_approval_status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_date ON leave_requests(status, start_date);

