import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ComplaintProvider } from './src/context/ComplaintContext';
import { NotificationProvider, useNotification, useAdminNotification } from './src/context/NotificationContext';

// Helper to bridge navigation to context
const NavigationAware = () => {
  const navigation = useNavigation();
  const { setNavigation, refreshUser } = useNotification();
  const { setNavigation: setAdminNavigation } = useAdminNotification();

  React.useEffect(() => {
    console.log('NavigationAware: syncing navigation and wiring user refresh listeners...');
    setNavigation(navigation);
    setAdminNavigation(navigation);

    if (refreshUser) {
      refreshUser(); // Initial sync
    }

    const unsubscribeState = navigation.addListener('state', () => {
      if (refreshUser) refreshUser();
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (refreshUser) refreshUser();
    });

    return () => {
      unsubscribeState();
      unsubscribeFocus();
    };
  }, [navigation, refreshUser]);

  return null;
};

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import EmailOtpScreen from './src/screens/EmailOtpScreen';
import HomeScreen from './src/screens/HomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SubmitComplaintScreen from './src/screens/SubmitComplaintScreen';
import ComplaintDetailsScreen from './src/screens/ComplaintDetailsScreen';
import AuthorityDashboardScreen from './src/screens/AuthorityDashboardScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import CameraScreen from './src/screens/CameraScreen';
import SubmitComplaintDetailsScreen from './src/screens/SubmitComplaintDetailsScreen';
import SubmittedComplaintScreen from './src/screens/SubmittedComplaintScreen';
import UserComplaintListScreen from './src/screens/UserComplaintListScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LandingScreen from './src/screens/LandingScreen';
import SimilarComplaintsScreen from './src/screens/SimilarComplaintsScreen';
import AddEvidenceScreen from './src/screens/AddEvidenceScreen'; // Import new screen
import AuthorityComplaintListScreen from './src/screens/AuthorityComplaintListScreen';
import AuthorityComplaintDetailScreen from './src/screens/AuthorityComplaintDetailScreen';
import AdminComplaintDetailScreen from './src/screens/AdminComplaintDetailScreen';
import OfflineGalleryScreen from './src/screens/OfflineGalleryScreen';
import DraftComplaintSubmitScreen from './src/screens/DraftComplaintSubmitScreen';
import DraftSubmittedScreen from './src/screens/DraftSubmittedScreen';
import AdminCategoryRequestDetailsScreen from './src/screens/AdminCategoryRequestDetailsScreen';
import AdminAnalyticsScreen from './src/screens/AdminAnalyticsScreen';

const Stack = createNativeStackNavigator();
const THEME_STORAGE_KEY = 'cityzen.darkMode';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && savedTheme != null) {
          setDarkMode(savedTheme === 'true');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        if (isMounted) {
          setThemeReady(true);
        }
      }
    };

    loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((currentMode) => {
      const nextMode = !currentMode;
      AsyncStorage.setItem(THEME_STORAGE_KEY, String(nextMode)).catch((error) => {
        console.error('Failed to save theme preference:', error);
      });
      return nextMode;
    });
  };

  if (!themeReady) {
    return null;
  }

  return (
    <ComplaintProvider>
      <NotificationProvider>
        <NavigationContainer ref={(ref) => {
          if (ref) {
          }
        }}>
          <NavigationAware />
          <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#1F2937" : "#FFFFFF"} />
          <Stack.Navigator
            initialRouteName="Landing"
            screenOptions={{
              headerShown: false,
              animation: 'simple_push',
              contentStyle: { backgroundColor: darkMode ? '#111827' : '#F9FAFB' },
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          >
            <Stack.Screen
              name="Landing"
              options={{ animation: 'fade' }}
            >
              {(props) => <LandingScreen {...props} darkMode={darkMode} />}
            </Stack.Screen>
            <Stack.Screen
              name="Login"
              options={{ animation: 'slide_from_bottom' }}
            >
              {(props) => <LoginScreen {...props} onLogin={() => props.navigation.replace('HomeScreen')} />}
            </Stack.Screen>
            <Stack.Screen
              name="Signup"
              options={{ animation: 'slide_from_bottom' }}
            >
              {(props) => <SignupScreen {...props} onSignup={() => props.navigation.replace('HomeScreen')} />}
            </Stack.Screen>
            <Stack.Screen
              name="EmailOtp"
              options={{ animation: 'slide_from_right' }}
            >
              {(props) => <EmailOtpScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="HomeScreen">{(props) => <HomeScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="Feed">{(props) => <FeedScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen
              name="Camera"
              options={{ animation: 'slide_from_bottom' }}
            >
              {(props) => <CameraScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="SubmitComplaintDetails">{(props) => <SubmitComplaintDetailsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="SubmitComplaint">{(props) => <SubmitComplaintScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="SubmittedComplaint">{(props) => <SubmittedComplaintScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="DraftComplaintSubmit">{(props) => <DraftComplaintSubmitScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="DraftSubmitted">{(props) => <DraftSubmittedScreen {...props} darkMode={darkMode} />}</Stack.Screen>
            <Stack.Screen name="UserComplaintList">{(props) => <UserComplaintListScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="SimilarComplaints">{(props) => <SimilarComplaintsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="Notifications">{(props) => <NotificationsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="Profile">{(props) => <ProfileScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="ComplaintDetails">{(props) => <ComplaintDetailsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="AuthorityDashboard">{(props) => <AuthorityDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="AuthorityComplaintList">{(props) => <AuthorityComplaintListScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="AuthorityComplaintDetail">{(props) => <AuthorityComplaintDetailScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="AdminDashboard">{(props) => <AdminDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="AdminComplaintDetail">{(props) => <AdminComplaintDetailScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.reset({ index: 1, routes: [{ name: 'Landing' }, { name: 'Login' }] })} />}</Stack.Screen>
            <Stack.Screen name="AdminCategoryRequestDetails">{(props) => <AdminCategoryRequestDetailsScreen {...props} />}</Stack.Screen>
            <Stack.Screen name="AddEvidence">{(props) => <AddEvidenceScreen {...props} />}</Stack.Screen>
            <Stack.Screen name="OfflineGallery">{(props) => <OfflineGalleryScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="AdminAnalytics">{(props) => <AdminAnalyticsScreen {...props} darkMode={darkMode} />}</Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </NotificationProvider>
    </ComplaintProvider>
  );
}
