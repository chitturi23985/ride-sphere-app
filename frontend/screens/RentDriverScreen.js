import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const RentDriverScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic API URL based on platform
  const API_BASE_URL = 'http://192.168.29.202:3000/api/rental';

  // Enhanced fetch function with retries
  const fetchDrivers = async (isRefreshing = false) => {
    const currentPage = isRefreshing ? 1 : page;
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching drivers from:', `${API_BASE_URL}/drivers`);
      
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        params: {
          vehicleType: selectedFilter === 'all' ? null : selectedFilter,
          page: currentPage,
          limit: 10
        },
        timeout: 10000
      });

      console.log('API Response:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Invalid response format');
      }

      setDrivers(prev => 
        isRefreshing 
          ? response.data.data 
          : [...prev, ...response.data.data]
      );
      setHasMore(response.data.pagination.total > currentPage * response.data.pagination.limit);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        config: error.config,
        response: error.response?.data
      });

      setError(error);
      
      Alert.alert(
        'Connection Error',
        'Failed to load drivers. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => fetchDrivers(isRefreshing)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDrivers(true);
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchDrivers(true);
  };

  const loadMoreDrivers = () => {
    if (!loading && hasMore && !error) {
      fetchDrivers();
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const query = searchQuery.toLowerCase();
    return (
      driver.name.toLowerCase().includes(query) || 
      driver.vehicle_type.toLowerCase().includes(query)
    );
  });

  const renderDriverItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.driverCard}
      onPress={() => navigation.navigate('BookDriver', { 
        driver: {
          ...item,
          pricePerHour: `$${item.price_per_hour}`,
          available: item.is_available
        }
      })}
    >
      <View style={styles.driverInitialContainer}>
        <Text style={styles.driverInitial}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.ridesText}>({item.rides_completed} rides)</Text>
        </View>
        <Text style={styles.carModel}>{item.vehicle_type} Vehicle</Text>
        <Text style={styles.priceText}>${item.price_per_hour}/hour</Text>
        {item.distance && (
          <Text style={styles.distanceText}>
            {item.distance.toFixed(1)} km away
          </Text>
        )}
      </View>
      <View style={[
        styles.availabilityBadge,
        { backgroundColor: item.is_available ? '#E8F5E9' : '#FFEBEE' }
      ]}>
        <Text style={[styles.availabilityText, { 
          color: item.is_available ? '#2E7D32' : '#C62828' 
        }]}>
          {item.is_available ? 'Available' : 'Booked'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search drivers or vehicle types..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'standard', 'premium', 'luxury'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.selectedFilterChip
            ]}
            onPress={() => {
              setSelectedFilter(filter);
              setPage(1);
              fetchDrivers(true);
            }}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.selectedFilterText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color="#D32F2F" />
          <Text style={styles.errorText}>Failed to load drivers</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchDrivers(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A86FF" />
          <Text style={styles.loadingText}>Loading drivers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDrivers}
          renderItem={renderDriverItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3A86FF']}
              tintColor="#3A86FF"
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-sport-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No matching drivers found' : 'No drivers available'}
                </Text>
              </View>
            )
          }
          onEndReached={loadMoreDrivers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#3A86FF" />
                <Text style={styles.footerLoadingText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    height: 30,
  },
  filterContainer: {
    paddingBottom: 10,
  },
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedFilterChip: {
    backgroundColor: '#3A86FF',
    borderColor: '#3A86FF',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  driverCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  driverInitialContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 5,
    marginRight: 10,
    fontWeight: '500',
  },
  ridesText: {
    color: '#666',
    fontSize: 12,
  },
  carModel: {
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontWeight: 'bold',
    color: '#3A86FF',
  },
  distanceText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  availabilityBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16,
  },
  footerLoading: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerLoadingText: {
    marginTop: 5,
    color: '#666',
    fontSize: 12,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 10,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default RentDriverScreen;