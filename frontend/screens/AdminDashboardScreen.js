import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ImageBackground, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

const AdminDashboardScreen = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('adminToken');
      Alert.alert('Logout', 'You have been logged out successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('AdminLogin') }
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const DashboardCard = ({ icon, title, onPress, color }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: color + '20', borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '40' }]}>
          {icon}
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={color} />
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
      style={styles.backgroundImage}
      blurRadius={0.1}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="bike" size={32} color="#fff" style={styles.logoIcon} />
              <Text style={styles.title}>RideAdmin Dashboard</Text>
            </View>
            <Text style={styles.subtitle}>Fleet Management System</Text>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
              <MaterialCommunityIcons name="account-group" size={28} color="#3498db" />
              <Text style={[styles.statValue, { color: '#3498db' }]}>42</Text>
              <Text style={styles.statLabel}>Active Drivers</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
              <MaterialCommunityIcons name="bike" size={28} color="#2ecc71" />
              <Text style={[styles.statValue, { color: '#2ecc71' }]}>128</Text>
              <Text style={styles.statLabel}>Active Rides</Text>
            </View>
          </View>

          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            <DashboardCard
              icon={<FontAwesome name="user-plus" size={24} color="#9b59b6" />}
              title="Create Driver"
              onPress={() => navigation.navigate('CreateDriver')}
              color="#9b59b6"
            />

            <DashboardCard
              icon={<MaterialCommunityIcons name="account-details" size={24} color="#3498db" />}
              title="Driver Details"
              onPress={() => navigation.navigate('DriverDetails')}
              color="#3498db"
            />

            <DashboardCard
              icon={<MaterialCommunityIcons name="map-marker-path" size={24} color="#e67e22" />}
              title="Ride Details"
              onPress={() => navigation.navigate('RideDetails')}
              color="#e67e22"
            />

            <DashboardCard
              icon={<MaterialCommunityIcons name="chart-bar" size={24} color="#2ecc71" />}
              title="Ride Analytics"
              onPress={() => navigation.navigate('RideAnalytics')}
              color="#2ecc71"
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.2}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#fff" />
            <Text style={styles.logoutButtonText}> Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoIcon: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 50,
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AdminDashboardScreen;