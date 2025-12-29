import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import StatusBadge from './StatusBadge';
import {Task} from '../../redux/slices/taskSlice';

type Props = {
  task: Task;
  onPress?: () => void;
};

const TaskCard = ({task, onPress}: Props) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        <StatusBadge status={task.status} priority={task.priority} />
      </View>
      <Text style={styles.meta}>
        {task.category} • {task.priority} Priority
      </Text>
      <Text style={styles.summary} numberOfLines={2}>
        {task.aiSummary || task.description}
      </Text>
      {task.location && (
        <Text style={styles.location}>
          {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}
        </Text>
      )}
      {task.imageBase64 && (
        <Image
          source={{uri: `data:image/jpeg;base64,${task.imageBase64}`}}
          style={styles.image}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {task.createdByName || 'Administrator'}
        </Text>
        <Text style={styles.footerDate}>
          {task.createdAt instanceof Date
            ? task.createdAt.toDateString()
            : new Date(task.createdAt?.toDate?.() ?? Date.now()).toDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    color: '#0c1222',
    lineHeight: 22,
  },
  meta: {
    marginTop: 8,
    color: '#5a6a7a',
    fontSize: 12,
    fontWeight: '500',
  },
  summary: {
    marginTop: 8,
    color: '#2a3a4a',
    fontSize: 14,
    lineHeight: 20,
  },
  location: {
    marginTop: 8,
    color: '#5a6a7a',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 140,
    marginTop: 12,
    borderRadius: 8,
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: '#7a8a9a',
    fontSize: 12,
    fontWeight: '500',
  },
  footerDate: {
    color: '#9aaaba',
    fontSize: 11,
  },
});

export default TaskCard;

