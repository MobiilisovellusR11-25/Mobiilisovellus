import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db, storage } from '../firebase';

import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Reviews'>;

type Review = {
  id: string;
  rating: number;
  comment: string;
  imageUrl?: string | null;
  userId?: string;
};

export default function ReviewScreen({ route }: Props) {
  const { place } = route.params;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchReviews = async () => {
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
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Kameralupa tarvitaan');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = async () => {
        const blob = xhr.response as Blob;
        try {
          const filename = `reviews/${place.id}_${Date.now()}.jpg`;
          const imageRef = ref(storage, filename);
          await uploadBytes(imageRef, blob);
          const downloadUrl = await getDownloadURL(imageRef);
          resolve(downloadUrl);
        } catch (e) {
          reject(e);
        }
      };

      xhr.onerror = () => reject(new Error('Image upload failed'));

      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  const notifyOtherReviewers = async (currentUserId: string) => {
    const q = query(
      collection(db, 'reviews'),
      where('placeId', '==', place.id)
    );
    const snapshot = await getDocs(q);

    const userIds = new Set<string>();
    snapshot.docs.forEach(d => {
      if (d.data().userId) userIds.add(d.data().userId);
    });

    userIds.delete(currentUserId);

    if (userIds.size > 0) {
      Alert.alert(
        'Uusi arvostelu ⭐',
        `Uusi arvostelu paikassa ${place.name} – käy katsomassa!`
      );
    }
  };

  const submitReview = async () => {
    if (!comment.trim()) return;

    setUploading(true);
    try {
      let imageUrl: string | null = null;
      if (image) {
        imageUrl = await uploadImageAsync(image);
      }

      const currentUserId = 'user1';

      await addDoc(collection(db, 'reviews'), {
        placeId: place.id,
        rating,
        comment,
        userId: currentUserId,
        ...(imageUrl ? { imageUrl } : {}),
        createdAt: serverTimestamp(),
      });

      setComment('');
      setRating(5);
      setImage(null);

      await fetchReviews();

      notifyOtherReviewers(currentUserId);
    } catch (e) {
      console.error('❌ submitReview', e);
      alert('Arvostelun lähetys epäonnistui');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{place.name}</Text>

      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.reviewImage} />
            )}
            <Text>{'⭐'.repeat(item.rating)}</Text>
            <Text>{item.comment}</Text>
          </View>
        )}
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Kirjoita arvostelu"
          value={comment}
          onChangeText={setComment}
        />

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text>Ota kuva kameralla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text>Lisää kuva galleriasta</Text>
          </TouchableOpacity>
        </View>

        {image && <Image source={{ uri: image }} style={styles.preview} />}

        <View style={{ flexDirection: 'row', marginVertical: 10 }}>
          <Text style={{ marginRight: 10 }}>Arvosana:</Text>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={{ fontSize: 20, marginHorizontal: 2 }}>
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.submit}
          onPress={submitReview}
          disabled={uploading}
        >
          <Text>{uploading ? 'Lähetetään...' : 'Lisää arvostelu'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 22, textAlign: 'center', fontWeight: 'bold' },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginVertical: 6,
    borderRadius: 10,
  },
  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
  form: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    backgroundColor: '#e6ddf9',
    padding: 10,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: 180,
    marginVertical: 10,
    borderRadius: 10,
  },
  submit: {
    backgroundColor: '#cdb4f7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
