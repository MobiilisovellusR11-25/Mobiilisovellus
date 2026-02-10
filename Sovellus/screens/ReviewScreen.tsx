import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../theme/ThemeContext';

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
};

export default function ReviewScreen({ route }: Props) {
  const { place } = route.params;

  const { theme } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  //Hae arvostelut
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

  // Kamera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Kameralupa tarvitaan');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  //Galleria
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};


  // Lataa kuva ominaisuus
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



  // Lähetä arvostelu
  const submitReview = async () => {
    if (!comment.trim()) return;

    setUploading(true);
    try {
      let imageUrl: string | null = null;
      if (image) {
        imageUrl = await uploadImageAsync(image);
      }

      await addDoc(collection(db, 'reviews'), {
        placeId: place.id,
        rating,
        comment,
        ...(imageUrl ? { imageUrl } : {}),
        createdAt: serverTimestamp(),
      });

      setComment('');
      setRating(5);
      setImage(null);

      await fetchReviews();
    } catch (e) {
      console.error('❌ submitReview', e);
      alert('Arvostelun lähetys epäonnistui');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.backgroundColor },
    ]}>

      <Text style={[
        styles.title,
        { color: theme.text },
      ]}>
        {place.name}
      </Text>

      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View 
            style={[
              styles.reviewCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >

            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.reviewImage}
              />
            )}

            <Text style={{
              color: theme.text,
              fontWeight: 'bold',
            }}>
              {'⭐'.repeat(item.rating)}
            </Text>

            <Text style={{
              color: theme.textSecondary,
            }}>
              {item.comment}
            </Text>
          </View>
        )}
      />

      <View 
        style={[
          styles.form,
          { borderColor: theme.border },
        ]}
      >

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.input,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
          placeholderTextColor={ theme.textSecondary }
          placeholder="Kirjoita arvostelu"
          value={comment}
          onChangeText={setComment}
        />

        <View style={styles.row}>
          <TouchableOpacity 
            style={[
              styles.button,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]} onPress={takePhoto}>
            <Text style={{ color: theme.text }}>📷 Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]} onPress={pickImage}>
            <Text style={{ color: theme.text }}>🖼 Galleria</Text>
          </TouchableOpacity>
        </View>

        {image && <Image source={{ uri: image }} style={styles.preview} />}

        <View style={{ flexDirection: 'row', marginVertical: 10 }}>
          <Text
            style={{ 
              marginRight: 10,
              color: theme.text,
              }}>
                Arvosana:
              </Text>

          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text 
                style={{
                  fontSize: 20, 
                  marginHorizontal: 2, 
                  color: star <= rating ? theme.primary : theme.textSecondary,
                  }}
                >
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.submit,
            {
              backgroundColor: theme.primary,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
          onPress={submitReview}
          disabled={uploading}
        >
          <Text style={{ color: theme.text, fontWeight: "bold" }}>
            {uploading ? 'Lähetetään...' : 'Lisää arvostelu'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15 
  },

  title: { 
    fontSize: 22, 
    textAlign: 'center', 
    fontWeight: 'bold',
    marginBottom: 10, 
  },

  reviewCard: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },

  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },

  form: { 
    borderTopWidth: 1, 
    paddingTop: 10,
    marginTop: 10, 
  },

  input: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },

  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },

  button: {
    padding: 10,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
  },

  preview: {
    width: '100%',
    height: 180,
    marginVertical: 10,
    borderRadius: 10,
  },

  submit: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
});
