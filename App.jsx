import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, Platform } from "react-native";

// Placeholder screen components
const LoginScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Login Screen</Text>
  </View>
);

const HomeScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Home Screen</Text>
  </View>
);

const SubmitComplaintScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Submit Complaint</Text>
  </View>
);

const FeedScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Complaints Feed</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Profile</Text>
  </View>
);

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#000",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <AppStack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: "Home" }} 
      />
      <AppStack.Screen 
        name="Complaint" 
        component={SubmitComplaintScreen} 
        options={{ title: "Complaint Details" }} 
      />
    </AppStack.Navigator>
  );
}

function AppTabNavigator() {
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          paddingBottom: 8,
          height: 60,
        },
      }}
    >
      <BottomTab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator} 
        options={{ title: "Home", headerShown: false }} 
      />
      <BottomTab.Screen 
        name="Feed" 
        component={FeedScreen} 
        options={{ title: "Feed" }} 
      />
      <BottomTab.Screen 
        name="Submit" 
        component={SubmitComplaintScreen} 
        options={{ title: "Submit" }} 
      />
      <BottomTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: "Profile" }} 
      />
    </BottomTab.Navigator>
  );
}

function RootNavigator({ isAuthenticated }) {
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("citizen");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // For web
    if (Platform.OS === "web") {
      const savedAuth = localStorage.getItem("isAuthenticated");
      const savedRole = localStorage.getItem("userRole");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
        setUserRole(savedRole || "citizen");
      }

      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode === "true") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (Platform.OS === "web") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", role);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole("citizen");
    if (Platform.OS === "web") {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (Platform.OS === "web") {
      localStorage.setItem("darkMode", (!darkMode).toString());
      document.documentElement.classList.toggle("dark");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator isAuthenticated={isAuthenticated} />
    </View>
  );
}

export default App;
