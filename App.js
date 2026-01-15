import React, {Component} from 'react';
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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: SCREEN_HEIGHT - 200,
      velocityY: 0,
      velocityX: 0,
      platforms: [],
      bonuses: [],
      score: 0,
      highScore: 0,
      gameOver: false,
      paused: false,
      cameraY: 0,
      shield: false,
      magnet: false,
      showHelp: false,
      showFPS: false,
      fps: 0,
    };
    this.gameLoop = null;
    this.leftPressed = false;
    this.rightPressed = false;
    this.shieldTimeout = null;
    this.magnetTimeout = null;

    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.lastFrameTime = Date.now();
    this.targetFrameTime = 1000 / 90; // 90 FPS target
  }

  componentDidMount() {
    this.initGame();
  }

  componentWillUnmount() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    if (this.shieldTimeout) clearTimeout(this.shieldTimeout);
    if (this.magnetTimeout) clearTimeout(this.magnetTimeout);
  }

  initGame = () => {
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
      platforms.push(this.generatePlatform(platforms[platforms.length - 1].y));
    }

    // Générer quelques bonus initiaux
    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.5) {
        bonuses.push(this.generateBonus(platforms[i + 1].y));
      }
    }

    this.setState({
      playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: SCREEN_HEIGHT - 200,
      velocityY: 0,
      velocityX: 0,
      platforms,
      bonuses,
      score: 0,
      gameOver: false,
      paused: false,
      cameraY: 0,
      shield: false,
      magnet: false,
      showHelp: false,
    });

    if (this.shieldTimeout) clearTimeout(this.shieldTimeout);
    if (this.magnetTimeout) clearTimeout(this.magnetTimeout);

    this.startGameLoop();
  };

  generatePlatform = lastY => {
    const minGap = 60;
    const maxGap = 120;
    const gap = Math.random() * (maxGap - minGap) + minGap;

    return {
      x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
      y: lastY - gap,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    };
  };

  generateBonus = platformY => {
    const types = Object.values(BONUS_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      x: Math.random() * (SCREEN_WIDTH - BONUS_SIZE),
      y: platformY - 50 - Math.random() * 30,
      type,
      collected: false,
    };
  };

  startGameLoop = () => {
    const update = () => {
      const now = Date.now();
      const deltaTime = now - this.lastFrameTime;

      // Calculate FPS
      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        this.setState({fps: this.frameCount});
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      if (!this.state.gameOver && !this.state.paused) {
        this.updateGame();
        this.lastFrameTime = now;
        this.gameLoop = requestAnimationFrame(update);
      } else if (!this.state.gameOver) {
        this.lastFrameTime = now;
        this.gameLoop = requestAnimationFrame(update);
      }
    };
    this.gameLoop = requestAnimationFrame(update);
  };

  updateGame = () => {
    let {playerX, playerY, velocityY, velocityX, platforms, bonuses, score, cameraY, magnet, shield} =
      this.state;

    // Appliquer les contrôles
    velocityX = this.leftPressed ? -MOVE_SPEED : this.rightPressed ? MOVE_SPEED : 0;

    // Appliquer la physique
    velocityY += GRAVITY;
    playerX += velocityX;
    playerY += velocityY;

    // Wrap autour de l'écran (gauche-droite) - optimisé
    if (playerX < -PLAYER_SIZE) playerX = SCREEN_WIDTH;
    else if (playerX > SCREEN_WIDTH) playerX = -PLAYER_SIZE;

    // Précalculer les valeurs communes pour les collisions
    const playerCenterX = playerX + PLAYER_SIZE / 2;
    const playerCenterY = playerY + PLAYER_SIZE / 2;
    const collisionRadius = (PLAYER_SIZE + BONUS_SIZE) / 2;

    // Flags pour les mises à jour de power-ups
    let newShield = shield;
    let newMagnet = magnet;

    // Vérifier les collisions avec les bonus (optimisé)
    const bonusLength = bonuses.length;
    for (let i = 0; i < bonusLength; i++) {
      const bonus = bonuses[i];
      if (bonus.collected) continue;

      const bonusScreenY = bonus.y - cameraY;
      const bonusCenterX = bonus.x + BONUS_SIZE / 2;
      const bonusCenterY = bonusScreenY;

      // Calcul de distance optimisé (sans racine carrée pour le test initial)
      const dx = playerCenterX - bonusCenterX;
      const dy = playerCenterY - bonusCenterY;
      const distanceSquared = dx * dx + dy * dy;

      // Effet aimant : attirer les bonus proches
      if (magnet && distanceSquared < 10000) { // 100 * 100
        bonus.x += dx * 0.1;
        bonus.y += (dy + cameraY - bonus.y) * 0.1;
      }

      // Collision avec le bonus (sans sqrt pour meilleure performance)
      if (distanceSquared < collisionRadius * collisionRadius) {
        bonus.collected = true;
        score += bonus.type.points;

        // Appliquer les effets spéciaux
        switch (bonus.type.id) {
          case 'spring':
            velocityY = bonus.type.boost;
            break;
          case 'shield':
            newShield = true;
            if (this.shieldTimeout) clearTimeout(this.shieldTimeout);
            this.shieldTimeout = setTimeout(() => {
              this.setState({shield: false});
            }, bonus.type.duration);
            break;
          case 'magnet':
            newMagnet = true;
            if (this.magnetTimeout) clearTimeout(this.magnetTimeout);
            this.magnetTimeout = setTimeout(() => {
              this.setState({magnet: false});
            }, bonus.type.duration);
            break;
        }
      }
    }

    // Supprimer les bonus collectés (optimisé avec filter)
    bonuses = bonuses.filter(b => !b.collected && b.y - cameraY < SCREEN_HEIGHT + 100);

    // Vérifier les collisions avec les plateformes (optimisé)
    if (velocityY > 0) {
      const playerBottom = playerY + PLAYER_SIZE;
      const playerRight = playerX + PLAYER_SIZE;

      for (let i = 0, len = platforms.length; i < len; i++) {
        const platform = platforms[i];
        const platformTop = platform.y - cameraY;
        const platformRight = platform.x + platform.width;

        if (
          playerBottom >= platformTop &&
          playerBottom <= platformTop + PLATFORM_HEIGHT + 10 &&
          playerRight > platform.x &&
          playerX < platformRight
        ) {
          velocityY = JUMP_FORCE;
          break; // Sortir dès qu'on touche une plateforme
        }
      }
    }

    // Déplacer la caméra vers le haut quand le joueur monte
    if (playerY < SCREEN_HEIGHT / 3) {
      const diff = SCREEN_HEIGHT / 3 - playerY;
      cameraY -= diff;
      playerY = SCREEN_HEIGHT / 3;

      // Calculer le score basé sur la hauteur atteinte
      const currentScore = Math.floor(Math.abs(cameraY) / 10);
      score = Math.max(score, currentScore);

      // Générer de nouvelles plateformes (optimisé avec boucle simple)
      let highestY = platforms[0].y;
      for (let i = 1, len = platforms.length; i < len; i++) {
        if (platforms[i].y < highestY) {
          highestY = platforms[i].y;
        }
      }

      if (highestY - cameraY > -SCREEN_HEIGHT) {
        const newPlatform = this.generatePlatform(highestY);
        platforms.push(newPlatform);

        // 30% de chance de générer un bonus
        if (Math.random() > 0.7) {
          bonuses.push(this.generateBonus(newPlatform.y));
        }
      }

      // Supprimer les plateformes hors de l'écran
      platforms = platforms.filter(p => p.y - cameraY < SCREEN_HEIGHT + 100);
    }

    // Game Over si le joueur tombe en bas de l'écran (sauf si bouclier actif)
    if (playerY > SCREEN_HEIGHT && !newShield) {
      this.setState({
        gameOver: true,
        highScore: Math.max(this.state.highScore, score),
      });
      if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
      }
      return;
    } else if (playerY > SCREEN_HEIGHT && newShield) {
      // Le bouclier sauve le joueur une fois
      playerY = SCREEN_HEIGHT - 100;
      velocityY = JUMP_FORCE * 1.5;
      newShield = false;
      if (this.shieldTimeout) clearTimeout(this.shieldTimeout);
    }

    this.setState({
      playerX,
      playerY,
      velocityY,
      velocityX,
      platforms,
      bonuses,
      score,
      cameraY,
      shield: newShield,
      magnet: newMagnet,
    });
  };

  handleLeftPressIn = () => {
    this.leftPressed = true;
  };

  handleLeftPressOut = () => {
    this.leftPressed = false;
  };

  handleRightPressIn = () => {
    this.rightPressed = true;
  };

  handleRightPressOut = () => {
    this.rightPressed = false;
  };

  togglePause = () => {
    this.setState({paused: !this.state.paused});
  };

  toggleHelp = () => {
    this.setState({showHelp: !this.state.showHelp});
  };

  toggleFPS = () => {
    this.setState({showFPS: !this.state.showFPS});
  };

  renderPlayer = () => {
    const {shield} = this.state;
    return (
      <View style={styles.creature}>
        {/* Corps de la créature */}
        <View style={[styles.creatureBody, shield && styles.creatureBodyShield]} />
        {/* Yeux */}
        <View style={styles.creatureEyes}>
          <View style={styles.creatureEye} />
          <View style={styles.creatureEye} />
        </View>
        {/* Bouche */}
        <View style={styles.creatureMouth} />
        {/* Effet bouclier */}
        {shield && <View style={styles.shieldEffect} />}
      </View>
    );
  };

  renderBonus = (bonus, index) => {
    return (
      <View
        key={index}
        style={[
          styles.bonus,
          {
            left: bonus.x,
            top: bonus.y - this.state.cameraY,
            backgroundColor: bonus.type.color,
          },
        ]}>
        <Text style={styles.bonusIcon}>{bonus.type.icon}</Text>
      </View>
    );
  };

  render() {
    const {
      playerX,
      playerY,
      platforms,
      bonuses,
      score,
      highScore,
      gameOver,
      paused,
      cameraY,
      shield,
      magnet,
      showHelp,
      showFPS,
      fps,
    } = this.state;

    // Effet parallaxe
    const parallaxOffset1 = (cameraY * 0.1) % SCREEN_HEIGHT;
    const parallaxOffset2 = (cameraY * 0.3) % SCREEN_HEIGHT;
    const parallaxOffset3 = (cameraY * 0.5) % SCREEN_HEIGHT;

    return (
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Arrière-plan avec parallaxe */}
        <View style={styles.parallaxContainer}>
          {/* Couche 1 - Fond lointain */}
          <View style={[styles.parallaxLayer1, {transform: [{translateY: parallaxOffset1}]}]}>
            <View style={styles.mountain1} />
            <View style={styles.mountain2} />
          </View>

          {/* Couche 2 - Nuages */}
          <View style={[styles.parallaxLayer2, {transform: [{translateY: parallaxOffset2}]}]}>
            <View style={[styles.cloud, {left: '10%', top: '20%'}]} />
            <View style={[styles.cloud, {left: '60%', top: '40%'}]} />
            <View style={[styles.cloud, {left: '30%', top: '70%'}]} />
          </View>

          {/* Couche 3 - Avant-plan */}
          <View style={[styles.parallaxLayer3, {transform: [{translateY: parallaxOffset3}]}]} />
        </View>

        {/* Score et indicateurs */}
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
        <TouchableOpacity style={styles.pauseButton} onPress={this.togglePause}>
          <Text style={styles.pauseText}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>

        {/* Zone de jeu */}
        <View style={styles.gameArea}>
          {/* Plateformes */}
          {platforms.map((platform, index) => (
            <View
              key={index}
              style={[
                styles.platform,
                {
                  left: platform.x,
                  top: platform.y - cameraY,
                  width: platform.width,
                  height: platform.height,
                },
              ]}
            />
          ))}

          {/* Bonus */}
          {bonuses.map((bonus, index) => this.renderBonus(bonus, index))}

          {/* Joueur (créature) */}
          <View
            style={[
              styles.player,
              {
                left: playerX,
                top: playerY,
              },
            ]}>
            {this.renderPlayer()}
          </View>
        </View>

        {/* Menu Pause */}
        {paused && !gameOver && (
          <View style={styles.pauseMenu}>
            <Text style={styles.pauseMenuTitle}>PAUSE</Text>
            <TouchableOpacity style={styles.menuButton} onPress={this.togglePause}>
              <Text style={styles.menuButtonText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={this.toggleHelp}>
              <Text style={styles.menuButtonText}>Aide</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={this.toggleFPS}>
              <Text style={styles.menuButtonText}>
                {showFPS ? '✓ ' : ''}Afficher FPS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={this.initGame}>
              <Text style={styles.menuButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal Aide */}
        <Modal
          visible={showHelp}
          transparent={true}
          animationType="fade"
          onRequestClose={this.toggleHelp}>
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
              <TouchableOpacity style={styles.helpCloseButton} onPress={this.toggleHelp}>
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
            <TouchableOpacity style={styles.restartButton} onPress={this.initGame}>
              <Text style={styles.restartButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contrôles */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={this.handleLeftPressIn}
            onPressOut={this.handleLeftPressOut}>
            <View style={styles.arrowLeft} />
          </TouchableOpacity>
          <View style={styles.controlSpacer} />
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={this.handleRightPressIn}
            onPressOut={this.handleRightPressOut}>
            <View style={styles.arrowRight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  // Parallaxe
  parallaxContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  parallaxLayer1: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * 2,
    backgroundColor: '#87CEEB',
  },
  mountain1: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    width: 200,
    height: 150,
    backgroundColor: '#5A9FD4',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 80,
    opacity: 0.6,
  },
  mountain2: {
    position: 'absolute',
    bottom: 0,
    right: '15%',
    width: 180,
    height: 120,
    backgroundColor: '#6BB1E0',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    opacity: 0.5,
  },
  parallaxLayer2: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * 2,
  },
  cloud: {
    position: 'absolute',
    width: 80,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 40,
  },
  parallaxLayer3: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * 2,
  },
  // UI
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
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  // Joueur (créature)
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  creature: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    position: 'relative',
  },
  creatureBody: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#FF6B6B',
    borderRadius: PLAYER_SIZE / 2,
    borderWidth: 3,
    borderColor: '#C92A2A',
  },
  creatureBodyShield: {
    borderColor: '#4ECDC4',
    borderWidth: 4,
  },
  creatureEyes: {
    position: 'absolute',
    top: 12,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  creatureEye: {
    width: 8,
    height: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  creatureMouth: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    width: 16,
    height: 8,
    backgroundColor: '#C92A2A',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  shieldEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: (PLAYER_SIZE + 10) / 2,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    opacity: 0.5,
  },
  // Plateformes et bonus
  platform: {
    position: 'absolute',
    backgroundColor: '#51CF66',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#2F9E44',
  },
  bonus: {
    position: 'absolute',
    width: BONUS_SIZE,
    height: BONUS_SIZE,
    borderRadius: BONUS_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  bonusIcon: {
    fontSize: 18,
  },
  // Contrôles
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
  // Menu pause
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
  // Modal aide
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
  // Game over
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
