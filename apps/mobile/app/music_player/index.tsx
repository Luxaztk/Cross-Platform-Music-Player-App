import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  image: string;
}

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const track: Track = {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    duration: 240,
    image: 'https://via.placeholder.com/300',
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
  };

  const progress = (currentTime / track.duration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="chevron-down" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Now Playing</Text>
        <MaterialCommunityIcons name="dots-vertical" size={28} color="#fff" />
      </View>

      <View style={styles.albumArt}>
        <Image
          source={{ uri: track.image }}
          style={styles.image}
        />
      </View>

      <View style={styles.trackInfo}>
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.artist}>{track.artist}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(track.duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <MaterialCommunityIcons name="shuffle" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <MaterialCommunityIcons name="skip-previous" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
        >
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={40}
            color="#1db954"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <MaterialCommunityIcons name="skip-next" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <MaterialCommunityIcons name="repeat" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons name="heart-outline" size={24} color="#fff" />
        <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
        <MaterialCommunityIcons name="dots-horizontal" size={24} color="#fff" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    padding: 1500
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  albumArt: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 12,
    backgroundColor: '#282828',
  },
  trackInfo: {
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1db954',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
});

export default MusicPlayer;
