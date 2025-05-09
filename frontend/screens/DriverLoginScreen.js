import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const DriverLoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const navigation = useNavigation();
  const locationRef = useRef(location); // To keep track of location updates

  useEffect(() => {
    // Ask for location permissions
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this app to work.');
        return;
      }

      // Get the initial location
      let initialLocation = await Location.getCurrentPositionAsync({});
      locationRef.current = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      };
      setLocation(locationRef.current);

      // Set up periodic location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 60000, // Update every 60 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          locationRef.current = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(locationRef.current);
        }
      );
      setLocationSubscription(subscription);
    })();

    // Cleanup function to stop location updates when the component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available yet');
      return;
    }

    try {
      const response = await axios.post('http://192.168.29.202:3000/api/driver-login', {
        username,
        password,
        latitude: location.latitude,  // Sending latitude and longitude
        longitude: location.longitude
      });

      if (response.data.success) {
        // Store driver's email in AsyncStorage
        await AsyncStorage.setItem('driverEmail', username);

        // Navigate to DriverDashboard with driver details
        navigation.navigate('DriverDashboard', {
          driverId: response.data.driverId,
          driverName: response.data.driverName,
        });
      } else {
        Alert.alert('Login Failed', response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Email"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default DriverLoginScreen;
