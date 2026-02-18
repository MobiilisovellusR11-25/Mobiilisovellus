import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";


type Props = NativeStackScreenProps<RootStackParamList, "Map">;

export default function MapScreen({ route }: Props) {
  const { places } = route.params;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: places[0].lat,
        longitude: places[0].lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      {places.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lon }}
          title={p.name}
          description={p.address}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
