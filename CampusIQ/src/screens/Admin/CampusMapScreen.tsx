import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {TaskPriority} from '../../redux/taskSlice';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

const priorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'HIGH':
      return colors.priority.high;
    case 'MEDIUM':
      return colors.priority.medium;
    default:
      return colors.priority.low;
  }
};

const CampusMapScreen = () => {
  const tasks = useSelector((state: RootState) => state.tasks.items);
  const initial = tasks.find(task => task.location)?.location || {
    lat: 37.78825,
    lng: -122.4324,
  };

  const activeTasks = tasks.filter(t => t.status !== 'RESOLVED');
  const tasksWithLocation = activeTasks.filter(t => t.location);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Operations Map</Text>
        <Text style={styles.subtitle}>
          {tasksWithLocation.length} active locations
        </Text>
      </View>
      
      {tasksWithLocation.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState 
            variant="campus-stable"
            customMessage="No tasks with location data. Operations are proceeding normally."
          />
        </View>
      ) : (
        <>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#c0392b'}]} />
              <Text style={styles.legendText}>High Priority</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#e67e22'}]} />
              <Text style={styles.legendText}>Medium</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#27ae60'}]} />
              <Text style={styles.legendText}>Low</Text>
            </View>
          </View>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: initial.lat,
              longitude: initial.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}>
            {tasks
              .filter(task => task.location)
              .map(task => (
                <Marker
                  key={task.id}
                  coordinate={{
                    latitude: task.location!.lat,
                    longitude: task.location!.lng,
                  }}
                  pinColor={priorityColor(task.priority)}
                  title={task.title}
                  description={`${task.category} • ${task.status}`}
                />
              ))}
          </MapView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * 1.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  legendText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 180,
  },
});

export default CampusMapScreen;

