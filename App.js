import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import CreateSegmentScreen from './src/screens/CreateSegmentScreen';
import SignInScreen from './src/screens/SignInScreen';
import SegmentFeedScreen from './src/screens/SegmentFeedScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import { getToken } from './src/utils/storage';
import { colors } from './src/theme';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    getToken().then((t) => setInitialRoute(t ? 'Home' : 'SignIn'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: '#1A1A1A' },
          headerTintColor: '#fff',
          cardStyle: { backgroundColor: '#0F0F0F' },
        }}
      >
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateSegment"
          component={CreateSegmentScreen}
          options={{ title: 'New Segment' }}
        />
        <Stack.Screen
          name="SegmentFeed"
          component={SegmentFeedScreen}
          options={{ title: 'Feed' }}
        />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options={{ title: 'Playing' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
