# 📦 Dossier des APKs - Tiny Platformer

Ce dossier est spécifiquement conçu pour contenir les fichiers APK prêts à distribuer.

## 📥 Comment obtenir l'APK

### ⚠️ Note importante
L'APK n'a pas pu être généré localement car l'environnement de build ne dispose pas d'accès internet pour télécharger les dépendances Gradle nécessaires.

### ✅ Solution : GitHub Actions

**L'APK sera automatiquement généré par GitHub Actions !**

#### Étape 1 : Récupérer l'APK depuis GitHub Actions

1. Allez sur : `https://github.com/ThomasPeligryCesi/TinyMobileApp/actions`
2. Sélectionnez le workflow "Build Android APK" terminé avec succès
3. Téléchargez l'artifact "tiny-platformer-apk"
4. Extrayez le fichier ZIP
5. Vous obtiendrez `app-release.apk`

#### Étape 2 : Placer l'APK dans ce dossier (optionnel)

Si vous souhaitez versionner l'APK dans Git :

```bash
# Copiez l'APK téléchargé ici
cp ~/Downloads/app-release.apk releases/tiny-platformer-v1.0.apk

# Ajoutez et committez
git add releases/tiny-platformer-v1.0.apk
git commit -m "Add APK v1.0 from GitHub Actions"
git push
```

## 📂 Convention de nommage

Utilisez cette convention pour nommer vos APKs :

```
tiny-platformer-v{version}-{type}.apk
```

Exemples :
- `tiny-platformer-v1.0-release.apk`
- `tiny-platformer-v1.1-debug.apk`
- `tiny-platformer-v2.0-release.apk`

## 🚀 APKs disponibles

| Version | Type | Date | Taille | Lien |
|---------|------|------|--------|------|
| v1.0 | release | À générer | ~35 MB | GitHub Actions |

_Les APKs seront ajoutés ici après génération via GitHub Actions_

## 📲 Installation

Une fois l'APK dans ce dossier ou téléchargé :

```bash
# Installation via ADB
adb install releases/tiny-platformer-v1.0-release.apk

# Ou transférez sur votre appareil Android et installez manuellement
```

## 🔄 Workflow de release

### Pour ajouter une nouvelle version :

1. **Générez l'APK** via GitHub Actions (automatique à chaque push)
2. **Téléchargez** l'APK depuis les artifacts
3. **Renommez** selon la convention de nommage
4. **Placez** dans ce dossier `releases/`
5. **Committez** :
   ```bash
   git add releases/
   git commit -m "Add APK v{version}"
   git push
   ```

## 🎯 Accès direct aux APKs

### Via GitHub Releases
Les APKs sont aussi disponibles dans les releases GitHub :
- Allez dans l'onglet "Releases"
- Téléchargez directement l'APK attaché

### Via GitHub Actions Artifacts
- Onglet "Actions"
- Sélectionnez un workflow terminé
- Téléchargez l'artifact

## 📝 Notes

- Ce dossier `releases/` est **exclu du .gitignore**
- Les APKs ailleurs dans le projet restent ignorés
- Taille maximale GitHub : 100 MB par fichier (nos APKs ~30-40 MB)
- Les artifacts Actions sont conservés 30-90 jours
- Les releases GitHub sont permanentes

## 🔐 Vérification de l'APK

Pour vérifier l'intégrité d'un APK :

```bash
# Informations de l'APK
aapt dump badging releases/tiny-platformer-v1.0-release.apk

# Vérifier la signature
jarsigner -verify -verbose -certs releases/tiny-platformer-v1.0-release.apk

# Taille
ls -lh releases/*.apk
```

## 📊 Historique des versions

### v1.0 (Initial Release)
- Jeu de plateforme 2D complet
- Génération infinie verticale
- Contrôles tactiles
- Système de score
- APK signé avec debug keystore

_Les versions futures seront listées ici_

---

**💡 Astuce** : Pour une distribution automatique, utilisez les GitHub Releases créées automatiquement par le workflow Actions. Vous n'avez pas besoin de versionner les APKs dans Git sauf si vous voulez un historique complet dans le repository.
