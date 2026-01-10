# 📱 Branche APK - Tiny Platformer

Cette branche (`claude/mobile-platformer-apk-S4JEa`) est spécifiquement dédiée à la **génération et distribution de l'APK Android** du jeu Tiny Platformer.

## 🎯 Objectif de cette branche

- Automatiser la génération de l'APK via GitHub Actions
- Fournir des releases prêtes à installer
- Documenter le processus de build
- Faciliter la distribution de l'application

## 🚀 Comment obtenir l'APK

### Option 1 : Téléchargement automatique (FACILE) ⭐

**L'APK est généré automatiquement par GitHub Actions !**

1. Allez dans l'onglet **"Actions"** du repository
2. Sélectionnez le dernier workflow "Build Android APK" terminé avec succès
3. Téléchargez l'artifact **"tiny-platformer-apk"**
4. Extrayez le fichier ZIP
5. Installez `app-release.apk` sur votre Android

### Option 2 : Via les Releases

1. Allez dans l'onglet **"Releases"**
2. Téléchargez la dernière version
3. Installez directement sur votre appareil Android

### Option 3 : Build manuel

Si vous souhaitez compiler localement :

```bash
git clone <repository-url>
cd TinyMobileApp
git checkout claude/mobile-platformer-apk-S4JEa
npm install
cd android
./gradlew assembleRelease
```

Voir `GENERATE_APK.md` pour les détails complets.

## 📋 Workflows disponibles

### 1. Build Android APK (Automatique)
- **Déclenchement** : Push sur cette branche
- **Actions** :
  - ✅ Compile l'APK de release
  - ✅ Upload en tant qu'artifact
  - ✅ Crée une release GitHub
- **Durée** : ~5-10 minutes

### 2. Manual APK Build (Manuel)
- **Déclenchement** : Workflow dispatch manuel
- **Options** : Release ou Debug
- **Actions** :
  - ✅ Compile l'APK selon le type choisi
  - ✅ Upload en tant qu'artifact
- **Durée** : ~5-10 minutes

## 📁 Structure de cette branche

```
TinyMobileApp/
├── .github/workflows/
│   ├── build-apk.yml          # Workflow automatique
│   └── manual-build.yml       # Workflow manuel
├── android/                    # Configuration Android
│   └── app/build/outputs/apk/
│       ├── release/           # APK release (après build)
│       └── debug/             # APK debug (après build)
├── APK_RELEASE.md             # Documentation détaillée APK
├── GENERATE_APK.md            # Guide de génération
├── README_APK_BRANCH.md       # Ce fichier
└── build-apk.sh               # Script de build local
```

## 🎮 Informations sur l'application

| Paramètre | Valeur |
|-----------|--------|
| **Nom** | Tiny Platformer |
| **Package** | com.tinymobileapp |
| **Version** | 1.0 |
| **Version Code** | 1 |
| **Min SDK** | 21 (Android 5.0) |
| **Target SDK** | 34 (Android 14) |
| **Taille APK** | ~30-40 MB |

## 📱 Fonctionnalités du jeu

- 🎮 Contrôles tactiles gauche/droite
- 📈 Génération infinie de plateformes vers le haut
- 🏃 Physique réaliste avec gravité et sauts
- 🎯 Système de score et high score
- 💀 Game over quand on tombe
- 🔄 Restart instantané
- 🎨 Interface colorée et intuitive

## 🔄 Processus de release

### Quand vous pushez sur cette branche :

1. **GitHub Actions démarre** automatiquement
2. **Installation** des dépendances (Node.js, JDK, Android SDK)
3. **Build** de l'APK de release avec Gradle
4. **Tests** de base (vérification que l'APK existe)
5. **Upload** en tant qu'artifact (conservé 30 jours)
6. **Création** d'une release GitHub avec tag automatique
7. **Publication** de l'APK dans la release

### Version de la release

Format : `v{versionName}-{buildNumber}`

Exemple : `v1.0-42` (version 1.0, build #42)

## 📥 Installation sur Android

### Prérequis
- Android 5.0 ou supérieur
- ~50 MB d'espace disponible
- Autorisation d'installer des apps tierces

### Étapes d'installation

1. **Téléchargez** `app-release.apk`
2. **Transférez** sur votre appareil (ou téléchargez directement)
3. **Ouvrez** le fichier APK
4. **Autorisez** l'installation de sources inconnues si demandé :
   - Allez dans **Paramètres** → **Sécurité**
   - Activez **"Installer des apps inconnues"** pour votre navigateur/gestionnaire de fichiers
5. **Installez** l'application
6. **Jouez** !

## 🎯 Comment jouer

- **Bouton ←** : Déplacer le personnage vers la gauche
- **Bouton →** : Déplacer le personnage vers la droite
- Le personnage **saute automatiquement** sur les plateformes
- Objectif : **Montez le plus haut possible** !
- Attention : **Ne tombez pas** en bas de l'écran

## 🔐 Sécurité et signature

### Version actuelle (Debug keystore)
L'APK actuel est signé avec une **clé de debug** pour faciliter les tests et le développement.

⚠️ **Cette version est parfaite pour** :
- Tests et développement
- Distribution personnelle
- Démos et prototypes

❌ **Pas adapté pour** :
- Publication sur Google Play Store
- Distribution commerciale

### Pour une version production

Pour une release commerciale, générez une vraie clé :

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias tinymobileapp \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Puis configurez `android/app/build.gradle` avec vos informations de signature.

## 🐛 Support et dépannage

### L'APK ne s'installe pas
- Vérifiez la version Android (minimum 5.0)
- Autorisez les sources inconnues
- Désinstallez les versions précédentes

### Le jeu lag ou freeze
- Fermez les apps en arrière-plan
- Vérifiez que votre appareil a au moins 2 GB RAM
- Redémarrez l'application

### Autres problèmes
Consultez les fichiers :
- `APK_RELEASE.md` - Guide complet des releases
- `GENERATE_APK.md` - Problèmes de compilation
- `INSTRUCTIONS.md` - Instructions générales

## 📊 Métriques

Les workflows GitHub Actions vous donnent accès à :
- ✅ Temps de build
- ✅ Taille de l'APK
- ✅ Logs complets
- ✅ Historique des builds
- ✅ Artifacts disponibles

## 🔄 Mises à jour futures

Pour publier une nouvelle version :

1. Mettez à jour `versionCode` et `versionName` dans `android/app/build.gradle`
2. Committez les changements
3. Pushez sur cette branche
4. GitHub Actions génère automatiquement la nouvelle version
5. Une nouvelle release est créée

## 📞 Contact

Pour questions ou problèmes :
- Ouvrez une **Issue** sur GitHub
- Consultez la **documentation** dans ce repository
- Vérifiez les **logs** des workflows Actions

---

**🎮 Amusez-vous bien avec Tiny Platformer ! 🎮**
