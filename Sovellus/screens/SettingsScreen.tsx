import { View, Text, Switch } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SettingsScreen() {
    const { theme, themeType, toggleTheme } = useTheme();

    return (
        <View style={{ backgroundColor: theme.backgroundColor, flex: 1, padding: 16 }}>
            <Text style={{ color: theme.text, marginBottom: 8 }}>
                Tumma teema
            </Text>
            <Switch
                value={themeType === "dark"}
                onValueChange={toggleTheme}
            />
        </View>
    );
}