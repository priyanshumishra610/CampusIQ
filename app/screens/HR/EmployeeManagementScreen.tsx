import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {getEmployees, Employee, EmployeeFilters} from '../../services/employee.service';
import {hasPermission} from '../../config/permissions';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';

const EmployeeManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    loadEmployees();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees({...filters, search: searchText || undefined});
      setEmployees(data.employees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user && hasPermission(user.role, 'hr:employee:create', user.adminRole);

  if (loading && employees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        {canCreate && (
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#7a8a9a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={loadEmployees}
        />
      </View>

      <FlatList
        data={employees}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.employeeCard}
            onPress={() => navigation.navigate('EmployeeDetail' as never, {employeeId: item.id} as never)}>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.employeeId}>{item.employeeId}</Text>
              <Text style={styles.employeeDept}>{item.department || 'No Department'}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#7a8a9a" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#cbd5e0" />
            <Text style={styles.emptyText}>No employees found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  addButton: {
    backgroundColor: '#1e3a5f',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1e3a5f',
  },
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#7a8a9a',
    marginBottom: 2,
  },
  employeeDept: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
});

export default EmployeeManagementScreen;

