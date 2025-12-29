import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {loadEmployeeData} from '../../redux/employeeSlice';
import AttendanceScreen from './AttendanceScreen';
import PayrollScreen from './PayrollScreen';
import LeaveManagementScreen from './LeaveManagementScreen';
import EmployeeTaskScreen from './EmployeeTaskScreen';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

type Tab = 'attendance' | 'payroll' | 'leave' | 'tasks';

const EmployeeManagementScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const {loading} = useSelector((state: RootState) => state.employee);
  const [activeTab, setActiveTab] = useState<Tab>('attendance');

  useEffect(() => {
    if (user?.id) {
      dispatch(loadEmployeeData({employeeId: user.id}) as any);
    }
  }, [dispatch, user?.id]);

  const tabs: {key: Tab; label: string; icon: string}[] = [
    {key: 'attendance', label: 'Attendance', icon: '🕐'},
    {key: 'payroll', label: 'Payroll', icon: '💰'},
    {key: 'leave', label: 'Leave', icon: '📅'},
    {key: 'tasks', label: 'Tasks', icon: '✓'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Employee Management</Text>
          <Text style={styles.subtitle}>
            {user?.name || 'Employee'} • Manage your work
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {activeTab === 'attendance' && <AttendanceScreen />}
        {activeTab === 'payroll' && <PayrollScreen />}
        {activeTab === 'leave' && <LeaveManagementScreen />}
        {activeTab === 'tasks' && <EmployeeTaskScreen />}
      </View>
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
  tabContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textInverse,
  },
  content: {
    flex: 1,
  },
});

export default EmployeeManagementScreen;

