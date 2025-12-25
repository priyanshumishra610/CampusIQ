import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {checkIn, checkOut, startLunch, endLunch} from '../../redux/employeeSlice';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

const AttendanceScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const {attendance, checkingIn, checkingOut, error} = useSelector((state: RootState) => state.employee);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = useMemo(() => {
    return attendance.find(a => a.date === today);
  }, [attendance, today]);

  const handleCheckIn = () => {
    if (!user) return;
    dispatch(checkIn({employeeId: user.id, employeeName: user.name || 'Employee'}) as any).then((result: any) => {
      if (result.error) {
        Alert.alert('Error', result.payload || 'Failed to check in');
      }
    });
  };

  const handleCheckOut = () => {
    if (!user) return;
    dispatch(checkOut({employeeId: user.id}) as any).then((result: any) => {
      if (result.error) {
        Alert.alert('Error', result.payload || 'Failed to check out');
      }
    });
  };

  const handleStartLunch = () => {
    if (!user) return;
    dispatch(startLunch({employeeId: user.id}) as any).then((result: any) => {
      if (result.error) {
        Alert.alert('Error', result.payload || 'Failed to start lunch');
      }
    });
  };

  const handleEndLunch = () => {
    if (!user) return;
    dispatch(endLunch({employeeId: user.id}) as any).then((result: any) => {
      if (result.error) {
        Alert.alert('Error', result.payload || 'Failed to end lunch');
      }
    });
  };

  const recentAttendance = attendance.slice(0, 10);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Current Day Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Today's Status</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Date</Text>
            <Text style={styles.statusValue}>{new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}</Text>
          </View>
          {todayAttendance?.loginTime && (
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Login Time</Text>
              <Text style={styles.statusValue}>{todayAttendance.loginTime}</Text>
            </View>
          )}
          {todayAttendance?.logoutTime && (
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Logout Time</Text>
              <Text style={styles.statusValue}>{todayAttendance.logoutTime}</Text>
            </View>
          )}
          {todayAttendance?.totalHours !== undefined && (
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Total Hours</Text>
              <Text style={styles.statusValue}>{todayAttendance.totalHours.toFixed(2)}h</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!todayAttendance?.loginTime ? (
            <Button
              title="Check In"
              onPress={handleCheckIn}
              variant="primary"
              size="lg"
              loading={checkingIn}
              style={styles.actionButton}
            />
          ) : !todayAttendance.logoutTime ? (
            <>
              {todayAttendance.status === 'ON_LUNCH' ? (
                <Button
                  title="End Lunch"
                  onPress={handleEndLunch}
                  variant="secondary"
                  size="md"
                  style={styles.actionButton}
                />
              ) : (
                <>
                  <Button
                    title="Start Lunch"
                    onPress={handleStartLunch}
                    variant="secondary"
                    size="md"
                    style={styles.actionButton}
                  />
                  <View style={styles.buttonSpacer} />
                  <Button
                    title="Check Out"
                    onPress={handleCheckOut}
                    variant="primary"
                    size="lg"
                    loading={checkingOut}
                    style={styles.actionButton}
                  />
                </>
              )}
            </>
          ) : (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed for today</Text>
            </View>
          )}
        </View>
      </View>

      {/* Attendance History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance History</Text>
        {recentAttendance.length === 0 ? (
          <EmptyState variant="no-results" customMessage="No attendance records found" />
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Date</Text>
              <Text style={styles.tableHeaderText}>Login</Text>
              <Text style={styles.tableHeaderText}>Logout</Text>
              <Text style={styles.tableHeaderText}>Hours</Text>
            </View>
            {recentAttendance.map(item => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{new Date(item.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
                <Text style={styles.tableCell}>{item.loginTime || '-'}</Text>
                <Text style={styles.tableCell}>{item.logoutTime || '-'}</Text>
                <Text style={styles.tableCell}>{item.totalHours ? `${item.totalHours.toFixed(1)}h` : '-'}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  statusCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusItem: {
    flex: 1,
    minWidth: 120,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs / 2,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  buttonSpacer: {
    width: spacing.sm,
  },
  completedBadge: {
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.success + '40',
    alignItems: 'center',
  },
  completedText: {
    color: colors.success,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  table: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundTertiary,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.normal,
  },
});

export default AttendanceScreen;

