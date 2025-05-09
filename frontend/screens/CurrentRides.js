import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TextInput, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import polyline from '@mapbox/polyline';

const OSRM_ROUTE_URL = 'http://router.project-osrm.org/route/v1/driving';

const CurrentRides = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);

  // Fetch current location from the device
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  // Fetch ride details from the backend
  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const driverEmail = await AsyncStorage.getItem('driverEmail');
        console.log("Driver Email from AsyncStorage:", driverEmail); // Log driverEmail

        if (!driverEmail) {
          Alert.alert('Error', 'Driver email not found in session.');
          return;
        }

        const response = await fetch('http://192.168.29.202:3000/current-ride', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: driverEmail }),
        });

        const textResponse = await response.text();
        console.log("Response:", textResponse); // Log the response text

        const data = JSON.parse(textResponse);

        if (response.ok) {
          setRideDetails(data);
          // Fetch route from OSRM
          const { source, destination } = data;
          const routeResponse = await fetch(
            `${OSRM_ROUTE_URL}/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}?overview=full`
          );
          const routeData = await routeResponse.json();
          if (routeData.routes && routeData.routes.length > 0) {
            const routeCoords = polyline.decode(routeData.routes[0].geometry).map(([latitude, longitude]) => ({
              latitude,
              longitude,
            }));
            setRoute(routeCoords);
          }
        } else {
          Alert.alert('Error', data.message || 'Could not fetch ride details.');
        }
      } catch (error) {
        console.error('Error fetching ride details:', error);
        Alert.alert('Error', 'Failed to retrieve ride details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, []);

  // Function to verify OTP
  const verifyOtp = async () => {
    try {
      const driverEmail = await AsyncStorage.getItem('driverEmail');
      if (!driverEmail || !rideDetails) return;

      const { source, destination } = rideDetails;

      const response = await fetch('http://192.168.29.202:3000/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: driverEmail,
          otp,
          source,
          destination,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true); // Mark OTP as verified
        Alert.alert('Success', 'OTP verified successfully! You can start the ride now.');
      } else {
        Alert.alert('Error', data.message || 'OTP verification failed.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP.');
    }
  };

  // Function to handle starting the ride
  const startRide = () => {
    setRideStarted(true); // Mark ride as started
  };

  const completeRide = async () => {
    const driverEmail = await AsyncStorage.getItem('driverEmail');
    const { user_ph, source, destination, distance, charge } = rideDetails;
  
    // Validate input data before sending
    if (!driverEmail || !user_ph || !source || !destination || !charge || !distance) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
  
    // Send the ride details to backend
    try {
      const response = await fetch('http://192.168.29.202:3000/complete-ride', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_email: driverEmail, // This is the key to check
          user_ph,
          source,
          destination,
          charge,
          distance,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Update status in ride_info table
        await fetch('http://192.168.29.202:3000/update-ride-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            driver_email: driverEmail,
            user_ph,
            source,
            destination,
          }),
        });
  
        // Alert message to show after successful completion
        Alert.alert('Ride Completed', 'You can also use UPI: 1023');
      } else {
        Alert.alert('Error', data.message || 'Failed to save ride details.');
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride.');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentLocation && (
        <MapView
          style={styles.map}
          region={currentLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
        >
          {currentLocation && <Marker coordinate={currentLocation} title="Your Location" />}
          {rideDetails?.source && <Marker coordinate={rideDetails.source} title="Source" />}
          {rideDetails?.destination && <Marker coordinate={rideDetails.destination} title="Destination" />}
          {route && <Polyline coordinates={route} strokeColor="#0000FF" strokeWidth={2} />}
        </MapView>
      )}
      {rideDetails && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Distance: {rideDetails.distance} km</Text>
          <Text style={styles.infoText}>Charge: ₹{rideDetails.charge}</Text>
          <Text style={styles.infoText}>User Phone: {rideDetails.user_ph}</Text>

          {/* OTP Input Field */}
          {!otpVerified ? (
            <>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP"
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
              />
              <Button title="Submit" onPress={verifyOtp} />
            </>
          ) : (
            <>
              {!rideStarted ? (
                <Button title="Start Ride" onPress={startRide} />
              ) : (
                <Button title="Ride Completed" onPress={completeRide} />
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '70%',
  },
  infoContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  otpInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default CurrentRides;
