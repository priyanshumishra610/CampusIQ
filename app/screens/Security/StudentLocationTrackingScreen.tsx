import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {Colors, Typography, Spacing, BorderRadius} from '../../theme/designTokens';
import {CAMPUS_COORDINATES} from '../../config/maps.config';

interface StudentLocation {
  studentId: string;
  studentName: string;
  location: {latitude: number; longitude: number};
  timestamp: number;
  status: 'SAFE' | 'AT_RISK' | 'EMERGENCY';
}

const StudentLocationTrackingScreen = ({route, navigation}: any) => {
  const {studentId, emergencyMode = false} = route.params || {};
  const {user} = useSelector((state: RootState) => state.auth);
  const [studentLocation, setStudentLocation] = useState<StudentLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(emergencyMode);

  useEffect(() => {
    if (trackingEnabled) {
      loadStudentLocation();
      const interval = setInterval(loadStudentLocation, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [trackingEnabled, studentId]);

  const loadStudentLocation = async () => {
    try {
      // Mock data - replace with actual Firestore query
      const mockLocation: StudentLocation = {
        studentId: studentId || 'student-1',
        studentName: 'John Doe',
        location: {
          latitude: CAMPUS_COORDINATES.latitude + (Math.random() - 0.5) * 0.01,
          longitude: CAMPUS_COORDINATES.longitude + (Math.random() - 0.5) * 0.01,
        },
        timestamp: Date.now(),
        status: emergencyMode ? 'EMERGENCY' : 'SAFE',
      };

      setStudentLocation(mockLocation);
    } catch (error) {
      console.error('Error loading student location:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EMERGENCY':
        return Colors.error;
      case 'AT_RISK':
        return Colors.warning;
      default:
        return Colors.success;
    }
  };

  if (loading && !studentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Location</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      </View>
    );
  }

  if (!studentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Location</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No location data available</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(studentLocation.status);

  return (
    <View style={styles.container}>
      <View style={[styles.header, {backgroundColor: emergencyMode ? Colors.error : Colors.primary}]}>
        <Text style={styles.headerTitle}>
          {emergencyMode ? '🚨 Emergency Tracking' : 'Student Location'}
        </Text>
        <Text style={styles.headerSubtitle}>{studentLocation.studentName}</Text>
        <View style={[styles.statusBadge, {backgroundColor: `${statusColor}15`}]}>
          <Text style={[styles.statusText, {color: statusColor}]}>
            {studentLocation.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...studentLocation.location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          ...studentLocation.location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        <Marker
          coordinate={studentLocation.location}
          title={studentLocation.studentName}
          description={`Last updated: ${new Date(studentLocation.timestamp).toLocaleTimeString()}`}
          pinColor={statusColor}
        />
      </MapView>

      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student:</Text>
          <Text style={styles.infoValue}>{studentLocation.studentName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, {color: statusColor}]}>
            {studentLocation.status.replace('_', ' ')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated:</Text>
          <Text style={styles.infoValue}>
            {new Date(studentLocation.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Coordinates:</Text>
          <Text style={styles.infoValue}>
            {studentLocation.location.latitude.toFixed(6)},{' '}
            {studentLocation.location.longitude.toFixed(6)}
          </Text>
        </View>
      </View>

      {emergencyMode && (
        <View style={styles.emergencyActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonEmergency]}
            onPress={() => {
              // Trigger emergency response
              navigation.navigate('EmergencyResponse', {studentId: studentLocation.studentId});
            }}>
            <Text style={styles.actionButtonText}>🚨 Emergency Response</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textInverse,
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  infoPanel: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  emergencyActions: {
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  actionButtonEmergency: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default StudentLocationTrackingScreen;

