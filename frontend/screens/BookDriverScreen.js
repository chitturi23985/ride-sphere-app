import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const BookDriverScreen = ({ route, navigation }) => {
  const { driver } = route.params;
  const [date, setDate] = useState(new Date());
  const [hours, setHours] = useState('1');
  const [pickupLocation, setPickupLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // In a real app, you would get this from your auth context
  const [userEmail, setUserEmail] = useState('user@example.com'); 

  const API_BASE_URL = 'http://192.168.29.202:3000/api/rental';

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const handleBooking = async () => {
    if (!pickupLocation || !hours) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const hoursNum = parseInt(hours);
    if (hoursNum < 1) {
      Alert.alert('Error', 'Minimum booking is 1 hour');
      return;
    }

    try {
      setLoading(true);
      
      const bookingData = {
        driver_id: driver.id,
        user_email: userEmail,
        start_time: date.toISOString(),
        hours: hoursNum,
        pickup_location: pickupLocation
      };

      const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Booking failed');
      }

      Alert.alert(
        'Booking Confirmed',
        `Your booking with ${driver.name} is confirmed!\n\nTotal Price: $${response.data.totalPrice}`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home') 
          }
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || error.message || 'Failed to create booking'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book {driver.name}</Text>
        <Text style={styles.subtitle}>{driver.vehicle_type} Vehicle (${driver.price_per_hour}/hr)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pickup Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pickup address"
          value={pickupLocation}
          onChangeText={setPickupLocation}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Booking Date & Time</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#666" style={styles.inputIcon} />
          <Text style={styles.dateText}>
            {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={onChangeDate}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Duration (hours)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter hours"
          keyboardType="numeric"
          value={hours}
          onChangeText={(text) => setHours(text.replace(/[^0-9]/g, ''))}
        />
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Estimated Total:</Text>
        <Text style={styles.priceValue}>
          ${driver.price_per_hour * parseInt(hours || 0)}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.bookButton}
        onPress={handleBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateInput: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3A86FF',
  },
  bookButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookDriverScreen;