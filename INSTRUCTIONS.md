# Instructions de Build - Tiny Platformer

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- JDK 21
- Android SDK avec les build tools
- Connexion internet (pour télécharger les dépendances Gradle)

## 🚀 Construction de l'APK

### Méthode 1 : Script automatique

```bash
./build-apk.sh
```

### Méthode 2 : Commandes manuelles

```bash
# 1. Installer les dépendances npm
npm install

# 2. Construire l'APK de release
cd android
./gradlew assembleRelease
```

L'APK sera généré dans : `android/app/build/outputs/apk/release/app-release.apk`

### Méthode 3 : Utiliser Gradle système

Si vous avez Gradle installé sur votre système :

```bash
cd android
gradle assembleRelease
```

## 📱 Installation sur un appareil

### Via USB (ADB)

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via transfert de fichier

1. Copiez le fichier APK sur votre appareil Android
2. Ouvrez le fichier APK depuis le gestionnaire de fichiers
3. Autorisez l'installation depuis des sources inconnues si nécessaire
4. Installez l'application

## 🎮 Comment jouer

- **Bouton gauche (←)** : Déplacer vers la gauche
- **Bouton droite (→)** : Déplacer vers la droite
- Le personnage saute automatiquement quand il touche une plateforme
- Montez le plus haut possible !
- Ne tombez pas en bas de l'écran

## 🐛 Dépannage

### Erreur : "JAVA_HOME is not set"
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

### Erreur : "SDK location not found"
Créez le fichier `android/local.properties` :
```
sdk.dir=/path/to/your/Android/sdk
```

### Erreur de dépendances réseau
Assurez-vous d'avoir une connexion internet active lors de la première compilation.

## 📦 Structure du projet

```
TinyMobileApp/
├── App.js                  # Code principal du jeu
├── index.js               # Point d'entrée React Native
├── package.json           # Dépendances npm
├── android/               # Configuration Android
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/tinymobileapp/
│   │   │   └── res/
│   │   └── build.gradle
│   └── build.gradle
└── build-apk.sh          # Script de build automatique
```

## 🎨 Personnalisation

Pour modifier le jeu, éditez `App.js` :
- `GRAVITY` : Force de gravité
- `JUMP_FORCE` : Hauteur du saut
- `MOVE_SPEED` : Vitesse de déplacement
- `PLATFORM_WIDTH` : Largeur des plateformes

## 📝 Notes

- L'APK est signé avec une clé de debug (non adapté pour le Play Store)
- Pour une version production, générez une vraie clé de signature
- Le jeu utilise React Native 0.73.2
