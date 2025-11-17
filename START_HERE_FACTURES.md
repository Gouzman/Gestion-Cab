# 🚀 DÉMARRAGE RAPIDE - Correction Factures

## ⚡ Action Immédiate Requise

### Étape 1 : Créer la table dans Supabase (2 minutes)

1. Ouvrir https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur **"SQL Editor"** (menu gauche)
4. Cliquer sur **"+ New query"**
5. Ouvrir le fichier `sql/create_invoices_table.sql` de ce projet
6. Copier tout le contenu
7. Coller dans l'éditeur SQL de Supabase
8. Cliquer sur **"Run"** (ou Cmd+Enter)
9. ✅ Vérifier le message "Success. No rows returned"

### Étape 2 : Tester

```bash
# L'application devrait déjà tourner avec npm run dev
# Sinon, lancer:
npm run dev
```

1. Aller dans **Facturation**
2. Cliquer sur **"Nouvelle Facture"**
3. Remplir les champs et sauvegarder
4. **Rafraîchir la page** (Cmd+R)
5. ✅ **La facture doit toujours être là**

## ✅ C'est tout !

**Avant :** Factures perdues après rafraîchissement  
**Maintenant :** Factures sauvegardées en base de données Supabase

## 🔍 Vérification

Si la facture disparaît encore après rafraîchissement :
1. Vérifier que la table `invoices` existe dans Supabase (Table Editor)
2. Vérifier la console navigateur (F12) pour les erreurs
3. Relancer `npm run dev`

## 📄 Documentation Complète

- `FACTURES_FIX_README.md` - Guide complet
- `INVOICES_PERSISTENCE_FIX.md` - Documentation technique
- `sql/create_invoices_table.sql` - Script SQL à exécuter
