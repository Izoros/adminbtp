-- Phase 34 - Extension des mappings Odoo vers les domaines sociaux.

ALTER TYPE public.odoo_binding_type ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE public.odoo_binding_type ADD VALUE IF NOT EXISTS 'employment_contract';
ALTER TYPE public.odoo_binding_type ADD VALUE IF NOT EXISTS 'attendance';
ALTER TYPE public.odoo_binding_type ADD VALUE IF NOT EXISTS 'time_off';
ALTER TYPE public.odoo_binding_type ADD VALUE IF NOT EXISTS 'timesheet';
ALTER TYPE public.odoo_binding_type ADD VALUE IF NOT EXISTS 'payslip';
