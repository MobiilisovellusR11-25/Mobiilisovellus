import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Reviews'>;

type Review = {
  id: string;
  rating: number;
  comment: string;
};

export default function ReviewScreen({ route }: Props) {
  const { place } = route.params;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('placeId', '==', place.id),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Review, 'id'>),
      }));

      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews: ', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [place.id]);

  const submitReview = async () => {
    if (!comment.trim()) return;

    try {
      await addDoc(collection(db, 'reviews'), {
        placeId: place.id,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      setRating(5);
      setComment('');

      fetchReviews();
    } catch (error) {
      console.error('Error adding review: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{place.name}</Text>
      <Text style={styles.subtitle}>⭐ Ravintolan arvostelut</Text>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.stars}>{'⭐'.repeat(item.rating)}</Text>
            <Text>{item.comment}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
            Ei vielä arvosteluja
          </Text>
        }
      />

      <View style={styles.form}>
        <Text style={styles.formTitle}>Jätä arvostelu</Text>

        <TextInput
          style={styles.input}
          placeholder="Kerro kokemuksestasi"
          value={comment}
          onChangeText={setComment}
        />

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Text style={n <= rating ? styles.starActive : styles.star}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={submitReview}>
          <Text style={styles.buttonText}>Lisää arvostelu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  stars: {
    marginBottom: 4,
  },
  form: {
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 10,
  },
  formTitle: {
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  star: {
    fontSize: 26,
    color: '#ccc',
    marginHorizontal: 2,
  },
  starActive: {
    fontSize: 26,
    color: '#6a4c93',
    marginHorizontal: 2,
  },
  button: {
    backgroundColor: '#e6ddf9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
});
