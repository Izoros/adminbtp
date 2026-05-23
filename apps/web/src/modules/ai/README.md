# Module ai

Module reserve aux assistants IA metier sous validation humaine.

## Contenu

- types de suggestions IA
- services de gouvernance et de tracabilite
- composants de visualisation
- tests des garde-fous de validation humaine

## Mode donnees

- lecture Supabase en priorite pour les suggestions et les logs d'audit
- fallback demo conserve pour permettre le developpement hors base active

## Ecritures minimales

- validation ou rejet d'une suggestion IA depuis la page `ai`
- creation systematique d'une trace d'audit associee
