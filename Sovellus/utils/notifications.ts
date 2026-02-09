// utils/notifications.ts
import { Alert } from 'react-native';

export const sendLocalNotification = (title: string, message: string) => {
  Alert.alert(title, message);
};
