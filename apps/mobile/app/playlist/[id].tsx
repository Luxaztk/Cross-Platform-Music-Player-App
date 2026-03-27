import { usePlaylistDetail } from '@/application/hooks';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import styles from './[id].style';

const PlaylistDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlist, loading } = usePlaylistDetail(id);

  if (loading) {
    return <Text style={{ color: 'white' }}>Loading...</Text>;
  }
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.playlistTitle}>{playlist?.name ?? 'Loading...'}</Text>
      <Image source={{ uri: playlist?.thumbnail }} style={styles.image} />
      <Text style={styles.subtitle}>{playlist ? `${playlist.songCount} songs` : ''}</Text>

      {/* Song List */}
      <FlatList
        data={playlist?.songs ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.songItem}>
            <Text style={styles.index}>{index + 1}</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default PlaylistDetailScreen;
