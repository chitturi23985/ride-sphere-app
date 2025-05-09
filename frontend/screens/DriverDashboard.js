import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const DriverDashboard = ({ route }) => {
  const { driverId, driverName } = route.params;
  const [email, setEmail] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const navigation = useNavigation();

  // Predefined questions and answers
  const predefinedQA = {
    "Hey Good Morning":"Very Good Morning How can I help you",
    "Good morning":"Very Good Morning How can I help you",
    "Hey Good Afternoon":"Very Good Morning How can I help you",
    "Good afternoon":"Very Good Morning How can I help you",
    "Hey Good Evening":"Very Good Morning How can I help you",
    "Good evening":"Very Good Morning How can I help you",
    "Hi":"Hi!, How can I help you.",
    "How to see profile": "Click on the profile button on the Dashboard",
    "How to see History or Past Rides": "Click on the Past Ride button on the Dashboard",
    "How to see History": "Click on the Past Ride button on the Dashboard",
    "How to see history": "Click on the Past Ride button on the Dashboard",
    "How to see past rides": "Click on the Past Ride button on the Dashboard",
    "How to see User given Feedback": "Click On the Feedback button on the Dashboard",
    "How to check rides or current rides": "Click on Current Rides to see details.",
    "How to check current rides": "Click on Current Rides to see details.",
  };

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('driverEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          Alert.alert('Error', 'No email found in storage');
        }
      } catch (error) {
        console.error('Error fetching email from storage:', error);
        Alert.alert('Error', 'Failed to fetch email from storage');
      }
    };

    fetchEmail();
  }, []);

  const viewProfile = async () => {
    try {
      const response = await fetch(`http://192.168.29.202:3000/api/driver-details?email=${email}`);
      const data = await response.json();

      if (response.ok) {
        navigation.navigate('DriverProfile', { driverDetails: data });
      } else {
        console.error('Error fetching driver details:', data.message);
        Alert.alert('Error', data.message || 'Failed to fetch driver details');
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
      Alert.alert('Error', 'Failed to fetch driver details');
    }
  };

  const handleLogout = async () => {
    try {
      if (!email) {
        Alert.alert('Error', 'No email found for logout');
        return;
      }

      const response = await axios.post('http://192.168.29.202:3000/api/driver/logout', { email });

      if (response.data.message === 'Driver status updated successfully') {
        await AsyncStorage.removeItem('driverEmail');
        await AsyncStorage.removeItem('driverSession');
        navigation.navigate('DriverLogin');
      } else {
        Alert.alert('Logout Failed', response.data.message);
      }
    } catch (error) {
      console.error('Error during logout:', error.response ? error.response.data : error.message);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };

  const handleUserInput = () => {
    if (userInput.trim() === '') return;

    // Add user's message to chat
    setChatMessages(prevMessages => [...prevMessages, { text: userInput, sender: 'user' }]);

    // Clear input field
    const input = userInput.trim();
    setUserInput('');

    // Check if the input matches predefined questions
    const responseMessage = getResponse(input);
    
    // Show the response in an alert
    Alert.alert('Bot Response', responseMessage);
  };

  const getResponse = (question) => {
    // Check for predefined questions
    const normalizedQuestion = question.toLowerCase();
    for (let key in predefinedQA) {
      if (normalizedQuestion.includes(key.toLowerCase())) {
        return predefinedQA[key];
      }
    }
    return "Sorry, I'm not trained with that question.";
  };

  const toggleChat = () => {
    setChatVisible(!chatVisible);
    if (chatVisible) {
      // Clear messages when closing the chat
      setChatMessages([]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Dashboard</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DriverPastRides')}>
          <Text style={styles.buttonText}>Past Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CurrentRides')}>
          <Text style={styles.buttonText}>Current Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DriverFeedback')}>
          <Text style={styles.buttonText}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DriverResetPassword')}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileButtonContainer}>
        <TouchableOpacity style={styles.profileButton} onPress={viewProfile}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Bot Button */}
      <TouchableOpacity style={styles.chatBotButton} onPress={toggleChat}>
        <Text style={styles.chatBotButtonText}>Chat Bot</Text>
      </TouchableOpacity>

      {chatVisible && (
        <View style={styles.chatContainer}>
          <ScrollView style={styles.chatScroll}>
            {chatMessages.map((message, index) => (
              <View key={index} style={message.sender === 'user' ? styles.userMessage : styles.botMessage}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
            {chatMessages.length === 0 && (
              <Text style={styles.introText}>
                Type "current rides" or other questions to get started.
              </Text>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              value={userInput}
              onChangeText={setUserInput}
              onSubmitEditing={handleUserInput}
            />
            <TouchableOpacity onPress={handleUserInput} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05, // 5% padding on all sides
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: width * 0.06, // Responsive font size
    marginBottom: height * 0.02, // Responsive margin
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: height * 0.02,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: height * 0.02, // Responsive padding
    borderRadius: 5,
    marginVertical: height * 0.01, // Responsive margin
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045, // Responsive font size
  },
  profileButtonContainer: {
    marginTop: height * 0.02,
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: '#6C757D',
    padding: height * 0.02,
    borderRadius: 5,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: height * 0.02,
    borderRadius: 5,
    marginTop: height * 0.01,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
  },
  chatBotButton: {
    backgroundColor: '#28a745',
    padding: height * 0.02,
    borderRadius: 5,
    marginVertical: height * 0.02,
    alignItems: 'center',
  },
  chatBotButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
  },
  chatContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginTop: height * 0.02,
    padding: height * 0.02,
  },
  chatScroll: {
    flex: 1,
    padding: height * 0.01,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007BFF',
    borderRadius: 5,
    padding: height * 0.015,
    marginVertical: height * 0.01,
    maxWidth: '80%', // Limit the width of user messages
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    padding: height * 0.015,
    marginVertical: height * 0.01,
    maxWidth: '80%', // Limit the width of bot messages
  },
  messageText: {
    color: '#000',
  },
  introText: {
    color: '#6c757d',
    textAlign: 'center',
    marginVertical: height * 0.02,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.01,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: height * 0.015,
    marginRight: width * 0.02,
  },
  sendButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    padding: height * 0.015,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DriverDashboard;
