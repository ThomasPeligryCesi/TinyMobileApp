import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import {Canvas, Group, Rect, Circle, useFrameCallback} from '@shopify/react-native-skia';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const PLAYER_SIZE = 40;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 15;
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;
const BONUS_SIZE = 30;

// Types de bonus
const BONUS_TYPES = {
  STAR: {id: 'star', color: '#FFD700', points: 10, icon: '⭐'},
  SPRING: {id: 'spring', color: '#FF6B9D', points: 5, boost: -20, icon: '🌸'},
  SHIELD: {id: 'shield', color: '#4ECDC4', points: 15, duration: 5000, icon: '🛡️'},
  MAGNET: {id: 'magnet', color: '#95E1D3', points: 5, duration: 3000, icon: '🧲'},
};

const App = () => {
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [shield, setShield] = useState(false);
  const [magnet, setMagnet] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFPS, setShowFPS] = useState(false);
  const [fps, setFps] = useState(0);

  // Refs pour le state du jeu (pas de re-render nécessaire)
  const gameState = useRef({
    playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    playerY: SCREEN_HEIGHT - 200,
    velocityY: 0,
    velocityX: 0,
    platforms: [],
    bonuses: [],
    cameraY: 0,
    leftPressed: false,
    rightPressed: false,
    shield: false,
    magnet: false,
    shieldTimeout: null,
    magnetTimeout: null,
    frameCount: 0,
    lastFpsUpdate: Date.now(),
    currentScore: 0,
  });

  const initGame = useCallback(() => {
    const platforms = [];
    const bonuses = [];

    // Plateforme de départ
    platforms.push({
      x: SCREEN_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: SCREEN_HEIGHT - 150,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    });

    // Générer des plateformes initiales
    for (let i = 0; i < 8; i++) {
      const minGap = 60;
      const maxGap = 120;
      const gap = Math.random() * (maxGap - minGap) + minGap;
      const lastY = platforms[platforms.length - 1].y;

      platforms.push({
        x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
        y: lastY - gap,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
      });
    }

    // Générer quelques bonus initiaux
    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.5) {
        const types = Object.values(BONUS_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        bonuses.push({
          x: Math.random() * (SCREEN_WIDTH - BONUS_SIZE),
          y: platforms[i + 1].y - 50 - Math.random() * 30,
          type,
          collected: false,
        });
      }
    }

    gameState.current = {
      playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: SCREEN_HEIGHT - 200,
      velocityY: 0,
      velocityX: 0,
      platforms,
      bonuses,
      cameraY: 0,
      leftPressed: false,
      rightPressed: false,
      shield: false,
      magnet: false,
      shieldTimeout: null,
      magnetTimeout: null,
      frameCount: 0,
      lastFpsUpdate: Date.now(),
      currentScore: 0,
    };

    setGameOver(false);
    setPaused(false);
    setScore(0);
    setShield(false);
    setMagnet(false);

    if (gameState.current.shieldTimeout) clearTimeout(gameState.current.shieldTimeout);
    if (gameState.current.magnetTimeout) clearTimeout(gameState.current.magnetTimeout);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Game loop optimisé avec Skia
  useFrameCallback(() => {
    if (gameOver || paused) return;

    const state = gameState.current;
    const now = Date.now();

    // FPS tracking
    state.frameCount++;
    if (now - state.lastFpsUpdate >= 1000) {
      setFps(state.frameCount);
      state.frameCount = 0;
      state.lastFpsUpdate = now;
    }

    // Appliquer les contrôles
    state.velocityX = state.leftPressed ? -MOVE_SPEED : state.rightPressed ? MOVE_SPEED : 0;

    // Appliquer la physique
    state.velocityY += GRAVITY;
    state.playerX += state.velocityX;
    state.playerY += state.velocityY;

    // Wrap autour de l'écran
    if (state.playerX < -PLAYER_SIZE) state.playerX = SCREEN_WIDTH;
    else if (state.playerX > SCREEN_WIDTH) state.playerX = -PLAYER_SIZE;

    // Collision avec bonus
    const playerCenterX = state.playerX + PLAYER_SIZE / 2;
    const playerCenterY = state.playerY + PLAYER_SIZE / 2;
    const collisionRadius = (PLAYER_SIZE + BONUS_SIZE) / 2;

    for (let i = 0; i < state.bonuses.length; i++) {
      const bonus = state.bonuses[i];
      if (bonus.collected) continue;

      const bonusScreenY = bonus.y - state.cameraY;
      const bonusCenterX = bonus.x + BONUS_SIZE / 2;
      const bonusCenterY = bonusScreenY;

      const dx = playerCenterX - bonusCenterX;
      const dy = playerCenterY - bonusCenterY;
      const distanceSquared = dx * dx + dy * dy;

      // Effet aimant : attirer les bonus proches (FIX: inverser pour attirer)
      if (state.magnet && distanceSquared < 10000) {
        bonus.x -= dx * 0.1;
        bonus.y -= dy * 0.1;
      }

      // Collision
      if (distanceSquared < collisionRadius * collisionRadius) {
        bonus.collected = true;
        state.currentScore += bonus.type.points;

        switch (bonus.type.id) {
          case 'spring':
            state.velocityY = bonus.type.boost;
            break;
          case 'shield':
            state.shield = true;
            setShield(true);
            if (state.shieldTimeout) clearTimeout(state.shieldTimeout);
            state.shieldTimeout = setTimeout(() => {
              state.shield = false;
              setShield(false);
            }, bonus.type.duration);
            break;
          case 'magnet':
            state.magnet = true;
            setMagnet(true);
            if (state.magnetTimeout) clearTimeout(state.magnetTimeout);
            state.magnetTimeout = setTimeout(() => {
              state.magnet = false;
              setMagnet(false);
            }, bonus.type.duration);
            break;
        }
      }
    }

    // Supprimer bonus collectés
    state.bonuses = state.bonuses.filter(b => !b.collected && b.y - state.cameraY < SCREEN_HEIGHT + 100);

    // Collision avec plateformes
    if (state.velocityY > 0) {
      const playerBottom = state.playerY + PLAYER_SIZE;
      const playerRight = state.playerX + PLAYER_SIZE;

      for (let i = 0; i < state.platforms.length; i++) {
        const platform = state.platforms[i];
        const platformTop = platform.y - state.cameraY;
        const platformRight = platform.x + platform.width;

        if (
          playerBottom >= platformTop &&
          playerBottom <= platformTop + PLATFORM_HEIGHT + 10 &&
          playerRight > platform.x &&
          state.playerX < platformRight
        ) {
          state.velocityY = JUMP_FORCE;
          break;
        }
      }
    }

    // Déplacer la caméra
    if (state.playerY < SCREEN_HEIGHT / 3) {
      const diff = SCREEN_HEIGHT / 3 - state.playerY;
      state.cameraY -= diff;
      state.playerY = SCREEN_HEIGHT / 3;

      // Calculer le score
      const currentScore = Math.floor(Math.abs(state.cameraY) / 10);
      state.currentScore = Math.max(state.currentScore, currentScore);
      setScore(state.currentScore);

      // Générer nouvelles plateformes
      let highestY = state.platforms[0].y;
      for (let i = 1; i < state.platforms.length; i++) {
        if (state.platforms[i].y < highestY) {
          highestY = state.platforms[i].y;
        }
      }

      if (highestY - state.cameraY > -SCREEN_HEIGHT) {
        const minGap = 60;
        const maxGap = 120;
        const gap = Math.random() * (maxGap - minGap) + minGap;

        state.platforms.push({
          x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
          y: highestY - gap,
          width: PLATFORM_WIDTH,
          height: PLATFORM_HEIGHT,
        });

        // 30% de chance de générer un bonus
        if (Math.random() > 0.7) {
          const types = Object.values(BONUS_TYPES);
          const type = types[Math.floor(Math.random() * types.length)];
          state.bonuses.push({
            x: Math.random() * (SCREEN_WIDTH - BONUS_SIZE),
            y: highestY - gap - 50 - Math.random() * 30,
            type,
            collected: false,
          });
        }
      }

      // Supprimer plateformes hors écran
      state.platforms = state.platforms.filter(p => p.y - state.cameraY < SCREEN_HEIGHT + 100);
    }

    // Game Over
    if (state.playerY > SCREEN_HEIGHT && !state.shield) {
      setGameOver(true);
      setHighScore(Math.max(highScore, state.currentScore));
    } else if (state.playerY > SCREEN_HEIGHT && state.shield) {
      state.playerY = SCREEN_HEIGHT - 100;
      state.velocityY = JUMP_FORCE * 1.5;
      state.shield = false;
      setShield(false);
      if (state.shieldTimeout) clearTimeout(state.shieldTimeout);
    }
  });

  const handleLeftPressIn = () => {
    gameState.current.leftPressed = true;
  };

  const handleLeftPressOut = () => {
    gameState.current.leftPressed = false;
  };

  const handleRightPressIn = () => {
    gameState.current.rightPressed = true;
  };

  const handleRightPressOut = () => {
    gameState.current.rightPressed = false;
  };

  const togglePause = () => {
    setPaused(!paused);
  };

  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  const toggleFPS = () => {
    setShowFPS(!showFPS);
  };

  // Parallax offsets
  const parallaxOffset1 = (gameState.current.cameraY * 0.1) % SCREEN_HEIGHT;
  const parallaxOffset2 = (gameState.current.cameraY * 0.3) % SCREEN_HEIGHT;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Canvas de rendu Skia - haute performance */}
      <Canvas style={styles.canvas}>
        {/* Arrière-plan avec parallaxe */}
        <Group>
          {/* Couche 1 - Fond */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} color="#87CEEB" />

          {/* Montagnes */}
          <Group transform={[{translateY: parallaxOffset1}]}>
            <Rect x={SCREEN_WIDTH * 0.1} y={SCREEN_HEIGHT - 150} width={200} height={150} color="rgba(90, 159, 212, 0.6)" />
            <Rect x={SCREEN_WIDTH * 0.6} y={SCREEN_HEIGHT - 120} width={180} height={120} color="rgba(107, 177, 224, 0.5)" />
          </Group>

          {/* Nuages */}
          <Group transform={[{translateY: parallaxOffset2}]}>
            <Circle cx={SCREEN_WIDTH * 0.15} cy={SCREEN_HEIGHT * 0.2} r={40} color="rgba(255, 255, 255, 0.6)" />
            <Circle cx={SCREEN_WIDTH * 0.65} cy={SCREEN_HEIGHT * 0.4} r={40} color="rgba(255, 255, 255, 0.6)" />
            <Circle cx={SCREEN_WIDTH * 0.35} cy={SCREEN_HEIGHT * 0.7} r={40} color="rgba(255, 255, 255, 0.6)" />
          </Group>
        </Group>

        {/* Plateformes */}
        {gameState.current.platforms.map((platform, index) => {
          const screenY = platform.y - gameState.current.cameraY;
          if (screenY < -50 || screenY > SCREEN_HEIGHT + 50) return null;
          return (
            <Group key={index}>
              <Rect
                x={platform.x}
                y={screenY}
                width={platform.width}
                height={platform.height}
                color="#51CF66"
              />
              <Rect
                x={platform.x}
                y={screenY}
                width={platform.width}
                height={platform.height}
                color="transparent"
                style="stroke"
                strokeWidth={2}
              />
            </Group>
          );
        })}

        {/* Bonus */}
        {gameState.current.bonuses.map((bonus, index) => {
          const screenY = bonus.y - gameState.current.cameraY;
          if (screenY < -50 || screenY > SCREEN_HEIGHT + 50) return null;
          return (
            <Group key={`bonus-${index}`}>
              <Circle
                cx={bonus.x + BONUS_SIZE / 2}
                cy={screenY}
                r={BONUS_SIZE / 2}
                color={bonus.type.color}
              />
              <Circle
                cx={bonus.x + BONUS_SIZE / 2}
                cy={screenY}
                r={BONUS_SIZE / 2}
                color="transparent"
                style="stroke"
                strokeWidth={2}
              />
            </Group>
          );
        })}

        {/* Joueur (créature) */}
        <Group>
          {/* Corps */}
          <Circle
            cx={gameState.current.playerX + PLAYER_SIZE / 2}
            cy={gameState.current.playerY + PLAYER_SIZE / 2}
            r={PLAYER_SIZE / 2}
            color="#FF6B6B"
          />
          {/* Bordure */}
          <Circle
            cx={gameState.current.playerX + PLAYER_SIZE / 2}
            cy={gameState.current.playerY + PLAYER_SIZE / 2}
            r={PLAYER_SIZE / 2}
            color={shield ? "#4ECDC4" : "#C92A2A"}
            style="stroke"
            strokeWidth={shield ? 4 : 3}
          />
          {/* Yeux */}
          <Circle
            cx={gameState.current.playerX + 15}
            cy={gameState.current.playerY + 12}
            r={4}
            color="#FFF"
          />
          <Circle
            cx={gameState.current.playerX + 25}
            cy={gameState.current.playerY + 12}
            r={4}
            color="#FFF"
          />
          {/* Pupilles */}
          <Circle
            cx={gameState.current.playerX + 15}
            cy={gameState.current.playerY + 12}
            r={2}
            color="#000"
          />
          <Circle
            cx={gameState.current.playerX + 25}
            cy={gameState.current.playerY + 12}
            r={2}
            color="#000"
          />
          {/* Bouclier effet */}
          {shield && (
            <Circle
              cx={gameState.current.playerX + PLAYER_SIZE / 2}
              cy={gameState.current.playerY + PLAYER_SIZE / 2}
              r={PLAYER_SIZE / 2 + 5}
              color="transparent"
              style="stroke"
              strokeWidth={3}
              opacity={0.5}
            />
          )}
        </Group>
      </Canvas>

      {/* UI Overlay */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.highScoreText}>High: {highScore}</Text>
        {shield && <Text style={styles.powerUpText}>🛡️ SHIELD</Text>}
        {magnet && <Text style={styles.powerUpText}>🧲 MAGNET</Text>}
      </View>

      {/* FPS Counter */}
      {showFPS && (
        <View style={styles.fpsContainer}>
          <Text style={styles.fpsText}>{fps} FPS</Text>
        </View>
      )}

      {/* Bouton pause */}
      <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
        <Text style={styles.pauseText}>{paused ? '▶' : '⏸'}</Text>
      </TouchableOpacity>

      {/* Menu Pause */}
      {paused && !gameOver && (
        <View style={styles.pauseMenu}>
          <Text style={styles.pauseMenuTitle}>PAUSE</Text>
          <TouchableOpacity style={styles.menuButton} onPress={togglePause}>
            <Text style={styles.menuButtonText}>Reprendre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={toggleHelp}>
            <Text style={styles.menuButtonText}>Aide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={toggleFPS}>
            <Text style={styles.menuButtonText}>
              {showFPS ? '✓ ' : ''}Afficher FPS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={initGame}>
            <Text style={styles.menuButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Aide */}
      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleHelp}>
        <View style={styles.helpModal}>
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>🎮 AIDE</Text>
            <ScrollView style={styles.helpScroll}>
              <Text style={styles.helpSection}>📋 Objectif</Text>
              <Text style={styles.helpText}>
                Montez le plus haut possible en sautant de plateforme en plateforme !
              </Text>

              <Text style={styles.helpSection}>🎁 Bonus</Text>

              <View style={styles.bonusHelpItem}>
                <Text style={styles.bonusHelpIcon}>⭐</Text>
                <View style={styles.bonusHelpInfo}>
                  <Text style={styles.bonusHelpName}>Étoile</Text>
                  <Text style={styles.bonusHelpDesc}>+10 points bonus</Text>
                </View>
              </View>

              <View style={styles.bonusHelpItem}>
                <Text style={styles.bonusHelpIcon}>🌸</Text>
                <View style={styles.bonusHelpInfo}>
                  <Text style={styles.bonusHelpName}>Ressort</Text>
                  <Text style={styles.bonusHelpDesc}>+5 points • Super saut vers le haut</Text>
                </View>
              </View>

              <View style={styles.bonusHelpItem}>
                <Text style={styles.bonusHelpIcon}>🛡️</Text>
                <View style={styles.bonusHelpInfo}>
                  <Text style={styles.bonusHelpName}>Bouclier</Text>
                  <Text style={styles.bonusHelpDesc}>+15 points • Protection contre 1 chute (5s)</Text>
                </View>
              </View>

              <View style={styles.bonusHelpItem}>
                <Text style={styles.bonusHelpIcon}>🧲</Text>
                <View style={styles.bonusHelpInfo}>
                  <Text style={styles.bonusHelpName}>Aimant</Text>
                  <Text style={styles.bonusHelpDesc}>+5 points • Attire les bonus proches (3s)</Text>
                </View>
              </View>

              <Text style={styles.helpSection}>🕹️ Contrôles</Text>
              <Text style={styles.helpText}>
                • Boutons ← → : Déplacer la créature{'\n'}
                • Bouton ⏸ : Pause{'\n'}
                • Le personnage saute automatiquement sur les plateformes
              </Text>

              <Text style={styles.helpSection}>💡 Astuces</Text>
              <Text style={styles.helpText}>
                • Collectez les bonus pour booster votre score{'\n'}
                • Le bouclier vous sauve d'une chute fatale{'\n'}
                • L'aimant facilite la collection de bonus{'\n'}
                • Plus vous montez, plus c'est difficile !
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.helpCloseButton} onPress={toggleHelp}>
              <Text style={styles.helpCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Game Over */}
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScoreText}>Score: {score}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={initGame}>
            <Text style={styles.restartButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contrôles */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={handleLeftPressIn}
          onPressOut={handleLeftPressOut}>
          <View style={styles.arrowLeft} />
        </TouchableOpacity>
        <View style={styles.controlSpacer} />
        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={handleRightPressIn}
          onPressOut={handleRightPressOut}>
          <View style={styles.arrowRight} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
  scoreContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  highScoreText: {
    fontSize: 16,
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  powerUpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
    textShadowColor: '#000',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  pauseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 11,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  pauseText: {
    fontSize: 24,
    color: '#333',
  },
  fpsContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  fpsText: {
    fontSize: 12,
    color: '#00FF00',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  arrowLeft: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 25,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderLeftWidth: 0,
    borderRightColor: '#333',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  arrowRight: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 25,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderRightWidth: 0,
    borderLeftColor: '#333',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  controlSpacer: {
    flex: 1,
  },
  pauseMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseMenuTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 40,
  },
  menuButton: {
    backgroundColor: '#51CF66',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#2F9E44',
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  helpModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    width: '90%',
  },
  helpTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  helpScroll: {
    maxHeight: 400,
  },
  helpSection: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  helpText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 10,
  },
  bonusHelpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  bonusHelpIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  bonusHelpInfo: {
    flex: 1,
  },
  bonusHelpName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bonusHelpDesc: {
    fontSize: 14,
    color: '#666',
  },
  helpCloseButton: {
    backgroundColor: '#51CF66',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  helpCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  finalScoreText: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: '#51CF66',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#2F9E44',
  },
  restartButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default App;
