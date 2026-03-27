import { usePlaylist } from '@/application/hooks';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { PlaylistItem } from '../../components';
import styles from './PlaylistScreen.style';

const PlaylistScreen: React.FC = () => {
  const { playlists, loading } = usePlaylist();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
        <View style={styles.icons}>
          <Ionicons name="search" size={24} color="white" />
          <Ionicons name="add" size={28} color="white" />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlaylistItem item={item} />}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
};

export default PlaylistScreen;
