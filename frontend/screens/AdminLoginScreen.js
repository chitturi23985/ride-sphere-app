import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ImageBackground, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const AdminLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch('http://192.168.29.202:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Admin Login Successful", data.message);
        navigation.navigate("AdminDashboard");
      } else {
        Alert.alert("Admin Login Failed", data.message);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while trying to log in.");
      console.error(error);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
      style={styles.backgroundImage}
      blurRadius={1}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.loginContainer}>
          {/* Bike/Ride Logo Header */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="bike" size={42} color="#fff" />
            </View>
            <Text style={styles.title}>RideAdmin</Text>
            <Text style={styles.subtitle}>Fleet Management System</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account-key" size={24} color="#3498db" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Admin ID"
                placeholderTextColor="#95a5a6"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock" size={24} color="#3498db" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Admin Password"
                placeholderTextColor="#95a5a6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="login" size={22} color="#fff" />
              <Text style={styles.loginButtonText}> ADMIN LOGIN</Text>
            </TouchableOpacity>

            <View style={styles.warningContainer}>
              <MaterialCommunityIcons name="shield-alert" size={18} color="#e74c3c" />
              <Text style={styles.warningText}> Strictly for authorized administrators only</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  loginContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 25,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    backgroundColor: '#3498db',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#2980b9'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  formContainer: {
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#2c3e50',
  },
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#2980b9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 8,
  },
  warningText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default AdminLoginScreen;