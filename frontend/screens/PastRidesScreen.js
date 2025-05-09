import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Corrected import
import axios from 'axios';

const PastRidesScreen = () => {
  const [rides, setRides] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        // Retrieve user email from AsyncStorage
        const userEmail = await AsyncStorage.getItem('userEmail');
        console.log("User Email from AsyncStorage:", userEmail);  // Debugging line

        if (!userEmail) {
          throw new Error("User email not found in AsyncStorage.");
        }

        // Fetch data from backend
        const response = await axios.post('http://192.168.29.202:3000/getPastRides', {
          userEmail
        });

        console.log("Response from Backend:", response.data);  // Debugging line
        setRides(response.data);
      } catch (err) {
        console.log("Error:", err);  // Log the actual error
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
    <View style={{ padding: 20 }}>
      {rides ? (
        <FlatList
          data={[rides]} // Assuming only one ride for now
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              <Text>Source: {item.source}</Text>
              <Text>Destination: {item.destination}</Text>
              <Text>Charge: {item.charge}</Text>
              <Text>Date: {item.ride_date}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <Text>No rides found</Text>
      )}
    </View>
  );
};

export default PastRidesScreen;
