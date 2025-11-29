# 🚀 Migration rapide - Affichage des dossiers

## Étape 1 : Exécuter la migration SQL

### Via l'interface Supabase
1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Copier le contenu de `sql/add_case_display_fields.sql`
4. Exécuter le script
5. Vérifier que les colonnes sont créées : `case_type`, `assigned_to`, `next_hearing`

### Via la ligne de commande (si vous avez psql)
```bash
psql -h your-supabase-host -U postgres -d postgres -f sql/add_case_display_fields.sql
```

## Étape 2 : Tester l'application

```bash
# Démarrer le serveur de développement
npm run dev
```

## Étape 3 : Vérifications

### ✅ Checklist
- [ ] Les dossiers s'affichent en cartes blanches
- [ ] Les badges de statut sont colorés (Actif/Clôturé/En attente)
- [ ] Les badges de priorité sont affichés à droite
- [ ] Le formulaire contient les nouveaux champs :
  - Type de dossier
  - Assigné à
  - Prochaine audience
- [ ] La création d'un nouveau dossier fonctionne
- [ ] La modification d'un dossier fonctionne
- [ ] Les informations client s'affichent correctement

## 🆘 En cas de problème

### Erreur "column does not exist"
→ La migration SQL n'a pas été exécutée. Retour à l'Étape 1.

### Les cartes ne s'affichent pas en blanc
→ Vérifier que `CaseListItem.jsx` a bien été modifié avec `bg-white`

### Les nouveaux champs ne sont pas dans le formulaire
→ Vérifier `CaseForm.jsx` et s'assurer que `case_type`, `assigned_to` et `next_hearing` sont présents

## 📚 Documentation complète

Voir `REFONTE_AFFICHAGE_DOSSIERS.md` pour tous les détails de la refonte.
