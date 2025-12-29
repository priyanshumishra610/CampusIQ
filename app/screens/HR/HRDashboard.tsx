import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {hasPermission} from '../../config/permissions';
import {getEmployees} from '../../services/employee.service';
import {getLeaveRequests} from '../../services/leave.service';
import {getExpenseClaims} from '../../services/expenses.service';

const {width} = Dimensions.get('window');

const HRDashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaveRequests: 0,
    pendingExpenseClaims: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const employeesData = await getEmployees({limit: 1});
      const activeEmployeesData = await getEmployees({status: 'ACTIVE', limit: 1});
      
      // Load pending leave requests
      const leaveData = await getLeaveRequests({status: 'PENDING', limit: 1});
      
      // Load pending expense claims
      const expenseData = await getExpenseClaims({status: 'PENDING', limit: 1});

      setStats({
        totalEmployees: employeesData.pagination.total,
        activeEmployees: activeEmployeesData.pagination.total,
        pendingLeaveRequests: leaveData.pagination.total,
        pendingExpenseClaims: expenseData.pagination.total,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>Loading HR Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>HR Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          label="Total Employees"
          value={stats.totalEmployees}
          color="#1e3a5f"
        />
        <StatCard
          icon="check-circle"
          label="Active Employees"
          value={stats.activeEmployees}
          color="#4caf50"
        />
        <StatCard
          icon="event-available"
          label="Pending Leaves"
          value={stats.pendingLeaveRequests}
          color="#ff9800"
        />
        <StatCard
          icon="receipt"
          label="Pending Expenses"
          value={stats.pendingExpenseClaims}
          color="#f44336"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="person-add"
            label="Add Employee"
            route="EmployeeDetail"
            permission="hr:employee:create"
          />
          <ActionButton
            icon="work"
            label="New Job Posting"
            route="Recruitment"
            permission="hr:recruitment:create"
          />
          <ActionButton
            icon="account-balance-wallet"
            label="Generate Payroll"
            route="Payroll"
            permission="hr:payroll:generate"
          />
          <ActionButton
            icon="assessment"
            label="Performance Review"
            route="Performance"
            permission="hr:performance:create"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  color: string;
}> = ({icon, label, value, color}) => (
  <View style={[styles.statCard, {borderLeftColor: color}]}>
    <Icon name={icon} size={32} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton: React.FC<{
  icon: string;
  label: string;
  route: string;
  permission: string;
}> = ({icon, label, route, permission}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const hasAccess = user && hasPermission(user.role, permission as any, user.adminRole);

  if (!hasAccess) return null;

  return (
    <TouchableOpacity style={styles.actionButton}>
      <Icon name={icon} size={24} color="#1e3a5f" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f9',
  },
  loadingText: {
    marginTop: 12,
    color: '#5a6a7a',
    fontSize: 14,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7a8a9a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e3a5f',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7a8a9a',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 14,
    color: '#1e3a5f',
    marginTop: 8,
    fontWeight: '600',
  },
});

export default HRDashboard;

