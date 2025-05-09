import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserProfileScreen = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await axios.post('http://192.168.29.202:3000/api/getUserDetails', {
            token
          });

          if (response.data.success) {
            setUserDetails(response.data.user);
          } else {
            setError(response.data.message);
          }
        } else {
          setError('No token found');
        }
      } catch (error) {
        setError('Error fetching user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      {userDetails ? (
        <View>
          <Text>Name: {userDetails.name}</Text>
          <Text>Date of Birth: {userDetails.dob}</Text>
          <Text>Email: {userDetails.email}</Text>
          <Text>Gender: {userDetails.gender}</Text>
          <Text>Age: {userDetails.age}</Text>
        </View>
      ) : (
        <Text>No user details available</Text>
      )}
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
});

export default UserProfileScreen;
