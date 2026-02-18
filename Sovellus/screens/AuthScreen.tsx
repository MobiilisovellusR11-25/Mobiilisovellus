import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
  } from 'react-native';
  import { useState } from 'react';
  
  import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
  } from 'firebase/auth';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
  
  import { auth, db } from '../firebase';
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 24,
    },
    input: {
      width: '100%',
      padding: 12,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      marginBottom: 16,
    },
    button: {
      backgroundColor: '#007bff',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
      marginBottom: 16,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    link: {
      color: '#007bff',
      textDecorationLine: 'underline',
    },
  });
  
  export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
  
    const handleAuth = async () => {
      if (!email || !password) {
        Alert.alert('Virhe', 'Täytä sähköposti ja salasana');
        return;
      }
  
      setLoading(true);
  
      try {
        if (isRegister) {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
  
          await setDoc(doc(db, 'users', cred.user.uid), {
            email: cred.user.email,
            createdAt: serverTimestamp(),
          });
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (e: any) {
        Alert.alert('Virhe', e.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {isRegister ? 'Rekisteröidy' : 'Kirjaudu'}
        </Text>
  
        <TextInput
          placeholder="Sähköposti"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
  
        <TextInput
          placeholder="Salasana"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
  
        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Odota...'
              : isRegister
              ? 'Rekisteröidy'
              : 'Kirjaudu'}
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.link}>
            {isRegister
              ? 'Onko sinulla jo tili? Kirjaudu'
              : 'Ei vielä tiliä? Rekisteröidy'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  