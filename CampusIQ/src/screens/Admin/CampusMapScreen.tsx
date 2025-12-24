import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {TaskPriority} from '../../redux/taskSlice';
import EmptyState from '../../components/EmptyState';

const priorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'HIGH':
      return '#c0392b';
    case 'MEDIUM':
      return '#e67e22';
    default:
      return '#27ae60';
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
    backgroundColor: '#f4f6f9',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#5a6a7a',
    fontWeight: '500',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 180,
  },
});

export default CampusMapScreen;

