import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResetPasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation password do not match');
      return;
    }

    try {
      const storedEmail = await AsyncStorage.getItem('driverEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        const response = await fetch('http://192.168.29.202:3000/api/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: storedEmail,
            currentPassword,
            newPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          Alert.alert('Success', data.message);
          navigation.goBack(); // Navigate back to the previous screen
        } else {
          Alert.alert('Error', data.message);
        }
      } else {
        Alert.alert('Error', 'Email not found in storage');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'An error occurred while resetting the password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Reset Password" onPress={handleResetPassword} />
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
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default ResetPasswordScreen;
