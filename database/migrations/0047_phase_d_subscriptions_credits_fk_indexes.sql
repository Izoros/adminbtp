-- Index de couverture pour les clés étrangères des tables créées par 0046 (Phase D), même
-- démarche que 0011 (Phase A) : les colonnes déjà couvertes par un index explicite ou le préfixe
-- gauche d'une contrainte unique dans 0046 ne sont pas reprises ici (organization_id de
-- organization_subscriptions/usage_records, unique(organization_id, service_id|idempotency_key) ;
-- organization_id de credit_wallets, unique seul ; service_id, wallet_id, usage_record_id, déjà
-- indexés en 0046).

create index organization_subscriptions_price_id_idx on organization_subscriptions(price_id);
create index organization_subscriptions_activated_by_user_id_idx on organization_subscriptions(activated_by_user_id);
create index organization_subscriptions_cancelled_by_user_id_idx on organization_subscriptions(cancelled_by_user_id);
create index usage_records_recorded_by_user_id_idx on usage_records(recorded_by_user_id);
create index credit_transactions_performed_by_user_id_idx on credit_transactions(performed_by_user_id);
