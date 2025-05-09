import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.85;
const BUTTON_HEIGHT = 70;

// Pre-defined buttons array with correct icon names
const buttons = [
  {
    id: 'user',
    title: 'User Login',
    icon: 'person',
    iconLib: Ionicons,
    color: '#4a6cf7',
    route: 'UserLogin'
  },
  {
    id: 'admin',
    title: 'Admin Login',
    icon: 'shield-account',
    iconLib: MaterialCommunityIcons,
    color: '#ff6b6b',
    route: 'AdminLogin'
  },
  {
    id: 'driver',
    title: 'Driver Login',
    icon: 'car',
    iconLib: FontAwesome,
    color: '#20c997',
    route: 'DriverLogin'
  },
  {
    id: 'register',
    title: 'Register',
    icon: 'edit',
    iconLib: Feather,
    color: '#9775fa',
    route: 'UserRegistration'
  }
];

const LoginOptionsScreen = ({ navigation }) => {
  // Optimized animations using native driver
  const buttonScales = useRef(buttons.map(() => new Animated.Value(1))).current;
  const bgFade = useRef(new Animated.Value(0)).current;

  const handlePressIn = (index) => {
    // Remove Haptics.prepareAsync() as it's not needed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(buttonScales[index], {
      toValue: 0.97,
      speed: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index, route) => {
    Animated.spring(buttonScales[index], {
      toValue: 1,
      speed: 50,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(route);
    });
  };

  // Fast background fade-in
  useEffect(() => {
    Animated.timing(bgFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgFade }]}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>RideSphere</Text>
            <Text style={styles.subtitle}>Start your journey</Text>
          </View>

          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => {
              const IconComponent = button.iconLib;
              return (
                <Animated.View 
                  key={button.id}
                  style={[
                    styles.buttonShadow,
                    { transform: [{ scale: buttonScales[index] }] }
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPressIn={() => handlePressIn(index)}
                    onPressOut={() => handlePressOut(index, button.route)}
                    delayPressIn={0}
                  >
                    <LinearGradient
                      colors={[button.color, `${button.color}cc`]}
                      style={styles.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <IconComponent name={button.icon} size={28} color="#fff" />
                      <Text style={styles.buttonText}>{button.title}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  buttonsContainer: {
    marginTop: 30,
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    marginVertical: 10,
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    justifyContent: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    marginLeft: 15,
    flex: 1,
  },
});

export default LoginOptionsScreen;