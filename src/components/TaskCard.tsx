import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import StatusBadge from './StatusBadge';
import {Task} from '../redux/taskSlice';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';
import {shadows} from '../theme/shadows';

type Props = {
  task: Task;
  onPress?: () => void;
};

const TaskCard = ({task, onPress}: Props) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        </View>
        <StatusBadge status={task.status} priority={task.priority} />
      </View>
      
      <View style={styles.metaContainer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{task.category}</Text>
        </View>
        <Text style={styles.metaSeparator}>•</Text>
        <Text style={styles.metaText}>{task.priority} Priority</Text>
      </View>
      
      <Text style={styles.summary} numberOfLines={2}>
        {task.aiSummary || task.description}
      </Text>
      
      {task.location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}
          </Text>
        </View>
      )}
      
      {task.imageBase64 && (
        <Image
          source={{uri: `data:image/jpeg;base64,${task.imageBase64}`}}
          style={styles.image}
        />
      )}
      
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(task.createdByName || 'A')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.footerText}>
            {task.createdByName || 'Administrator'}
          </Text>
        </View>
        <Text style={styles.footerDate}>
          {task.createdAt instanceof Date
            ? task.createdAt.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
            : new Date(task.createdAt?.toDate?.() ?? Date.now()).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.5,
    letterSpacing: -0.1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  metaSeparator: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  summary: {
    marginBottom: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    fontWeight: fontWeight.normal,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
  },
  locationIcon: {
    fontSize: fontSize.md,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: 'monospace',
  },
  image: {
    width: '100%',
    height: 180,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  footerText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  footerDate: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

export default TaskCard;

