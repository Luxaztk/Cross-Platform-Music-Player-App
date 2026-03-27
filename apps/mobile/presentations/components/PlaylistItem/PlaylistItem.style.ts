import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  info: {
    marginLeft: 12,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    color: 'gray',
    marginTop: 4,
  },
});

export { styles };

