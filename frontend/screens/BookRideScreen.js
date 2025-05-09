import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';

const NOMINATIM_GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_ROUTE_URL = 'http://router.project-osrm.org/route/v1/driving';

const BookRideScreen = () => {
  const [location, setLocation] = useState(null);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [charge, setCharge] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch('http://192.168.29.202:3000/available-drivers');
        const drivers = await response.json();
        setAvailableDrivers(drivers);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };
    fetchDrivers();
  }, []);

  const handleSearch = async () => {
    if (!sourceCoords || !destinationCoords) {
      setErrorMsg('Please select both source and destination');
      return;
    }

    try {
      const routeResponse = await fetch(
        `${OSRM_ROUTE_URL}/${sourceCoords.longitude},${sourceCoords.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full`
      );
      const routeData = await routeResponse.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        const routeCoordinates = polyline.decode(route.geometry).map(([latitude, longitude]) => ({
          latitude,
          longitude,
        }));

        setRoute(routeCoordinates);

        const distanceInKm = route.distance / 1000;
        setDistance(distanceInKm.toFixed(2));

        const calculatedCharge = distanceInKm * 5;
        setCharge(calculatedCharge.toFixed(2));
      } else {
        setErrorMsg('No valid route found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setErrorMsg('Error fetching route');
    }
  };

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
  
    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${NOMINATIM_GEOCODE_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ride-sharing-app',
        },
      });
  
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setSuggestions(data);
      } else {
        console.error('Unexpected content type:', contentType);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setErrorMsg('Unexpected response format from the server.');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setErrorMsg('Error fetching suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  const handleSuggestionPress = async (suggestion) => {
    const { lat, lon } = suggestion;
    const coords = { latitude: parseFloat(lat), longitude: parseFloat(lon) };

    if (activeInput === 'source') {
      setSourceCoords(coords);
      setSource(suggestion.display_name);
    } else if (activeInput === 'destination') {
      setDestinationCoords(coords);
      setDestination(suggestion.display_name);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  const setCurrentLocationAsSource = () => {
    if (location) {
      setSourceCoords(location);
      setSource('Current Location');
    } else {
      setErrorMsg('Current location is not available');
    }
  };

  const bookRide = async () => {
    if (!charge || !sourceCoords || !destinationCoords || !distance) {
      alert('Please ensure all details are filled in.');
      return;
    }

    try {
      const userEmail = await AsyncStorage.getItem('userEmail');

      if (!userEmail) {
        alert('User email not found. Please log in again.');
        return;
      }

      const response = await fetch('http://192.168.29.202:3000/book-ride', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          source: sourceCoords,
          destination: destinationCoords,
          distance,
          charge,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Ride booked successfully! Driver details: ${result.driverPhone}, ${result.driverEmail}`);
      } else {
        alert(`Error booking ride: ${result.message}`);
      }
    } catch (error) {
      console.error('Error booking ride:', error);
      alert('Error booking ride.');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </LinearGradient>
    );
  }

  if (errorMsg) {
    return (
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.gradient}>
        <MapView
          style={styles.map}
          region={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
        >
          {location && <Marker coordinate={location} title="You are here" />}
          {sourceCoords && (
            <Marker coordinate={sourceCoords}>
              <View style={styles.markerContainer}>
                <View style={[styles.markerPin, styles.sourcePin]}>
                  <MaterialIcons name="location-on" size={24} color="#fff" />
                </View>
              </View>
            </Marker>
          )}
          {destinationCoords && (
            <Marker coordinate={destinationCoords}>
              <View style={styles.markerContainer}>
                <View style={[styles.markerPin, styles.destinationPin]}>
                  <FontAwesome name="map-marker" size={24} color="#fff" />
                </View>
              </View>
            </Marker>
          )}
          {route && <Polyline coordinates={route} strokeColor="#6a11cb" strokeWidth={4} />}

          {availableDrivers.map((driver, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: parseFloat(driver.latitude), longitude: parseFloat(driver.longitude) }}
              title={driver.name}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car-sport" size={24} color="#fff" />
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <MaterialIcons name="my-location" size={20} color="#6a11cb" />
            </View>
            <TextInput
              style={[styles.input, activeInput === 'source' && styles.activeInput]}
              placeholder="Pickup location"
              placeholderTextColor="#888"
              onChangeText={(text) => {
                setSource(text);
                fetchSuggestions(text);
              }}
              value={source}
              onFocus={() => setActiveInput('source')}
            />
            <TouchableOpacity 
              style={styles.currentLocationButton} 
              onPress={setCurrentLocationAsSource}
            >
              <Text style={styles.currentLocationText}>Current</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <FontAwesome name="map-marker" size={20} color="#ff4757" />
            </View>
            <TextInput
              style={[styles.input, activeInput === 'destination' && styles.activeInput]}
              placeholder="Where to?"
              placeholderTextColor="#888"
              onChangeText={(text) => {
                setDestination(text);
                fetchSuggestions(text);
              }}
              value={destination}
              onFocus={() => setActiveInput('destination')}
            />
          </View>

          {loadingSuggestions && (
            <View style={styles.suggestionLoading}>
              <ActivityIndicator size="small" color="#6a11cb" />
            </View>
          )}

          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => (item.place_id ? item.place_id.toString() : Math.random().toString())}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem} 
                  onPress={() => handleSuggestionPress(item)}
                >
                  <MaterialIcons 
                    name="location-on" 
                    size={20} 
                    color="#6a11cb" 
                    style={styles.suggestionIcon} 
                  />
                  <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionList}
              keyboardShouldPersistTaps="always"
            />
          )}

          {(distance || charge) && (
            <View style={styles.rideInfoContainer}>
              <View style={styles.rideInfoItem}>
                <Ionicons name="time-outline" size={20} color="#6a11cb" />
                <Text style={styles.rideInfoText}>Distance: {distance} km</Text>
              </View>
              <View style={styles.rideInfoItem}>
                <MaterialIcons name="attach-money" size={20} color="#6a11cb" />
                <Text style={styles.rideInfoText}>Estimated: ₹{charge}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
            disabled={!source || !destination}
          >
            <Text style={styles.searchButtonText}>Search Route</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.bookButton, (!charge || !distance) && styles.disabledButton]} 
            onPress={bookRide}
            disabled={!charge || !distance}
          >
            <Text style={styles.bookButtonText}>Book Premium Ride</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  map: {
    width: '100%',
    height: '50%',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  activeInput: {
    backgroundColor: '#f0e6ff',
  },
  currentLocationButton: {
    backgroundColor: '#e6e6ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 10,
  },
  currentLocationText: {
    color: '#6a11cb',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionLoading: {
    padding: 10,
    alignItems: 'center',
  },
  suggestionList: {
    maxHeight: 150,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  rideInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  rideInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideInfoText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#6a11cb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#2575fc',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2575fc',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowColor: '#999',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  sourcePin: {
    backgroundColor: '#6a11cb',
  },
  destinationPin: {
    backgroundColor: '#ff4757',
  },
  driverMarker: {
    backgroundColor: '#2575fc',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default BookRideScreen;
