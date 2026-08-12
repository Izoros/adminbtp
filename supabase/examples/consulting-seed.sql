-- Exemple facultatif et non applique automatiquement.
-- Donnees d'amorcage AdminBTP pour le pole expertise.

INSERT INTO public.expert_profiles (
    slug,
    full_name,
    role,
    headline,
    bio,
    specialties,
    credentials,
    seniority_years,
    internal_expert,
    hourly_rate_cents,
    currency_code,
    is_active
)
VALUES
(
    'ingenieur-btp-adminbtp',
    'Ingenieur BTP AdminBTP',
    'btp_engineer',
    'Expert technique chantier et analyse documentaire',
    'Profil interne dedie a l''analyse technique chantier, aux methodologies d''execution, aux DOE, EXE, PPSPS et aux reponses a appels d''offres.',
    ARRAY[
        'questions techniques chantier',
        'analyse documentaire',
        'analyse DOE',
        'analyse EXE',
        'analyse PPSPS',
        'reponse appels d''offres'
    ],
    ARRAY['Ingenieur BTP experimente'],
    12,
    TRUE,
    15000,
    'EUR',
    TRUE
),
(
    'architecte-hmonp-adminbtp',
    'Architecte HMONP AdminBTP',
    'architect_hmonp',
    'Expert architecture, coordination et conformite',
    'Profil interne dedie a la lecture de plans, a la coordination architecturale, aux interfaces entre corps d''etat et aux sujets reglementaires lies a l''urbanisme, ERP et PMR.',
    ARRAY[
        'lecture de plans',
        'coordination architecturale',
        'aide a la conception',
        'details architecturaux',
        'ERP',
        'PMR',
        'urbanisme'
    ],
    ARRAY['Architecte HMONP'],
    10,
    TRUE,
    16500,
    'EUR',
    TRUE
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.expert_requests (
    request_number,
    title,
    description,
    request_type,
    status,
    priority,
    requested_by_name,
    requested_by_email,
    company_name,
    related_entity_type,
    related_entity_id,
    delivery_mode,
    intake_channel
)
VALUES (
    'ER-0001',
    'Analyse DOE lot CVC',
    'Demande d''analyse du DOE pour verifier la completude, les points bloquants et les reserves documentaires avant cloture.',
    'doe_review',
    'submitted',
    2,
    'Client Exemple',
    'client@example.com',
    'Entreprise Exemple',
    'project',
    'project_demo_001',
    'hybrid',
    'internal_demo'
)
ON CONFLICT (request_number) DO NOTHING;
