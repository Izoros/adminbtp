\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  missing_labels TEXT[];
BEGIN
  SELECT array_agg(expected_label ORDER BY expected_label)
  INTO missing_labels
  FROM unnest(
    ARRAY[
      'employee',
      'employment_contract',
      'attendance',
      'time_off',
      'timesheet',
      'payslip'
    ]::TEXT[]
  ) AS expected(expected_label)
  WHERE expected_label NOT IN (
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = 'public.odoo_binding_type'::regtype
  );

  IF missing_labels IS NOT NULL THEN
    RAISE EXCEPTION 'Valeurs Odoo social manquantes: %', missing_labels;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'odoo_mappings'
      AND policyname = 'odoo_mappings_manage_org_members'
  ) THEN
    RAISE EXCEPTION 'La politique de gestion multi-tenant Odoo est absente.';
  END IF;
END;
$$;

ROLLBACK;

SELECT 'Contrats Odoo social Supabase valides' AS result;
