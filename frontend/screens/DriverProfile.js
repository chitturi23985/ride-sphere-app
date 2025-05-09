import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DriverProfile = ({ route }) => {
  const { driverDetails } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Profile</Text>
      <Text style={styles.label}>Name: {driverDetails.name}</Text>
      <Text style={styles.label}>Date of Birth: {driverDetails.dob}</Text>
      <Text style={styles.label}>Address: {driverDetails.address}</Text>
      <Text style={styles.label}>Phone Number: {driverDetails.phone_number}</Text>
      <Text style={styles.label}>Email: {driverDetails.email_id}</Text>
      <Text style={styles.label}>Driving License Number: {driverDetails.driving_license_number}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    marginVertical: 5,
  },
});

export default DriverProfile;
