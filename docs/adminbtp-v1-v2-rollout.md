# AdminBTP - Deploiement logique V1 / V2

## Objectif

Faire evoluer AdminBTP d'un outil de gestion administrative vers une plateforme de gestion et d'accompagnement technique BTP, sans surcharger la V1.

## V1 - Socle invisible mais structurant

La V1 doit livrer les briques non visibles qui rendent possible la commercialisation future des prestations d'expertise:

- tables `expert_profiles`, `expert_requests`, `consulting_missions`, `consulting_hours`, `technical_reviews`
- enums de statuts et de facturation
- liens generiques vers objets metier futurs
- donnees d'amorcage pour les deux profils experts internes
- droits d'acces a prevoir plus tard par role

### Parcours rendus possibles des la V1

Sans ecrans specifiques, le systeme peut deja:

- enregistrer une demande d'avis expert
- rattacher cette demande a un chantier, projet ou document
- transformer la demande en mission de conseil
- suivre le temps consomme
- produire une revue technique historisee

## V1.5 - Activation operationnelle minimale

Premiere couche visible a developper apres la V1:

- formulaire de creation de demande expert
- liste des demandes et statuts
- fiche mission avec suivi des heures
- fiche revue technique avec synthese et recommandations

### Priorite ecrans

1. `expert_requests`
2. `consulting_missions`
3. `technical_reviews`
4. `consulting_hours`

## V2 - Monetisation et industrialisation

La V2 peut ouvrir les prestations de conseil comme offre commerciale complete:

- forfaits de conseil
- consultations ingenieur
- consultations architecte HMONP
- suivi d'enveloppes d'heures
- pre-facturation ou export vers facturation
- tableaux de bord de consommation

## Workflows cibles

### Workflow 1 - Ticket technique

1. Un client ou gestionnaire cree une `expert_request`.
2. La demande est qualifiee puis affectee a un `expert_profile`.
3. Si la demande devient vendable, une `consulting_mission` est ouverte.
4. Le temps passe est saisi dans `consulting_hours`.
5. L'avis produit est archive dans `technical_reviews`.

### Workflow 2 - Revue documentaire

1. Un document est associe a une `expert_request`.
2. L'expert produit une `technical_review`.
3. Les constats et recommandations deviennent exploitables pour le suivi chantier ou la relation client.

### Workflow 3 - Accompagnement recurrent

1. Un client achete une mission au forfait ou un pack d'heures.
2. Une `consulting_mission` porte l'engagement commercial.
3. Les `consulting_hours` mesurent la consommation reelle.
4. Les `technical_reviews` conservent les livrables emis pendant la mission.

## Recommandations produit

- Faire apparaitre l'expertise humaine comme une offre a part entiere, pas comme un simple support.
- Distinguer dans l'interface future les demandes administratives et les demandes d'expertise.
- Positionner les profils experts comme des ressources identifiables et credibles.
- Prevoir des tableaux de bord distincts pour production, qualite et facturation.

## Recommandations techniques

- Centraliser les references metier futures autour d'identifiants stables.
- Ajouter plus tard des tables de commentaires, pieces jointes et journal d'activite.
- Brancher ensuite la facturation sur `consulting_missions` et `consulting_hours`.
- Conserver la notion `delivery_mode` pour tracer ce qui releve de l'IA, de l'humain ou d'un mode hybride.
