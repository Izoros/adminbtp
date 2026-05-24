# Module documents

Module reserve a la base documentaire, aux templates et a la generation PDF.
Le module expose aussi des actions serveur minimales pour creer un document dans Supabase
et mettre a jour son statut.

## Mode donnees

- etat `supabase` conserve tant que la base est joignable, meme si elle est vide ou partiellement incomplete
- repli `demo` reserve aux cas ou Supabase est indisponible ou repond en erreur
- placeholders neutres utilises a la place des faux exemples demo si un template ou un document manque encore
