import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Replace with your preferred background image URL
  const backgroundImageUrl = 'https://images.unsplash.com/photo-1518655048521-f130df041f66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=8';

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Validation Error", "Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http:/192.168.29.202:3000/api/userlogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userEmail', username);
        navigation.navigate("UserDashboard");
      } else {
        Alert.alert("Login Failed", data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "An error occurred while trying to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: backgroundImageUrl }}
      style={styles.backgroundImage}
      resizeMode="cover"
      blurRadius={2} // Optional: adds slight blur to background
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your account</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username or email"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.disabledButton]} 
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.6}
              >
                <Text style={styles.footerText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.6}
              >
                <Text style={styles.footerText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  loginContainer: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    backgroundColor: '#f9f9f9',
    borderColor: '#e1e1e1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#4a6ea9',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  footerText: {
    color: '#4a6ea9',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#ccc',
    marginHorizontal: 15,
  },
});

export default UserLoginScreen;