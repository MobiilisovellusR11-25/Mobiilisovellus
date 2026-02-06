import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './theme/ThemeContext';

import Navigator from './navigation/Navigator';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Navigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
