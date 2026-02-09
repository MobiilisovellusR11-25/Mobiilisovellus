import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import React from 'react';
import { auth } from '../firebase';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import ReviewScreen from '../screens/ReviewScreen';
import MapScreen from '../screens/MapScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) return null;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ title: 'Kartta' }}
          />

          <Stack.Screen
            name="Reviews"
            component={ReviewScreen}
            options={{
              title: 'Arvostelut',
              headerBackTitle: 'Takaisin',
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
