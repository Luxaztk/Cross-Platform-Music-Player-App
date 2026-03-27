import { Playlist } from '@music/types';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './PlaylistItem.style';

interface Props {
  item: Playlist;
}

const router = useRouter();

const PlaylistItem: React.FC<Props> = ({ item }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: item.id } })}
    >
      <Image source={{ uri: item.thumbnail || '' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.desc}>{item.songIds.length} songs</Text>
      </View>
    </TouchableOpacity>
  );
};

export default PlaylistItem;
