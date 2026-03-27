import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cover: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  playlistTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'gray',
    marginTop: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  index: {
    color: 'gray',
    width: 20,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
  },
  artist: {
    color: 'gray',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
});

export default styles;
