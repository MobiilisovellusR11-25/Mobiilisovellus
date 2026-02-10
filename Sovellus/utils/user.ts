import * as SecureStore from 'expo-secure-store';

export const getUserId = async (): Promise<string> => {
  let userId = await SecureStore.getItemAsync('userId');

  if (!userId) {
    userId = Math.random().toString(36).substring(2);
    await SecureStore.setItemAsync('userId', userId);
  }

  return userId;
};