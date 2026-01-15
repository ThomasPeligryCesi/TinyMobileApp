import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const PLAYER_SIZE = 40;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 15;
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: SCREEN_HEIGHT - 200,
      velocityY: 0,
      velocityX: 0,
      platforms: [],
      score: 0,
      highScore: 0,
      gameOver: false,
      cameraY: 0,
    };
    this.gameLoop = null;
    this.leftPressed = false;
    this.rightPressed = false;
  }

  componentDidMount() {
    this.initGame();
  }

  componentWillUnmount() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
  }

  initGame = () => {
    const platforms = [];
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

    this.setState({
      playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: SCREEN_HEIGHT - 200,
      velocityY: 0,
      velocityX: 0,
      platforms,
      score: 0,
      gameOver: false,
      cameraY: 0,
    });

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

  startGameLoop = () => {
    const update = () => {
      if (!this.state.gameOver) {
        this.updateGame();
        this.gameLoop = requestAnimationFrame(update);
      }
    };
    this.gameLoop = requestAnimationFrame(update);
  };

  updateGame = () => {
    let {playerX, playerY, velocityY, velocityX, platforms, score, cameraY} =
      this.state;

    // Appliquer les contrôles
    if (this.leftPressed) {
      velocityX = -MOVE_SPEED;
    } else if (this.rightPressed) {
      velocityX = MOVE_SPEED;
    } else {
      velocityX = 0;
    }

    // Appliquer la physique
    velocityY += GRAVITY;
    playerX += velocityX;
    playerY += velocityY;

    // Wrap autour de l'écran (gauche-droite)
    if (playerX < -PLAYER_SIZE) {
      playerX = SCREEN_WIDTH;
    } else if (playerX > SCREEN_WIDTH) {
      playerX = -PLAYER_SIZE;
    }

    // Vérifier les collisions avec les plateformes
    if (velocityY > 0) {
      platforms.forEach(platform => {
        const playerBottom = playerY + PLAYER_SIZE;
        const platformTop = platform.y - cameraY;

        if (
          playerBottom >= platformTop &&
          playerBottom <= platformTop + PLATFORM_HEIGHT + 10 &&
          playerX + PLAYER_SIZE > platform.x &&
          playerX < platform.x + platform.width
        ) {
          velocityY = JUMP_FORCE;
        }
      });
    }

    // Déplacer la caméra vers le haut quand le joueur monte
    if (playerY < SCREEN_HEIGHT / 3) {
      const diff = SCREEN_HEIGHT / 3 - playerY;
      cameraY -= diff;
      playerY = SCREEN_HEIGHT / 3;

      // Calculer le score basé sur la hauteur atteinte
      const currentScore = Math.floor(Math.abs(cameraY) / 10);
      score = Math.max(score, currentScore);

      // Générer de nouvelles plateformes
      const highestPlatform = platforms.reduce((min, p) =>
        p.y < min.y ? p : min,
      );
      if (highestPlatform.y - cameraY > -SCREEN_HEIGHT) {
        platforms.push(this.generatePlatform(highestPlatform.y));
      }

      // Supprimer les plateformes hors de l'écran
      platforms = platforms.filter(p => p.y - cameraY < SCREEN_HEIGHT + 100);
    }

    // Game Over si le joueur tombe en bas de l'écran
    if (playerY > SCREEN_HEIGHT) {
      this.setState({
        gameOver: true,
        highScore: Math.max(this.state.highScore, score),
      });
      if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
      }
      return;
    }

    this.setState({
      playerX,
      playerY,
      velocityY,
      velocityX,
      platforms,
      score,
      cameraY,
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

  render() {
    const {
      playerX,
      playerY,
      platforms,
      score,
      highScore,
      gameOver,
      cameraY,
    } = this.state;

    return (
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.highScoreText}>High: {highScore}</Text>
        </View>

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

          {/* Joueur */}
          <View
            style={[
              styles.player,
              {
                left: playerX,
                top: playerY,
              },
            ]}
          />
        </View>

        {/* Game Over */}
        {gameOver && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <Text style={styles.finalScoreText}>Score: {score}</Text>
            <TouchableOpacity style={styles.restartButton} onPress={this.initGame}>
              <Text style={styles.restartButtonText}>Restart</Text>
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
    backgroundColor: '#87CEEB',
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
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#FF6B6B',
    borderRadius: PLAYER_SIZE / 2,
    borderWidth: 3,
    borderColor: '#C92A2A',
  },
  platform: {
    position: 'absolute',
    backgroundColor: '#51CF66',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#2F9E44',
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
