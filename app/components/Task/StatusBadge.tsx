import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TaskPriority, TaskStatus} from '../../redux/slices/taskSlice';

const statusConfig: Record<TaskStatus, {color: string; label: string; shortLabel?: string}> = {
  NEW: {color: '#3498db', label: 'NEW', shortLabel: 'NEW'},
  IN_PROGRESS: {color: '#f39c12', label: 'IN PROGRESS', shortLabel: 'IN PROGRESS'},
  RESOLVED: {color: '#27ae60', label: 'COMPLETED', shortLabel: 'DONE'},
  ESCALATED: {color: '#c0392b', label: 'ESCALATED', shortLabel: 'ESCALATED'},
};

const priorityConfig: Record<TaskPriority, {color: string; label: string}> = {
  LOW: {color: '#27ae60', label: 'LOW'},
  MEDIUM: {color: '#e67e22', label: 'MED'},
  HIGH: {color: '#c0392b', label: 'HIGH'},
};

type Props = {
  status: TaskStatus;
  priority?: TaskPriority;
  compact?: boolean; // Use shorter labels for compact spaces
};

const StatusBadge = ({status, priority, compact = false}: Props) => {
  const statusInfo = statusConfig[status];
  const priorityInfo = priority ? priorityConfig[priority] : null;
  const displayLabel = compact && statusInfo.shortLabel ? statusInfo.shortLabel : statusInfo.label;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, {backgroundColor: statusInfo.color}]}>
        <Text 
          style={styles.text} 
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {displayLabel}
        </Text>
      </View>
      {priorityInfo && (
        <View style={[styles.priorityBadge, {backgroundColor: priorityInfo.color}]}>
          <Text 
            style={styles.priorityText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {priorityInfo.label}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default StatusBadge;
