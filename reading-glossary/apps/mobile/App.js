import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import api, { saveRefreshToken } from './src/api';
import theme from './src/theme';
import Welcome from './src/screens/Welcome';
import SignIn from './src/screens/SignIn';
import Catalogue from './src/screens/Catalogue';
import ModuleDetail from './src/screens/ModuleDetail';
import Lesson from './src/screens/Lesson';
import Quiz from './src/screens/Quiz';
import Results from './src/screens/Results';

const Stack = createNativeStackNavigator();

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.color.background_primary,
    card: theme.color.background_secondary,
    text: theme.color.text_primary,
    primary: theme.color.brand_primary,
    border: theme.color.border_subtle
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .restoreSession()
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (credentials) => {
    const data = await api.login(credentials);
    if (data.refreshToken) await saveRefreshToken(data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut, setUser }), [user, signIn, signOut]);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={value}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={theme.color.background_primary} />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: theme.color.background_secondary },
              headerTitleStyle: { fontFamily: theme.font.display, color: theme.color.text_primary },
              headerTintColor: theme.color.brand_primary,
              contentStyle: { backgroundColor: theme.color.background_primary }
            }}
          >
            {user ? (
              <>
                <Stack.Screen name="Catalogue" component={Catalogue} options={{ title: 'Courses' }} />
                <Stack.Screen name="ModuleDetail" component={ModuleDetail} options={{ title: '' }} />
                <Stack.Screen name="Lesson" component={Lesson} options={{ title: '' }} />
                <Stack.Screen name="Quiz" component={Quiz} options={{ title: 'Quiz', headerBackVisible: false }} />
                <Stack.Screen name="Results" component={Results} options={{ title: 'Result', headerBackVisible: false }} />
              </>
            ) : (
              <>
                <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
                <Stack.Screen name="SignIn" component={SignIn} options={{ title: 'Sign in' }} />
                <Stack.Screen name="Catalogue" component={Catalogue} options={{ title: 'Courses' }} />
                <Stack.Screen name="ModuleDetail" component={ModuleDetail} options={{ title: '' }} />
                <Stack.Screen name="Lesson" component={Lesson} options={{ title: '' }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
