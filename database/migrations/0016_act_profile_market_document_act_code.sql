-- Plusieurs actes partagent la même document_category (ex: tous les OS_* valent 'OS') : act_code
-- distingue l'acte précis émis, sans FK stricte vers act_templates (clé composite mission_family+
-- code) — une correspondance texte suffit pour cet usage de checklist déclarative.
alter table documents add column act_code text;
create index documents_act_code_idx on documents(act_code) where act_code is not null;

update documents set act_code = 'AE' where title = 'Acte d''engagement — Réhabilitation collège de Kawéni';
update documents set act_code = 'NOTIFICATION_MARCHE' where title = 'Notification du marché — Réhabilitation collège de Kawéni';
