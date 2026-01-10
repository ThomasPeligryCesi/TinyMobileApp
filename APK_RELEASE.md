# 📱 Tiny Platformer - APK Release

Cette branche est dédiée à la génération et distribution de l'APK Android.

## 🚀 Génération automatique via GitHub Actions

### Méthode 1 : Build automatique sur push
L'APK est automatiquement généré quand vous pushez sur cette branche `claude/mobile-platformer-apk-S4JEa`.

1. Le workflow se lance automatiquement
2. L'APK est construit avec Gradle
3. L'artifact est uploadé et disponible dans l'onglet "Actions" de GitHub
4. Une release est créée automatiquement avec l'APK

### Méthode 2 : Build manuel
Vous pouvez déclencher manuellement un build :

1. Allez dans l'onglet "Actions" sur GitHub
2. Sélectionnez "Manual APK Build"
3. Cliquez sur "Run workflow"
4. Choisissez le type de build (release ou debug)
5. L'APK sera disponible dans les artifacts

## 🔨 Génération locale

### Prérequis
- Node.js 18+
- JDK 17 ou 21
- Android SDK
- Connexion internet (première fois seulement)

### Commandes

```bash
# Installation des dépendances
npm install

# Build Release APK
cd android
./gradlew assembleRelease

# Build Debug APK (plus rapide)
./gradlew assembleDebug
```

### Localisation de l'APK

Après le build, l'APK se trouve à :
- **Release** : `android/app/build/outputs/apk/release/app-release.apk`
- **Debug** : `android/app/build/outputs/apk/debug/app-debug.apk`

## 📥 Téléchargement de l'APK

### Depuis GitHub Actions
1. Allez dans l'onglet "Actions"
2. Cliquez sur le workflow terminé
3. Téléchargez l'artifact "tiny-platformer-apk"

### Depuis les Releases
1. Allez dans l'onglet "Releases"
2. Téléchargez la dernière version
3. Le fichier `app-release.apk` est prêt à installer

## 📲 Installation sur Android

### Méthode 1 : Via ADB (développeurs)
```bash
adb install app-release.apk
```

### Méthode 2 : Installation directe
1. Transférez le fichier APK sur votre appareil Android
2. Ouvrez le fichier avec votre gestionnaire de fichiers
3. Autorisez l'installation depuis des sources inconnues :
   - Allez dans **Paramètres** > **Sécurité**
   - Activez **Sources inconnues** ou **Installer des applications inconnues**
4. Suivez les instructions d'installation

## 🎮 Informations sur l'application

- **Nom** : Tiny Platformer
- **Package** : `com.tinymobileapp`
- **Version** : 1.0
- **SDK minimum** : Android 5.0 (API 21)
- **SDK cible** : Android 14 (API 34)

## 🔐 Signature de l'APK

### Version actuelle (Debug)
L'APK actuel est signé avec une clé de debug pour faciliter les tests.

### Pour une version Production
Pour publier sur le Play Store, vous devez :

1. Générer une clé de signature :
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
  -alias release -keyalg RSA -keysize 2048 -validity 10000
```

2. Configurer `android/app/build.gradle` :
```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword 'votre_password'
        keyAlias 'release'
        keyPassword 'votre_password'
    }
}
```

3. Builder avec la clé de release :
```bash
./gradlew assembleRelease
```

## 🐛 Dépannage

### Erreur : "Could not resolve dependencies"
- Vérifiez votre connexion internet
- Nettoyez le cache Gradle : `./gradlew clean`

### Erreur : "SDK location not found"
Créez `android/local.properties` :
```
sdk.dir=/chemin/vers/android/sdk
```

### L'APK ne s'installe pas
- Vérifiez que vous avez autorisé les sources inconnues
- Désinstallez une éventuelle version précédente
- Vérifiez que votre Android est API 21+ (Android 5.0+)

## 📊 Taille de l'APK

- **Release** : ~30-40 MB (optimisé avec Hermes)
- **Debug** : ~40-50 MB (avec symboles de debug)

## 🔄 Mise à jour

Pour mettre à jour l'application :
1. Désinstallez l'ancienne version OU
2. Installez directement la nouvelle version par-dessus

## ⚙️ Configuration du build

Le fichier `android/app/build.gradle` contient :
- `versionCode` : Incrémentez à chaque nouvelle version
- `versionName` : Version lisible (ex: "1.0", "1.1")
- Configuration ProGuard pour optimiser le code
- Gestion des architectures (arm, x86)

## 📝 Notes importantes

- Les workflows GitHub Actions utilisent des runners Ubuntu
- Le build prend environ 5-10 minutes
- Les artifacts sont conservés 30-90 jours
- Les releases sont permanentes
