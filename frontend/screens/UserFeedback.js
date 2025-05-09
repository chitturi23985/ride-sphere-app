// UserFeedback.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const UserFeedback = () => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (feedback.trim() === '') {
      Alert.alert('Error', 'Feedback cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      // Send feedback to backend
      const response = await axios.post('http://192.168.29.202:3000/submitFeedback', { feedback });
      if (response.status === 200) {
        Alert.alert('Success', 'Thank you for your feedback!');
        setFeedback(''); // Clear the input
      } else {
        Alert.alert('Error', 'Failed to submit feedback.');
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert('Error', 'Something went wrong, please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Your Feedback</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Write your feedback here..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
        numberOfLines={4}
      />
      <Button
        title={loading ? "Submitting..." : "Submit Feedback"}
        onPress={handleFeedbackSubmit}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
});

export default UserFeedback;
