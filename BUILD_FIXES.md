# 🔧 Corrections des erreurs de build Android

## ❌ Problèmes rencontrés

Le build GitHub Actions échouait avec plusieurs erreurs AAPT :

```
ERROR: rn_edit_text_material.xml:13: AAPT: error:
resource android:drawable/editbox_dropdown_background_dark is private.

ERROR: ic_launcher.xml: AAPT: error:
<adaptive-icon> elements require a sdk version of at least 26.
```

## ✅ Solutions appliquées

### 1. Correction de `rn_edit_text_material.xml`

**Problème** : Utilisation d'une ressource Android privée
- `@android:drawable/editbox_dropdown_background_dark` est une ressource privée non accessible

**Solution** : Création d'un drawable personnalisé
```xml
<shape android:shape="rectangle">
    <stroke android:width="1dp" android:color="#60000000" />
    <corners android:radius="4dp" />
</shape>
```

**Avantages** :
- ✅ Compatible avec tous les SDK (21+)
- ✅ Pas de dépendance aux ressources privées Android
- ✅ Apparence cohérente sur toutes les versions

### 2. Correction des icônes de launcher

**Problème** : Adaptive icons dans dossiers incompatibles
- `<adaptive-icon>` nécessite Android 8.0+ (API 26+)
- Les fichiers étaient dans `mipmap-hdpi/` qui s'applique à tous les SDK

**Solution** : Stratégie multi-version

#### A. Pour Android 8.0+ (API 26+)
Créé `mipmap-anydpi-v26/` avec adaptive icons :
```xml
<adaptive-icon>
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

#### B. Pour Android 5.0-7.1 (API 21-25)
Créé un drawable legacy réutilisable :
```xml
<!-- drawable/ic_launcher_legacy.xml -->
<layer-list>
    <item>
        <shape android:shape="rectangle">
            <solid android:color="@color/ic_launcher_background"/>
        </shape>
    </item>
    <item android:drawable="@drawable/ic_launcher_foreground"/>
</layer-list>
```

#### C. Icônes pour toutes les densités
Créé des références dans chaque dossier mipmap :
- `mipmap-mdpi/`
- `mipmap-hdpi/`
- `mipmap-xhdpi/`
- `mipmap-xxhdpi/`
- `mipmap-xxxhdpi/`

Chacun contient :
```xml
<bitmap android:src="@drawable/ic_launcher_legacy"/>
```

### 3. Nettoyage

Supprimé `dimens.xml` car les valeurs sont maintenant en dur dans les drawables.

## 📊 Récapitulatif des changements

| Fichier | Action | Raison |
|---------|--------|--------|
| `rn_edit_text_material.xml` | Modifié | Remplacer ressource privée |
| `ic_launcher_legacy.xml` | Créé | Icône fallback SDK 21-25 |
| `mipmap-anydpi-v26/ic_launcher*.xml` | Créé | Adaptive icons pour SDK 26+ |
| `mipmap-*/ic_launcher*.xml` | Créé/Modifié | Icônes pour toutes densités |
| `dimens.xml` | Supprimé | Plus nécessaire |

## 🎯 Résultat

Le build est maintenant compatible avec :
- ✅ **Android 5.0** (API 21) - minSdkVersion
- ✅ **Android 14** (API 34) - targetSdkVersion
- ✅ **Toutes les densités d'écran** (mdpi à xxxhdpi)

### Icônes adaptatives

| Version Android | Résolution |
|-----------------|------------|
| 5.0 - 7.1 (21-25) | Utilise `ic_launcher_legacy` (layer-list) |
| 8.0+ (26+) | Utilise `adaptive-icon` avec background + foreground |

## 🚀 Vérification

Pour vérifier que le build fonctionne :

```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

Le build devrait réussir sans erreurs AAPT.

## 📱 Test des icônes

Pour vérifier les icônes sur différents appareils :

1. **Android 5.0-7.1** : L'icône apparaît comme un layer-list simple
2. **Android 8.0+** : L'icône est adaptative et réagit aux thèmes

## 🔍 Détails techniques

### Pourquoi utiliser mipmap-anydpi-v26 ?

- `anydpi` = Applicable à toutes les densités
- `v26` = Seulement pour SDK version 26+
- Android choisit automatiquement la bonne ressource selon la version

### Hiérarchie de sélection des ressources

```
Android 8.0+ (API 26+):
  1. mipmap-anydpi-v26/ (adaptive icon) ← CHOISI
  2. mipmap-xxxhdpi/
  3. mipmap-xxhdpi/
  ...

Android 7.1 et moins (API 21-25):
  1. mipmap-anydpi-v26/ (ignoré, SDK < 26)
  2. mipmap-xxxhdpi/ (selon densité) ← CHOISI
  3. mipmap-xxhdpi/
  ...
```

## 📝 Leçons apprises

1. **Ne jamais utiliser de ressources Android privées** (`@android:` avec drawables internes)
2. **Toujours tester sur le minSdkVersion** déclaré
3. **Utiliser les qualifiers de version** (`-v26`) pour les fonctionnalités modernes
4. **Fournir des fallbacks** pour les anciennes versions Android

## 🔗 Références

- [Android Launcher Icons](https://developer.android.com/studio/write/image-asset-studio)
- [Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Resource Qualifiers](https://developer.android.com/guide/topics/resources/providing-resources)
- [Vector Drawables](https://developer.android.com/develop/ui/views/graphics/vector-drawable-resources)

---

**Les corrections ont été appliquées dans le commit `06e69fe`**

Le build GitHub Actions devrait maintenant réussir ! 🎉
