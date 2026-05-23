# Module followups

Module reserve aux relances de tresorerie, situations et echeances.

## Notes d'integration

- lecture Supabase avec fallback demo si la configuration ou les droits ne permettent pas l'acces
- page `/followups` filtrable par `organizationId`, `projectId` ou `situationId`
- priorisation automatique d'une situation encore actionnable avant projection des relances
