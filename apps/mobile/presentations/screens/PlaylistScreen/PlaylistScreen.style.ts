import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default styles;
