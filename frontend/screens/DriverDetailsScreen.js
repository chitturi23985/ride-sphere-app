import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';

const DriverDetailsScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://192.168.29.202:3000/api/drivers') // Update URL if needed
      .then(response => response.json())
      .then(data => {
        setDrivers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Details</Text>
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>Name: {item.name}</Text>
            <Text>Date of Birth: {item.dob}</Text>
            <Text>Address: {item.address}</Text>
            <Text>Phone Number: {item.phone_number}</Text>
            <Text>Email ID: {item.email_id}</Text>
            <Text>Driving License Number: {item.driving_license_number}</Text>
            {/* Avoid displaying raw passwords for security reasons */}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    marginBottom: 15,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default DriverDetailsScreen;
