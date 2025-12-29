import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const RecruitmentScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recruitment</Text>
      <Text style={styles.subtitle}>Recruitment management coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7a8a9a',
  },
});

export default RecruitmentScreen;

