# Tiny Platformer

Un jeu de plateforme 2D mobile inspiré de Doodle Jump avec génération verticale infinie.

## Fonctionnalités

- 🎮 Contrôles tactiles gauche/droite
- 📈 Génération infinie de plateformes
- 🏃 Physique réaliste (gravité, saut)
- 🎯 Système de score
- 📱 Application native Android (APK)

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npm run android
```

## Générer l'APK

```bash
cd android
./gradlew assembleRelease
```

L'APK sera généré dans `android/app/build/outputs/apk/release/`

## Comment jouer

- Appuyez sur les boutons gauche (←) et droite (→) pour déplacer le personnage
- Le personnage rebondit automatiquement sur les plateformes
- Montez le plus haut possible pour augmenter votre score
- Ne tombez pas en bas de l'écran !
