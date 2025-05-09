import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserRegistrationScreen = ({ navigation }) => {
  // State variables to store user inputs
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState(''); // New state for mobile number
  const [password, setPassword] = useState('');

  // Function to handle registration form submission
  const handleRegister = async () => {
    if (!name || !dob || !age || !gender || !email || !mobile || !password) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    // Prepare data for submission
    const userData = {
      name,
      dob,
      age: parseInt(age, 10),
      gender,
      email,
      mobile,  // Include mobile number
      password,
    };

    try {
      // Call the backend API to save the data
      const response = await fetch('http://192.168.29.202:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        // Store email in AsyncStorage
        await AsyncStorage.setItem('userEmail', email);

        Alert.alert('Success', 'Registration successful!');
        navigation.navigate('UserDashboardScreen');
      } else {
        Alert.alert('Error', 'Registration failed. Try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text>User Registration</Text>
      
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
        placeholder="Age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
});

export default UserRegistrationScreen;
