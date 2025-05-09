import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const CreateDriverScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [password, setPassword] = useState(''); // Add password state

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !dob || !address || !phoneNumber || !emailId || !drivingLicenseNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('http://192.168.29.202:3000/api/drivers', { // Update the URL as needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          dob,
          address,
          phone_number: phoneNumber,
          email_id: emailId,
          driving_license_number: drivingLicenseNumber,
          password // Include password in the request payload
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while creating the driver.');
      console.error('Fetch error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Driver</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dob}
        onChangeText={setDob}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Email ID"
        value={emailId}
        onChangeText={setEmailId}
      />
      <TextInput
        style={styles.input}
        placeholder="Driving License Number"
        value={drivingLicenseNumber}
        onChangeText={setDrivingLicenseNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true} // Ensure password input is secure
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default CreateDriverScreen;
