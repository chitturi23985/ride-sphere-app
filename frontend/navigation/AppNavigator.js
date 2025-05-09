// AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Import your screens
import LoginOptionsScreen from '../screens/LoginOptionsScreen';
import UserLoginScreen from '../screens/UserLoginScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import DriverLoginScreen from '../screens/DriverLoginScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CreateDriverScreen from '../screens/CreateDriverScreen';
import DriverDetailsScreen from '../screens/DriverDetailsScreen';
import DriverDashboard from '../screens/DriverDashboard';
import DriverProfile from '../screens/DriverProfile';
import UserResetPasswordScreen from '../screens/UserResetPasswordScreen';
import DriverResetPasswordScreen from '../screens/DriverResetPasswordScreen';
import UserRegistrationScreen from '../screens/UserRegistrationScreen';
import UserDashboardScreen from '../screens/UserDashboardScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import BookRideScreen from '../screens/BookRideScreen';
import CurrentRides from '../screens/CurrentRides';
import PastRidesScreen from '../screens/PastRidesScreen';
import DriverPastRide from '../screens/DriverPastRide'; // Ensure this path is correct
import UserFeedback from '../screens/UserFeedback';
import DriverFeedback from '../screens/DriverFeedback';
import RideDetails from '../screens/RideDetails';
import RentDriverScreen from '../screens/RentDriverScreen';
import BookDriverScreen from '../screens/BookDriverScreen';


const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="LoginOptions">
      <Stack.Screen name="LoginOptions" component={LoginOptionsScreen} />
      <Stack.Screen name="UserLogin" component={UserLoginScreen} />
      <Stack.Screen name="UserResetPassword" component={UserResetPasswordScreen} />
      <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
      <Stack.Screen name="DriverResetPassword" component={DriverResetPasswordScreen} />
      <Stack.Screen name="DriverPastRides" component={DriverPastRide} />

      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CreateDriver" component={CreateDriverScreen} />
      <Stack.Screen name="DriverDetails" component={DriverDetailsScreen} />
      <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
      <Stack.Screen name="DriverProfile" component={DriverProfile} />
      <Stack.Screen name="UserRegistration" component={UserRegistrationScreen} />
      <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="BookRide" component={BookRideScreen} />
      <Stack.Screen name="CurrentRides" component={CurrentRides} />
      <Stack.Screen name="PastRides" component={PastRidesScreen} />
      <Stack.Screen name="UserFeedback" component={UserFeedback}/>
      <Stack.Screen name='DriverFeedback' component={DriverFeedback}/>
      <Stack.Screen name='RideDetails' component={RideDetails}/>
      <Stack.Screen 
        name="RentDriver" 
        component={RentDriverScreen}
        options={{ title: 'Rent a Driver' }} 
      />
      <Stack.Screen 
  name="BookDriver" 
  component={BookDriverScreen} 
  options={{ title: 'Book Driver' }}
/>

    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;