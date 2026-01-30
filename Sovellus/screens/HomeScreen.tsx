import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Place } from '../types/navigation';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type FilterType = 'all' | 'restaurant' | 'cafe';

export default function HomeScreen({ navigation }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadPlaces();
  }, []);

  //  Firebase: hae arvostelujen keskiarvot
  const fetchRatingsForPlaces = async (mappedPlaces: Place[]) => {
    const updated: Place[] = [...mappedPlaces];

    for (const place of updated) {
      const q = query(
        collection(db, 'reviews'),
        where('placeId', '==', place.id)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const ratings = snapshot.docs.map(
          d => Number(d.data().rating) || 0
        );

        const avg =
          ratings.reduce((a, b) => a + b, 0) / ratings.length;

        place.avgRating = Number(avg.toFixed(1));
        place.reviewCount = ratings.length;
      } else {
        place.avgRating = undefined;
        place.reviewCount = 0;
      }
    }

    return updated;
  };

  const loadPlaces = async () => {
    setLoading(true);

    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      alert('Sijaintilupa evätty');
      setLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const queryText = `
      [out:json];
      (
        node["amenity"="restaurant"](around:10000,${latitude},${longitude});
        node["amenity"="cafe"](around:10000,${latitude},${longitude});
      );
      out tags center;
    `;

    const response = await fetch(
      'https://overpass-api.de/api/interpreter',
      { method: 'POST', body: queryText }
    );

    const data = await response.json();

    let mapped: Place[] = data.elements.map((item: any) => ({
      id: item.id,
      name: item.tags?.name ?? 'Nimetön',
      lat: item.lat,
      lon: item.lon,
      address: `${item.tags?.['addr:street'] ?? ''} ${
        item.tags?.['addr:housenumber'] ?? ''
      }`.trim(),
      distance: haversine(latitude, longitude, item.lat, item.lon),

      type: item.tags?.amenity === 'cafe' ? 'cafe' : 'restaurant',
      cuisine: item.tags?.cuisine,
      openingHours: item.tags?.opening_hours,

      avgRating: undefined,
      reviewCount: 0,
    }));

    mapped.sort((a, b) => a.distance - b.distance);

    mapped = await fetchRatingsForPlaces(mapped);

    setAllPlaces(mapped);
    setPlaces(mapped);
    setLoading(false);
  };

  //  Haku + suodattimet
  useEffect(() => {
    let filtered = [...allPlaces];

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.type === filter);
    }

    if (search.trim() !== '') {
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.address.toLowerCase().includes(search.toLowerCase()) ||
          p.cuisine?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setPlaces(filtered);
  }, [search, filter, allPlaces]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tervetuloa!</Text>
      <Text style={styles.subtitle}>Lähellä olevat ravintolat</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Hae ravintolaa tai keittiötä"
        value={search}
        onChangeText={setSearch}
      />

      {/* SUODATTIMET */}
      <View style={styles.filterRow}>
        {(['all', 'restaurant', 'cafe'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text>
              {f === 'all'
                ? 'Kaikki'
                : f === 'restaurant'
                ? 'Ravintolat'
                : 'Kahvilat'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator size="large" color="#6a4c93" />}

      {!loading && (
        <FlatList
          data={places}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          renderItem={({ item }) => (
          
            <TouchableOpacity style={styles.placeCard}>
              <Text style={styles.placeName}>{item.name}</Text>

              {item.avgRating !== undefined && (
                <Text style={styles.rating}>
                  ⭐ {item.avgRating} ({item.reviewCount})
                </Text>
              )}

              {item.cuisine && (
                <Text style={styles.placeAddress}>
                  🍽 {item.cuisine.replace(/;/g, ', ')}
                </Text>
              )}

              {item.openingHours && (
                <Text style={styles.placeAddress}>
                  ⏰ {item.openingHours}
                </Text>
              )}

              <Text style={styles.placeAddress}>{item.address}</Text>

              <Text style={styles.placeDistance}>
                {item.distance.toFixed(2)} km
              </Text>
            </TouchableOpacity>
          )}
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

/*  APUFUNKTIOT */
const haversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
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

/*  STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 10 },
  title: { fontSize: 30, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 10 },

  searchInput: {
    margin: 15,
    padding: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#eee',
  },

  filterButtonActive: {
    backgroundColor: '#e6ddf9',
  },

  list: { paddingHorizontal: 15 },

  placeCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6a4c93',
  },

  placeName: { fontSize: 16, fontWeight: 'bold' },
  rating: { fontSize: 14, marginBottom: 4 },
  placeAddress: { fontSize: 13, color: '#666' },
  placeDistance: { fontSize: 12, color: '#999', fontStyle: 'italic' },

  buttonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  button: {
    backgroundColor: '#e6ddf9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
