import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Place } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
 
  const [places, setPlaces] = useState<Place[]>([]);

  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  
  
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState('');

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
    
    setAllPlaces(mapped);
    
    setPlaces(mapped);
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    
    if (text.trim() === '') {
      setPlaces(allPlaces);
      return;
    }
  
    const filtered = allPlaces.filter((place) =>
      place.name.toLowerCase().includes(text.toLowerCase()) ||
      place.address.toLowerCase().includes(text.toLowerCase())
    );
    
    setPlaces(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tervetuloa!</Text>
      <Text style={styles.subtitle}>Lähellä olevat ravintolat</Text>

      
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Hae ravintolaa"
        value={search}
        onChangeText={handleSearch}
      />

      
      {loading && <ActivityIndicator size="large" color="#6a4c93" />}

      
      {!loading && places.length > 0 && (
        <FlatList
          data={places}
          renderItem={({ item }) => (
          
            <TouchableOpacity style={styles.placeCard}>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeAddress}>{item.address}</Text>
              <Text style={styles.placeDistance}>{item.distance.toFixed(2)} km</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()} 
          style={styles.list}
        />
      )}

      
      {!loading && places.length === 0 && <Text style={styles.emptyText}>Ei löytynyt ravintolaa</Text>}

      
      <View style={styles.buttonContainer}>
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
    backgroundColor: '#ffffff',
    paddingTop: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  

  searchInput: {
    marginHorizontal: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 15,
  },
  
  
  list: {
    flex: 1,
    paddingHorizontal: 15,
  },
  
  placeCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6a4c93',
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  placeAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  placeDistance: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 10,
  },
  button: {
    backgroundColor: '#e6ddf9',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 14,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
