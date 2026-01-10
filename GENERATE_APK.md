# 🔨 Comment générer l'APK Tiny Platformer

L'APK n'a pas pu être généré dans l'environnement actuel car il nécessite une connexion internet pour télécharger les dépendances Gradle.

## ✅ Solutions disponibles

### 🌐 Option 1 : GitHub Actions (RECOMMANDÉ)

La manière la plus simple est d'utiliser les workflows GitHub Actions qui sont déjà configurés :

1. **Build automatique** : Poussez simplement sur cette branche
   ```bash
   git push origin claude/mobile-platformer-apk-S4JEa
   ```

2. **Récupérez l'APK** :
   - Allez sur GitHub → onglet "Actions"
   - Attendez que le workflow se termine (~5-10 min)
   - Téléchargez l'artifact "tiny-platformer-apk"
   - L'APK sera également disponible dans les "Releases"

### 💻 Option 2 : Build local (avec connexion internet)

Sur une machine avec accès internet :

```bash
# 1. Clonez le repository
git clone <your-repo-url>
cd TinyMobileApp
git checkout claude/mobile-platformer-apk-S4JEa

# 2. Installez les dépendances
npm install

# 3. Générez l'APK
cd android
./gradlew assembleRelease

# 4. L'APK est disponible à :
# android/app/build/outputs/apk/release/app-release.apk
```

### 🚀 Option 3 : Build manuel simplifié

Utilisez le script fourni :

```bash
./build-apk.sh
```

## 📦 Fichiers générés

Une fois le build réussi, vous obtiendrez :

- **APK Release** : `android/app/build/outputs/apk/release/app-release.apk` (~35 MB)
- **APK Debug** : `android/app/build/outputs/apk/debug/app-debug.apk` (~45 MB)

## 🔍 Vérification de l'APK

Pour vérifier l'APK généré :

```bash
# Informations sur l'APK
aapt dump badging app-release.apk

# Taille de l'APK
ls -lh app-release.apk

# Installation sur un appareil connecté
adb install app-release.apk
```

## ⚙️ Configuration requise

### Pour le build local :
- **Node.js** : v18 ou supérieur
- **JDK** : 17 ou 21 (OpenJDK recommandé)
- **Android SDK** : Build Tools 34.0.0
- **Gradle** : 8.3+ (fourni par gradlew)
- **Connexion Internet** : Requise pour la première build

### Pour l'installation :
- **Android** : Version 5.0 (API 21) minimum
- **Espace disque** : ~50 MB
- **RAM** : 2 GB recommandé

## 📱 Installation de l'APK sur Android

### Méthode 1 : USB (ADB)
```bash
adb install -r app-release.apk
```

### Méthode 2 : Transfert direct
1. Copiez `app-release.apk` sur votre téléphone
2. Ouvrez-le avec le gestionnaire de fichiers
3. Autorisez les "Sources inconnues" si demandé
4. Installez

### Méthode 3 : Google Drive / Dropbox
1. Uploadez l'APK sur un service cloud
2. Téléchargez-le depuis votre téléphone
3. Installez

## 🐛 Résolution des problèmes

### "Could not resolve dependencies"
**Cause** : Pas de connexion internet
**Solution** : Connectez-vous à internet ou utilisez GitHub Actions

### "SDK location not found"
**Cause** : Android SDK non configuré
**Solution** : Créez `android/local.properties` :
```properties
sdk.dir=/path/to/Android/sdk
```

### "JAVA_HOME is not set"
**Cause** : JDK non configuré
**Solution** :
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Build échoue avec Gradle
**Solution** :
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## 📊 Prochaines étapes

Une fois l'APK généré avec succès :

1. ✅ Testez l'installation sur différents appareils Android
2. ✅ Vérifiez que toutes les fonctionnalités fonctionnent
3. ✅ Optimisez la taille si nécessaire (ProGuard, compression)
4. ✅ Préparez pour le Play Store (signature release, screenshots)

## 🔐 Pour une release Play Store

Pour publier sur le Google Play Store :

1. Créez une clé de signature release
2. Configurez les signingConfigs dans build.gradle
3. Générez un APK signé pour production
4. Créez un compte développeur Play Store
5. Uploadez l'APK (ou mieux : un AAB)

Voir `APK_RELEASE.md` pour plus de détails.

---

**Note** : Ce fichier documente le processus de génération d'APK car l'environnement de build actuel n'a pas d'accès internet. Utilisez GitHub Actions pour un build automatisé sans configuration locale.
