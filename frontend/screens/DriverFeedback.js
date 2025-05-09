import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const DriverFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        // Fetch feedbacks from the backend
        const response = await axios.get('http://192.168.29.202:3000/getFeedback');
        setFeedbacks(response.data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      {feedbacks.length > 0 ? (
        <FlatList
          data={feedbacks}
          renderItem={({ item }) => (
            <View style={styles.feedbackItem}>
              <Text style={styles.feedbackText}>{item.feedback}</Text>
              <Text style={styles.dateText}>Submitted on: {new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <Text>No feedbacks available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  feedbackItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
  },
  feedbackText: {
    fontSize: 16,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#777',
  },
});

export default DriverFeedback;
