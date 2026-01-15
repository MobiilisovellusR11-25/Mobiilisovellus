import { useEffect, useState } from 'react';
import { Text, View, FlatList } from 'react-native';

type Restaurant = {
  place_id: number;
  display_name: string;
};

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    fetch(
      'https://nominatim.openstreetmap.org/search?format=json&q=restaurant+Oulu'
    )
      .then(res => res.json())
      .then(data => setRestaurants(data));
  }, []);

  return (
    <View style={{ padding: 20, marginTop: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
        Ravintolat Oulussa
      </Text>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.place_id.toString()}
        renderItem={({ item }) => (
          <Text style={{ paddingVertical: 8 }}>
            {item.display_name}
          </Text>
        )}
      />
    </View>
  );
}