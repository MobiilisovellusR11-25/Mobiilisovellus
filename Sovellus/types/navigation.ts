export type RootStackParamList = {
  Auth: undefined;
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

  type?: 'restaurant' | 'cafe';
  cuisine?: string;
  openingHours?: string;
  avgRating?: number;
  reviewCount?: number;
};
