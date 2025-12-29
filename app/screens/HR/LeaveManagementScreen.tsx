import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Calendar} from 'react-native-calendars';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  getLeaveRequests,
  getLeaveBalances,
  createLeaveRequest,
  approveLeaveRequest,
  getLeaveStatistics,
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveRequestStatus,
  getLeaveTypeDisplayName,
  ApprovalLevel,
} from '../../services/leave.service';
import {getHolidays, calculateWorkingDays, Holiday} from '../../services/holiday.service';
import {getEmployees, Employee} from '../../services/employee.service';
import {hasPermission} from '../../config/permissions';
import moment from 'moment';

type TabType = 'balance' | 'apply' | 'history' | 'approvals' | 'holidays';

const LeaveManagementScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<TabType>('balance');
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentYear] = useState(new Date().getFullYear());

  // Apply leave modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>('PL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Calendar state
  const [markedDates, setMarkedDates] = useState<any>({});

  const isHR = user && ['HR_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(user.role);
  const canApprove = user && hasPermission(user.role, 'hr:leave:approve', user.adminRole);

  useEffect(() => {
    loadData();
  }, [activeTab, currentYear]);

  useEffect(() => {
    if (startDate && endDate) {
      calculateDays();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    markCalendarDates();
  }, [holidays, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      let employeeId: string | undefined;

      // Load current employee if not HR
      if (!isHR && user?.id) {
        try {
          const employees = await getEmployees({search: user.email, limit: 1});
          if (employees.employees.length > 0) {
            const emp = employees.employees[0];
            setCurrentEmployee(emp);
            employeeId = emp.id;
          }
        } catch (error) {
          console.error('Error loading employee:', error);
        }
      }

      // Load balances
      if (employeeId) {
        try {
          const balancesData = await getLeaveBalances(employeeId, currentYear);
          setBalances(balancesData);
        } catch (error) {
          console.error('Error loading balances:', error);
        }
      }

      // Load leave requests
      try {
        const requestsData = await getLeaveRequests({
          employeeId: employeeId,
          page: 1,
          limit: 50,
        });
        setLeaveRequests(requestsData.requests);
      } catch (error) {
        console.error('Error loading leave requests:', error);
      }

      // Load holidays for current and next 6 months
      const start = moment().format('YYYY-MM-DD');
      const end = moment().add(6, 'months').format('YYYY-MM-DD');
      const holidaysData = await getHolidays({startDate: start, endDate: end});
      setHolidays(holidaysData);

      // Load statistics if HR
      if (isHR) {
        try {
          const stats = await getLeaveStatistics({year: currentYear});
          setStatistics(stats);
        } catch (error) {
          console.error('Error loading statistics:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = async () => {
    if (!startDate || !endDate) return;
    try {
      const days = await calculateWorkingDays(startDate, endDate);
      setCalculatedDays(days);
    } catch (error) {
      console.error('Error calculating days:', error);
    }
  };

  const markCalendarDates = () => {
    const marked: any = {};

    // Mark holidays
    holidays.forEach(holiday => {
      marked[holiday.date] = {
        marked: true,
        dotColor: '#f59e0b',
        customStyles: {
          container: {
            backgroundColor: '#fef3c7',
          },
        },
      };
    });

    // Mark selected date range
    if (startDate && endDate) {
      const start = moment(startDate);
      const end = moment(endDate);
      let current = start.clone();

      while (current.isSameOrBefore(end)) {
        const dateStr = current.format('YYYY-MM-DD');
        if (!marked[dateStr]) {
          marked[dateStr] = {};
        }
        if (current.isSame(start, 'day')) {
          marked[dateStr].startingDay = true;
          marked[dateStr].color = '#1e3a5f';
        } else if (current.isSame(end, 'day')) {
          marked[dateStr].endingDay = true;
          marked[dateStr].color = '#1e3a5f';
        } else {
          marked[dateStr].color = '#3b82f6';
        }
        marked[dateStr].selected = true;
        current.add(1, 'day');
      }
    } else if (startDate) {
      marked[startDate] = {
        selected: true,
        startingDay: true,
        color: '#1e3a5f',
      };
    }

    setMarkedDates(marked);
  };

  const handleApplyLeave = async () => {
    if (!currentEmployee?.id) {
      Alert.alert('Error', 'Employee information not found');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    if (calculatedDays <= 0) {
      Alert.alert('Error', 'Invalid date range: no working days in selected period');
      return;
    }

    try {
      setSubmitting(true);
      await createLeaveRequest({
        employeeId: currentEmployee.id,
        leaveType: selectedLeaveType,
        startDate,
        endDate,
        reason,
      });
      Alert.alert('Success', 'Leave request submitted successfully');
      setShowApplyModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setCalculatedDays(0);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string, action: 'APPROVE' | 'REJECT', level: ApprovalLevel) => {
    Alert.alert(
      action === 'APPROVE' ? 'Approve Leave' : 'Reject Leave',
      `Are you sure you want to ${action.toLowerCase()} this leave request?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: action === 'APPROVE' ? 'Approve' : 'Reject',
          style: action === 'REJECT' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const rejectionReason = action === 'REJECT' ? 'Rejected by manager/HR' : undefined;
              await approveLeaveRequest(requestId, action, level, rejectionReason);
              Alert.alert('Success', `Leave request ${action.toLowerCase()}d successfully`);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${action.toLowerCase()} leave request`);
            }
          },
        },
      ]
    );
  };

  const onDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate('');
    } else if (startDate && !endDate) {
      if (moment(day.dateString).isBefore(moment(startDate))) {
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const renderBalanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.balanceContainer}>
        {balances.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={64} color="#cbd5e0" />
            <Text style={styles.emptyText}>No leave balances found</Text>
          </View>
        ) : (
          balances.map(balance => (
            <View key={balance.id} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceType}>{getLeaveTypeDisplayName(balance.leaveType)}</Text>
                <Text style={styles.balanceAmount}>{balance.balance.toFixed(1)}</Text>
              </View>
              <View style={styles.balanceDetails}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Total Allocated:</Text>
                  <Text style={styles.balanceValue}>{balance.totalAllocated.toFixed(1)}</Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Used:</Text>
                  <Text style={styles.balanceValue}>{balance.used.toFixed(1)}</Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Pending:</Text>
                  <Text style={styles.balanceValue}>{balance.pending.toFixed(1)}</Text>
                </View>
                {balance.carryForward > 0 && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Carry Forward:</Text>
                    <Text style={styles.balanceValue}>{balance.carryForward.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderApplyTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => setShowApplyModal(true)}
        disabled={!currentEmployee}>
        <Icon name="add-circle" size={24} color="#fff" />
        <Text style={styles.applyButtonText}>Apply for Leave</Text>
      </TouchableOpacity>

      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Icon name="close" size={24} color="#1e3a5f" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Leave Type</Text>
              <View style={styles.leaveTypeContainer}>
                {(['PL', 'SL', 'CL', 'MATERNITY', 'PATERNITY', 'UNPAID'] as LeaveType[]).map(type => {
                  const balance = balances.find(b => b.leaveType === type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.leaveTypeOption,
                        selectedLeaveType === type && styles.leaveTypeOptionActive,
                      ]}
                      onPress={() => setSelectedLeaveType(type)}>
                      <Text
                        style={[
                          styles.leaveTypeText,
                          selectedLeaveType === type && styles.leaveTypeTextActive,
                        ]}>
                        {getLeaveTypeDisplayName(type)}
                      </Text>
                      {balance && (
                        <Text style={styles.leaveTypeBalance}>
                          Balance: {balance.balance.toFixed(1)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Select Dates</Text>
              <Calendar
                markingType="period"
                markedDates={markedDates}
                onDayPress={onDayPress}
                minDate={moment().format('YYYY-MM-DD')}
                style={styles.calendar}
                theme={{
                  selectedDayBackgroundColor: '#1e3a5f',
                  selectedDayTextColor: '#fff',
                  todayTextColor: '#1e3a5f',
                  arrowColor: '#1e3a5f',
                }}
              />

              {startDate && endDate && (
                <View style={styles.dateInfo}>
                  <Text style={styles.dateInfoText}>
                    Start: {moment(startDate).format('DD MMM YYYY')}
                  </Text>
                  <Text style={styles.dateInfoText}>
                    End: {moment(endDate).format('DD MMM YYYY')}
                  </Text>
                  <Text style={styles.dateInfoText}>Working Days: {calculatedDays}</Text>
                </View>
              )}

              <Text style={styles.label}>Reason (Optional)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Enter reason for leave..."
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleApplyLeave}
                disabled={submitting || !startDate || !endDate || calculatedDays <= 0}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Leave Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderHistoryTab = () => {
    const filteredRequests = leaveRequests.filter(req => req.status !== 'PENDING');

    return (
      <FlatList
        data={filteredRequests}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tabContent}
        renderItem={({item}) => (
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View>
                <Text style={styles.requestType}>{getLeaveTypeDisplayName(item.leaveType)}</Text>
                <Text style={styles.requestDates}>
                  {moment(item.startDate).format('DD MMM')} - {moment(item.endDate).format('DD MMM YYYY')}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'APPROVED' && styles.statusBadgeApproved,
                  item.status === 'REJECTED' && styles.statusBadgeRejected,
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'APPROVED' && styles.statusTextApproved,
                    item.status === 'REJECTED' && styles.statusTextRejected,
                  ]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.requestDays}>{item.daysCount} days</Text>
            {item.reason && <Text style={styles.requestReason}>{item.reason}</Text>}
            {item.rejectionReason && (
              <Text style={styles.rejectionReason}>Rejection: {item.rejectionReason}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="history" size={64} color="#cbd5e0" />
            <Text style={styles.emptyText}>No leave history</Text>
          </View>
        }
      />
    );
  };

  const renderApprovalsTab = () => {
    if (!canApprove) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="lock" size={64} color="#cbd5e0" />
          <Text style={styles.emptyText}>You don't have permission to approve leaves</Text>
        </View>
      );
    }

    const pendingRequests = leaveRequests.filter(
      req => req.status === 'PENDING' && (req.managerApprovalStatus === 'PENDING' || req.hrApprovalStatus === 'PENDING')
    );

    return (
      <FlatList
        data={pendingRequests}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tabContent}
        renderItem={({item}) => {
          const needsManagerApproval = item.managerApprovalStatus === 'PENDING';
          const needsHRApproval = item.requiresHrApproval && item.hrApprovalStatus === 'PENDING' && item.managerApprovalStatus === 'APPROVED';

          return (
            <View style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.requestEmployee}>{item.employeeName}</Text>
                  <Text style={styles.requestType}>{getLeaveTypeDisplayName(item.leaveType)}</Text>
                  <Text style={styles.requestDates}>
                    {moment(item.startDate).format('DD MMM')} - {moment(item.endDate).format('DD MMM YYYY')}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>
              <Text style={styles.requestDays}>{item.daysCount} days</Text>
              {item.reason && <Text style={styles.requestReason}>{item.reason}</Text>}

              <View style={styles.approvalActions}>
                {needsManagerApproval && (
                  <>
                    <TouchableOpacity
                      style={[styles.approveButton, styles.rejectButton]}
                      onPress={() => handleApprove(item.id, 'REJECT', 'MANAGER')}>
                      <Text style={styles.approveButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(item.id, 'APPROVE', 'MANAGER')}>
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </>
                )}
                {needsHRApproval && isHR && (
                  <>
                    <TouchableOpacity
                      style={[styles.approveButton, styles.rejectButton]}
                      onPress={() => handleApprove(item.id, 'REJECT', 'HR')}>
                      <Text style={styles.approveButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(item.id, 'APPROVE', 'HR')}>
                      <Text style={styles.approveButtonText}>Approve (HR)</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={64} color="#cbd5e0" />
            <Text style={styles.emptyText}>No pending approvals</Text>
          </View>
        }
      />
    );
  };

  const renderHolidaysTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.holidayList}>
        {holidays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="event" size={64} color="#cbd5e0" />
            <Text style={styles.emptyText}>No holidays found</Text>
          </View>
        ) : (
          holidays.map(holiday => (
            <View key={holiday.id} style={styles.holidayCard}>
              <View style={styles.holidayDateContainer}>
                <Text style={styles.holidayDate}>{moment(holiday.date).format('DD')}</Text>
                <Text style={styles.holidayMonth}>{moment(holiday.date).format('MMM')}</Text>
              </View>
              <View style={styles.holidayInfo}>
                <Text style={styles.holidayName}>{holiday.name}</Text>
                <Text style={styles.holidayType}>{holiday.type}</Text>
                {holiday.description && <Text style={styles.holidayDescription}>{holiday.description}</Text>}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave Management</Text>
        {isHR && statistics && (
          <View style={styles.statisticsBadge}>
            <Text style={styles.statisticsText}>
              {statistics.pendingApprovals} Pending
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balance' && styles.tabActive]}
          onPress={() => setActiveTab('balance')}>
          <Icon
            name="account-balance-wallet"
            size={20}
            color={activeTab === 'balance' ? '#1e3a5f' : '#7a8a9a'}
          />
          <Text style={[styles.tabText, activeTab === 'balance' && styles.tabTextActive]}>
            Balance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'apply' && styles.tabActive]}
          onPress={() => setActiveTab('apply')}>
          <Icon name="add-circle" size={20} color={activeTab === 'apply' ? '#1e3a5f' : '#7a8a9a'} />
          <Text style={[styles.tabText, activeTab === 'apply' && styles.tabTextActive]}>Apply</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}>
          <Icon name="history" size={20} color={activeTab === 'history' ? '#1e3a5f' : '#7a8a9a'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>

        {canApprove && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'approvals' && styles.tabActive]}
            onPress={() => setActiveTab('approvals')}>
            <Icon
              name="approval"
              size={20}
              color={activeTab === 'approvals' ? '#1e3a5f' : '#7a8a9a'}
            />
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.tabTextActive]}>
              Approvals
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.tab, activeTab === 'holidays' && styles.tabActive]}
          onPress={() => setActiveTab('holidays')}>
          <Icon name="event" size={20} color={activeTab === 'holidays' ? '#1e3a5f' : '#7a8a9a'} />
          <Text style={[styles.tabText, activeTab === 'holidays' && styles.tabTextActive]}>
            Holidays
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'balance' && renderBalanceTab()}
      {activeTab === 'apply' && renderApplyTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'approvals' && renderApprovalsTab()}
      {activeTab === 'holidays' && renderHolidaysTab()}
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
  statisticsBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statisticsText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1e3a5f',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#7a8a9a',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#1e3a5f',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  balanceContainer: {
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  balanceDetails: {
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#7a8a9a',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 8,
    marginTop: 12,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  leaveTypeOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    minWidth: '30%',
  },
  leaveTypeOptionActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  leaveTypeText: {
    fontSize: 12,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  leaveTypeTextActive: {
    color: '#fff',
  },
  leaveTypeBalance: {
    fontSize: 10,
    color: '#7a8a9a',
    marginTop: 4,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 16,
  },
  dateInfo: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateInfoText: {
    fontSize: 14,
    color: '#1e3a5f',
    marginBottom: 4,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e4e8ec',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestEmployee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  requestType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  requestDates: {
    fontSize: 12,
    color: '#7a8a9a',
    marginTop: 4,
  },
  requestDays: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  requestReason: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  statusBadgeApproved: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeRejected: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  statusTextApproved: {
    color: '#10b981',
  },
  statusTextRejected: {
    color: '#dc2626',
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  approveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  holidayList: {
    gap: 12,
  },
  holidayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  holidayDateContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  holidayDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  holidayMonth: {
    fontSize: 12,
    color: '#7a8a9a',
    textTransform: 'uppercase',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  holidayType: {
    fontSize: 12,
    color: '#7a8a9a',
    marginBottom: 4,
  },
  holidayDescription: {
    fontSize: 14,
    color: '#4b5563',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#7a8a9a',
    marginTop: 16,
  },
});

export default LeaveManagementScreen;
