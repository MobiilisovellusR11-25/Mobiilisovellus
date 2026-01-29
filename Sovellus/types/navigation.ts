export type RootStackParamList = {
  Home: undefined;
  Map: { places: Place[] };
  Reviews: { place: Place };
};

export type Place = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  address: string;
  distance: number;
};
