import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Place } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    setLoading(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Sijaintilupa evätty');
      setLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const query = `
      [out:json];
      (
        node["amenity"="restaurant"](around:10000,${latitude},${longitude}); // 10 km säteellä
        node["amenity"="cafe"](around:10000,${latitude},${longitude});
      );
      out;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    const data = await response.json();

    const mapped: Place[] = data.elements.map((item: any) => ({
      id: item.id,
      name: item.tags?.name ?? 'Nimetön',
      lat: item.lat,
      lon: item.lon,
      address: `${item.tags?.['addr:street'] ?? ''} ${item.tags?.['addr:housenumber'] ?? ''}`,
      distance: haversine(latitude, longitude, item.lat, item.lon),
    }));

    mapped.sort((a, b) => a.distance - b.distance);
    setPlaces(mapped);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tervetuloa!</Text>
      <Text style={styles.name}>Lähellä olevat ravintolat</Text>

      {loading && <ActivityIndicator size="large" />}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Map', { places })}
        disabled={loading || places.length === 0}
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

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

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
