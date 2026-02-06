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
import { useTheme } from '../theme/ThemeContext';


type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type FilterType = 'all' | 'restaurant' | 'cafe';

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [places, setPlaces] = useState<Place[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadPlaces();
  }, []);

  const fetchRatingsForPlaces = async (mappedPlaces: Place[]) => {
    const updated = [...mappedPlaces];

    for (const place of updated) {
      const q = query(
        collection(db, 'reviews'),
        where('placeId', '==', place.id)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const ratings = snapshot.docs.map(d => Number(d.data().rating) || 0);
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
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
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Sijaintilupa evätty');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const queryText = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"](around:10000,${latitude},${longitude});
          way["amenity"="restaurant"](around:10000,${latitude},${longitude});
          node["amenity"="cafe"](around:10000,${latitude},${longitude});
          way["amenity"="cafe"](around:10000,${latitude},${longitude});
        );
        out tags center;
      `;

      const response = await fetch(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: queryText,
        }
      );

      if (!response.ok) {
        throw new Error('Overpass API error');
      }

      const data = await response.json();

      let mapped: Place[] = data.elements
        .map((item: any) => {
          const lat = item.lat ?? item.center?.lat;
          const lon = item.lon ?? item.center?.lon;

          if (!lat || !lon) return null;

          return {
            id: item.id.toString(),
            name: item.tags?.name ?? 'Nimetön',
            lat,
            lon,
            address: `${item.tags?.['addr:street'] ?? ''} ${item.tags?.['addr:housenumber'] ?? ''}`.trim(),
            distance: haversine(latitude, longitude, lat, lon),

            type: item.tags?.amenity === 'cafe' ? 'cafe' : 'restaurant',
            cuisine: item.tags?.cuisine,
            openingHours: item.tags?.opening_hours,

            avgRating: undefined,
            reviewCount: 0,
          };
        })
        .filter(Boolean) as Place[];

      mapped.sort((a, b) => a.distance - b.distance);
      mapped = await fetchRatingsForPlaces(mapped);

      setAllPlaces(mapped);
      setPlaces(mapped);
    } catch (e) {
      console.error('LOAD PLACES ERROR', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...allPlaces];

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.type === filter);
    }

    if (search.trim()) {
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
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={{ color: theme.text }}>Tervetuloa!</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Hae ravintolaa"
        value={search}
        onChangeText={setSearch}
      />

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
              {f === 'all' ? 'Kaikki' : f === 'restaurant' ? 'Ravintolat' : 'Kahvilat'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator size="large" />}

      {!loading && (
        <FlatList
          data={places}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.placeCard}
              onPress={() => navigation.navigate('Reviews', { place: item })}
            >
              <Text style={styles.placeName}>{item.name}</Text>
              {item.avgRating && (
                <Text>⭐ {item.avgRating} ({item.reviewCount})</Text>
              )}
              {item.cuisine && <Text>🍽 {item.cuisine}</Text>}
              {item.openingHours && <Text>⏰ {item.openingHours}</Text>}
              <Text>{item.address}</Text>
              <Text>{item.distance.toFixed(2)} km</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Map', { places })}
        disabled={places.length === 0}
      >
        <Text>📍 Kartta</Text>
      </TouchableOpacity>
    </View>
  );
}

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontSize: 26, textAlign: 'center', fontWeight: 'bold' },
  searchInput: { backgroundColor: '#eeeeee', padding: 10, borderRadius: 10 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  filterButton: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },
  filterButtonActive: { backgroundColor: '#f7ddf9' },
  placeCard: { padding: 12, backgroundColor: '#f9f9f9', marginVertical: 6, borderRadius: 10 },
  placeName: { fontWeight: 'bold' },
  button: { backgroundColor: '#f7ddf9', padding: 15, borderRadius: 12, alignItems: 'center' },
});