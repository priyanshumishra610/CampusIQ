import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {applyLeave, LeaveType} from '../../redux/employeeSlice';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

const LeaveManagementScreen = () => {
  const dispatch = useDispatch();
  const {leaves, applyingLeave} = useSelector((state: RootState) => state.employee);
  const user = useSelector((state: RootState) => state.auth.user);

  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const leaveTypes: {value: LeaveType; label: string}[] = [
    {value: 'CASUAL', label: 'Casual'},
    {value: 'SICK', label: 'Sick'},
    {value: 'PAID', label: 'Paid'},
  ];

  const handleApplyLeave = () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) return;

    dispatch(
      applyLeave({
        employeeId: user.id,
        employeeName: user.name || 'Employee',
        leaveType,
        startDate,
        endDate,
        reason,
      }) as any,
    ).then((result: any) => {
      if (!result.error) {
        Alert.alert('Success', 'Leave application submitted successfully');
        setShowForm(false);
        setStartDate('');
        setEndDate('');
        setReason('');
      } else {
        Alert.alert('Error', result.payload || 'Failed to apply for leave');
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return colors.success;
      case 'REJECTED':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Apply Leave Button */}
      {!showForm && (
        <View style={styles.actionSection}>
          <Button
            title="Apply for Leave"
            onPress={() => setShowForm(true)}
            variant="primary"
            size="lg"
            style={styles.applyButton}
          />
        </View>
      )}

      {/* Leave Application Form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Leave Application</Text>

          <Text style={styles.label}>Leave Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
            {leaveTypes.map(type => (
              <Button
                key={type.value}
                title={type.label}
                onPress={() => setLeaveType(type.value)}
                variant={leaveType === type.value ? 'primary' : 'secondary'}
                size="sm"
                style={styles.typeButton}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>Start Date * (YYYY-MM-DD)</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2024-12-15"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <Text style={styles.label}>End Date * (YYYY-MM-DD)</Text>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2024-12-20"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <Text style={styles.label}>Reason *</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason for leave..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
          />

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowForm(false);
                setStartDate('');
                setEndDate('');
                setReason('');
              }}
              variant="secondary"
              size="md"
              style={styles.formButton}
            />
            <Button
              title="Submit"
              onPress={handleApplyLeave}
              variant="primary"
              size="md"
              loading={applyingLeave}
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      {/* Leave History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leave History</Text>
        {leaves.length === 0 ? (
          <EmptyState variant="no-results" customMessage="No leave applications found" />
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Type</Text>
              <Text style={styles.tableHeaderText}>Start</Text>
              <Text style={styles.tableHeaderText}>End</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
            </View>
            {leaves.map(leave => (
              <View key={leave.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{leave.leaveType}</Text>
                <Text style={styles.tableCell}>{new Date(leave.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
                <Text style={styles.tableCell}>{new Date(leave.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
                <Text style={[styles.tableCell, {color: getStatusColor(leave.status)}]}>
                  {leave.status}
                </Text>
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
  actionSection: {
    marginBottom: spacing.lg,
  },
  applyButton: {
    width: '100%',
  },
  formCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  formTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  typeRow: {
    marginVertical: spacing.sm,
  },
  typeButton: {
    marginRight: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    minHeight: 40,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  formButton: {
    flex: 1,
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

export default LeaveManagementScreen;

