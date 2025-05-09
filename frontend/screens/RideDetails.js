import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const RideDetails = () => {
  const [rideDetails, setRideDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const response = await axios.get('http://192.168.29.202:3000/api/getRideDetails');
        setRideDetails(response.data);
      } catch (err) {
        console.error('Failed to fetch ride details:', err);
        setError('Failed to fetch ride details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rideDetails.length > 0 ? (
        <FlatList
          data={rideDetails}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.text}>Ride ID: {item.ride_id}</Text>
              <Text style={styles.text}>User Phone: {item.user_ph}</Text>
              <Text style={styles.text}>Source: {item.source}</Text>
              <Text style={styles.text}>Destination: {item.destination}</Text>
              <Text style={styles.text}>Distance: {item.distance} km</Text>
              <Text style={styles.text}>Charge: ₹{item.charge}</Text>
              <Text style={styles.text}>Driver Phone: {item.driver_ph}</Text>
              <Text style={styles.text}>Driver Email: {item.driver_email}</Text>
              <Text style={styles.text}>Date: {new Date(item.ride_date).toLocaleString()}</Text>
            </View>
          )}
          keyExtractor={(item) => item.ride_id.toString()}
        />
      ) : (
        <Text style={styles.noData}>No rides found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    elevation: 1,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 18,
  },
  noData: {
    textAlign: 'center',
    fontSize: 18,
    color: 'gray',
  },
});

export default RideDetails;
