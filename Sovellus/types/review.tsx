export type Review = {
  id?: string;
  placeId: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: Date;
};
