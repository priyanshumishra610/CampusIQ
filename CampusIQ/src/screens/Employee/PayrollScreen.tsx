import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

const PayrollScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {attendance} = useSelector((state: RootState) => state.employee);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthAttendance = useMemo(() => {
    return attendance.filter(a => a.date.startsWith(currentMonth) && a.totalHours);
  }, [attendance, currentMonth]);

  const totalDays = currentMonthAttendance.length;
  const totalHours = useMemo(() => {
    return currentMonthAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
  }, [currentMonthAttendance]);

  // Mock salary calculation (placeholder)
  const baseSalary = 50000; // Placeholder
  const hourlyRate = baseSalary / 160; // Assuming 160 hours/month
  const calculatedSalary = totalHours * hourlyRate;
  const deductions = calculatedSalary * 0.1; // 10% placeholder
  const bonuses = 0; // Placeholder
  const netSalary = calculatedSalary - deductions + bonuses;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Monthly Payroll Summary</Text>
        <Text style={styles.summaryMonth}>{new Date().toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Employee</Text>
            <Text style={styles.summaryValue}>{user?.name || 'Employee'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Working Days</Text>
            <Text style={styles.summaryValue}>{totalDays}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Hours</Text>
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
          </View>
        </View>
      </View>

      {/* Salary Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Salary</Text>
            <Text style={styles.breakdownValue}>${baseSalary.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Calculated (Hours × Rate)</Text>
            <Text style={styles.breakdownValue}>${calculatedSalary.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Deductions</Text>
            <Text style={[styles.breakdownValue, styles.breakdownNegative]}>-${deductions.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Bonuses</Text>
            <Text style={[styles.breakdownValue, styles.breakdownPositive]}>+${bonuses.toFixed(2)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
            <Text style={styles.breakdownLabelTotal}>Net Salary</Text>
            <Text style={styles.breakdownValueTotal}>${netSalary.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Attendance Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Details</Text>
        {currentMonthAttendance.length === 0 ? (
          <EmptyState variant="no-results" customMessage="No attendance records for this month" />
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Date</Text>
              <Text style={styles.tableHeaderText}>Hours</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
            </View>
            {currentMonthAttendance.map(item => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{new Date(item.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
                <Text style={styles.tableCell}>{item.totalHours?.toFixed(1)}h</Text>
                <Text style={[styles.tableCell, styles.statusBadge, item.status === 'CHECKED_OUT' && styles.statusCompleted]}>
                  {item.status === 'CHECKED_OUT' ? 'Complete' : 'Incomplete'}
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
  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.1,
  },
  summaryMonth: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: fontWeight.normal,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: 120,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs / 2,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
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
  breakdownCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownRowTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderBottomWidth: 0,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  breakdownLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
  },
  breakdownValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  breakdownNegative: {
    color: colors.error,
  },
  breakdownPositive: {
    color: colors.success,
  },
  breakdownLabelTotal: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  breakdownValueTotal: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.bold,
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
  statusBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
  },
  statusCompleted: {
    color: colors.success,
  },
});

export default PayrollScreen;

