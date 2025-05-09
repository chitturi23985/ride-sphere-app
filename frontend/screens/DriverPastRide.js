// DriverPastRide.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const DriverPastRide = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        // Retrieve driver email from AsyncStorage
        const driverEmail = await AsyncStorage.getItem('driverEmail');
        console.log("Driver Email from AsyncStorage:", driverEmail);

        if (!driverEmail) {
          throw new Error("Driver email not found in AsyncStorage.");
        }

        // Fetch data from backend
        const response = await axios.post('http://192.168.29.202:3000/getDriverPastRides', {
          driverEmail
        });

        console.log("Response from Backend:", response.data);
        setRides(response.data);
      } catch (err) {
        console.log("Error:", err);
        setError('Failed to retrieve past rides');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      {rides.length > 0 ? (
        <FlatList
          data={rides}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>Source: {item.source}</Text>
              <Text>Destination: {item.destination}</Text>
              <Text>Charge: {item.charge}</Text>
              <Text>Date: {new Date(item.ride_date).toLocaleString()}</Text>
            </View>
          )}
          keyExtractor={(item) => item.ride_id ? item.ride_id.toString() : Math.random().toString()} // Handling undefined ride_id
        />
      ) : (
        <Text>No past rides found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  item: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    elevation: 1,
  },
});

export default DriverPastRide; // Ensure this line is present
