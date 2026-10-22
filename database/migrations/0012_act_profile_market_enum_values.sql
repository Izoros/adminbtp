-- Nouvelles catégories de document : actes de lancement (AE, OS, NOTIFICATION_MARCHE) et pièces
-- de marché structurées (CCAP, CCTP, DPGF, BPU). Isolé dans sa propre migration : PostgreSQL
-- interdit d'utiliser une nouvelle valeur d'enum dans la même transaction que son ajout.
alter type document_category add value 'AE';
alter type document_category add value 'OS';
alter type document_category add value 'NOTIFICATION_MARCHE';
alter type document_category add value 'CCAP';
alter type document_category add value 'CCTP';
alter type document_category add value 'DPGF';
alter type document_category add value 'BPU';
