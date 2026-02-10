import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../types/navigation';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ReviewScreen from '../screens/ReviewScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigator() {
    const { theme } = useTheme();

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={({ navigation }) => ({
                    title: "Etusivu",
                    headerStyle: {
                        backgroundColor: theme.backgroundColor,
                    },
                    headerTintColor: theme.text,
                    headerRight: () => (
                        <Pressable onPress={() => navigation.navigate("Settings")}>
                            <Ionicons
                                name="settings-outline"
                                size={24}
                                color={theme.text}
                            />
                        </Pressable>
                    ),
                })}
            />
            
            <Stack.Screen 
                name="Map"
                component={MapScreen} 
                options={{
                    title: "Kartta",
                    headerStyle: { backgroundColor: theme.backgroundColor },
                    headerTintColor: theme.text,
                }}
            />

            <Stack.Screen 
                name="Reviews" 
                component={ReviewScreen} 
                options={{
                    title: "Arvostelut",
                    headerStyle: { backgroundColor: theme.backgroundColor },
                    headerTintColor: theme.text,
                }}
            />

            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ 
                    title: "Asetukset",
                    headerStyle: { backgroundColor: theme.backgroundColor },
                    headerTintColor: theme.text,
                 }}
            />
        </Stack.Navigator>
    );
}