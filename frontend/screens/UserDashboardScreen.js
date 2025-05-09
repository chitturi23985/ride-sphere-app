import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const UserDashboardScreen = ({ navigation }) => {
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatVisible, setChatVisible] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];
  const buttonScales = useState(Array(7).fill().map(() => new Animated.Value(1)))[0];
  const chatHeight = useState(new Animated.Value(0))[0];

  // Predefined questions and answers
  const predefinedQA = {
    "Hey Good Morning": "Very Good Morning! How can I help you?",
    "Good morning": "Very Good Morning! How can I help you?",
    "Hey Good Afternoon": "Very Good Afternoon! How can I help you?",
    "Good afternoon": "Very Good Afternoon! How can I help you?",
    "Hey Good Evening": "Very Good Evening! How can I help you?",
    "Good evening": "Very Good Evening! How can I help you?",
    "Hi": "Hi! How can I help you?",
    "how to see profile": "Click on the profile button on the Dashboard",
    "How to see profiles": "Click on the profile button on the Dashboard",
    "How to see profile": "Click on the profile button on the Dashboard",
    "How to see History": "Click on the Past Ride button on the Dashboard",
    "how to see history": "Click on the Past Ride button on the Dashboard",
    "How to see Past Rides": "Click on the Past Ride button on the Dashboard",
    "how to see past Rides": "Click on the Past Ride button on the Dashboard",
    "How to see History or Past Rides": "Click on the Past Ride button on the Dashboard",
    "How to see given Feedback": "Click On the Feedback button on the Dashboard",
    "how to see given Feedback": "Click On the Feedback button on the Dashboard",
    "how to see given feedback": "Click On the Feedback button on the Dashboard",
    "How to book rides or current rides": "Click on Book Rides on the Dashboard.",
    "How to book rides": "Click on Book Rides on the Dashboard.",
    "How to book current rides": "Click on Book Rides on the Dashboard.",
  };

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      })
    ]).start();

    const fetchToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token);
          fetchUserDetails(token);
        } else {
          navigation.navigate("UserLogin");
        }
      } catch (error) {
        console.error('Failed to retrieve token:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [navigation]);

  const fetchUserDetails = async (token) => {
    try {
      const response = await fetch('http://192.168.29.202:3000/api/getUserDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setUserDetails(data.user);
      } else {
        console.error('Failed to fetch user details:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserLogin' }],
      });
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  };

  const handlePressIn = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(buttonScales[index], {
      toValue: 0.95,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index, route) => {
    Animated.spring(buttonScales[index], {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start(() => {
      if (route) navigation.navigate(route);
    });
  };

  const toggleChat = () => {
    Animated.timing(chatHeight, {
      toValue: chatVisible ? 0 : 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setChatVisible(!chatVisible);
  };

  const handleUserInput = () => {
    if (userInput.trim() === '') return;

    // Add user's message with animation
    setChatMessages(prevMessages => [...prevMessages, { text: userInput, sender: 'user' }]);
    setUserInput('');

    // Get response after a slight delay
    setTimeout(() => {
      const responseMessage = getResponse(userInput.trim());
      setChatMessages(prevMessages => [...prevMessages, { text: responseMessage, sender: 'bot' }]);
    }, 500);
  };

  const getResponse = (question) => {
    const normalizedQuestion = question.toLowerCase();
    for (let key in predefinedQA) {
      if (normalizedQuestion.includes(key.toLowerCase())) {
        return predefinedQA[key];
      }
    }
    return "I'm still learning! For now, try asking about profile, rides, or feedback.";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  const chatHeightInterpolated = chatHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250]
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.header, { transform: [{ translateY: slideUpAnim }] }]}>
        <Text style={styles.title}>Welcome back!</Text>
        {userDetails && (
          <Text style={styles.subtitle}>{userDetails.name || 'User'}</Text>
        )}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.buttonContainer}>
        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[0] }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPressIn={() => handlePressIn(0)}
            onPressOut={() => handlePressOut(0, "UserProfile")}
            activeOpacity={0.9}
          >
            <Ionicons name="person" size={24} color="#fff" />
            <Text style={styles.buttonText}>Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[1] }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPressIn={() => handlePressIn(1)}
            onPressOut={() => handlePressOut(1, "UserResetPassword")}
            activeOpacity={0.9}
          >
            <Ionicons name="key" size={24} color="#fff" />
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[2] }] }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#20c997' }]}
            onPressIn={() => handlePressIn(2)}
            onPressOut={() => handlePressOut(2, "BookRide")}
            activeOpacity={0.9}
          >
            <FontAwesome name="car" size={24} color="#fff" />
            <Text style={styles.buttonText}>Book a Ride</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[3] }] }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#9775fa' }]}
            onPressIn={() => handlePressIn(3)}
            onPressOut={() => handlePressOut(3, "RentDriver")}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="steering" size={24} color="#fff" />
            <Text style={styles.buttonText}>Rent a Driver</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[4] }] }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff6b6b' }]}
            onPressIn={() => handlePressIn(4)}
            onPressOut={() => handlePressOut(4, "PastRides")}
            activeOpacity={0.9}
          >
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.buttonText}>Past Rides</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[5] }] }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ffa502' }]}
            onPressIn={() => handlePressIn(5)}
            onPressOut={() => handlePressOut(5, "UserFeedback")}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="message-reply-text" size={24} color="#fff" />
            <Text style={styles.buttonText}>Feedback</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScales[6] }] }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#6c757d' }]}
            onPressIn={() => handlePressIn(6)}
            onPressOut={() => handlePressOut(6)}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <Ionicons name="log-out" size={24} color="#fff" />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          style={styles.chatToggle}
          onPress={toggleChat}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name={chatVisible ? "robot-off" : "robot"} 
            size={28} 
            color="#fff" 
          />
          <Text style={styles.chatToggleText}>
            {chatVisible ? "Hide Assistant" : "Need Help?"}
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.chatContainer, { height: chatHeightInterpolated }]}>
          <ScrollView 
            style={styles.chatScroll}
            ref={ref => {
              if (ref) {
                setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
              }
            }}
          >
            {chatMessages.map((message, index) => (
              <View 
                key={index} 
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userBubble : styles.botBubble
                ]}
              >
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
            {chatMessages.length === 0 && (
              <View style={styles.welcomeMessage}>
                <Text style={styles.welcomeText}>Hi there! I'm your RideSphere assistant.</Text>
                <Text style={styles.welcomeText}>Try asking:</Text>
                <Text style={styles.exampleQuestion}>• How to book rides</Text>
                <Text style={styles.exampleQuestion}>• How to see past rides</Text>
                <Text style={styles.exampleQuestion}>• How to update my profile</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              value={userInput}
              onChangeText={setUserInput}
              onSubmitEditing={handleUserInput}
              placeholderTextColor="#adb5bd"
            />
            <TouchableOpacity onPress={handleUserInput} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#4a6cf7" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  buttonWrapper: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a6cf7',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a6cf7',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  chatToggleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chatScroll: {
    padding: 15,
    maxHeight: 180,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a6cf7',
    borderTopRightRadius: 0,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderTopLeftRadius: 0,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  botBubbleText: {
    color: '#212529',
  },
  welcomeMessage: {
    padding: 10,
  },
  welcomeText: {
    color: '#6c757d',
    marginBottom: 5,
    fontSize: 16,
  },
  exampleQuestion: {
    color: '#4a6cf7',
    marginLeft: 15,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
});

export default UserDashboardScreen;