import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tervetuloa!</Text>
      <Text style={styles.name}>[Nimi?]</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Map')}
      >
        <Text style={styles.buttonText}>📍 Kartta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Reviews')}
      >
        <Text style={styles.buttonText}>⭐ Arvostelut</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#e6ddf9',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginVertical: 10,
    width: 220,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
  },
});
