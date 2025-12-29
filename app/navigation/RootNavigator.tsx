import React, {useEffect} from 'react';
import {ActivityIndicator, View, Text, TouchableOpacity, Dimensions} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sidebar from '../components/Common/Sidebar';
import SidebarLayout from '../components/Common/SidebarLayout';
import {log} from '../utils/debugLogger';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ExecutiveDashboard from '../screens/Admin/ExecutiveDashboard';
import CampusMapScreen from '../screens/Admin/CampusMapScreen';
import CrowdHeatmapScreen from '../screens/Admin/CrowdHeatmapScreen';
import TaskDetailScreen from '../screens/Admin/TaskDetailScreen';
import CreateTaskScreen from '../screens/Admin/CreateTaskScreen';
import ExamDashboard from '../screens/Admin/ExamDashboard';
import ExamCalendarScreen from '../screens/Admin/ExamCalendarScreen';
import ExamDetailScreen from '../screens/Admin/ExamDetailScreen';
import CreateExamScreen from '../screens/Admin/CreateExamScreen';
import StudentDashboard from '../screens/Student/StudentDashboard';
import TimetableScreen from '../screens/Student/TimetableScreen';
import AssignmentsListScreen from '../screens/Student/AssignmentsListScreen';
import AssignmentDetailScreen from '../screens/Student/AssignmentDetailScreen';
import AttendanceOverviewScreen from '../screens/Student/AttendanceOverviewScreen';
import AnnouncementsScreen from '../screens/Student/AnnouncementsScreen';
import ExamsScreen from '../screens/Student/ExamsScreen';
import PerformanceDashboardScreen from '../screens/Student/PerformanceDashboardScreen';
import ExamsTimelineScreen from '../screens/Student/ExamsTimelineScreen';
import NotificationCenterScreen from '../screens/Student/NotificationCenterScreen';
import FacultyDashboard from '../screens/Faculty/FacultyDashboard';
import AttendanceManagementScreen from '../screens/Faculty/AttendanceManagementScreen';
import AssignmentsManagementScreen from '../screens/Faculty/AssignmentsManagementScreen';
import ClassIntelligenceScreen from '../screens/Faculty/ClassIntelligenceScreen';
import CreateAssignmentScreen from '../screens/Faculty/CreateAssignmentScreen';
import SubmissionGradingScreen from '../screens/Faculty/SubmissionGradingScreen';
import StudentPerformanceInsightsScreen from '../screens/Faculty/StudentPerformanceInsightsScreen';
import AnnouncementBroadcastScreen from '../screens/Faculty/AnnouncementBroadcastScreen';
import SupportDashboard from '../screens/Support/SupportDashboard';
import TicketDetailScreen from '../screens/Support/TicketDetailScreen';
import SecurityDashboard from '../screens/Security/SecurityDashboard';
import SOSAlertsDashboard from '../screens/Security/SOSAlertsDashboard';
import GeofenceMonitorScreen from '../screens/Security/GeofenceMonitorScreen';
import StudentLocationTrackingScreen from '../screens/Security/StudentLocationTrackingScreen';
import HRDashboard from '../screens/HR/HRDashboard';
import EmployeeManagementScreen from '../screens/HR/EmployeeManagementScreen';
import EmployeeDetailScreen from '../screens/HR/EmployeeDetailScreen';
import RecruitmentScreen from '../screens/HR/RecruitmentScreen';
import LeaveManagementScreen from '../screens/HR/LeaveManagementScreen';
import PayrollScreen from '../screens/HR/PayrollScreen';
import PerformanceScreen from '../screens/HR/PerformanceScreen';
import ExpensesScreen from '../screens/HR/ExpensesScreen';
import ComplianceScreen from '../screens/HR/ComplianceScreen';
import {RootState} from '../redux/store';
import {startTasksForRole, stopTaskListener} from '../redux/slices/taskSlice';
import {startExamsForRole, stopExamListener} from '../redux/slices/examSlice';
import {signOut} from '../redux/slices/authSlice';
import {hasPermission, getRoleDisplayName} from '../config/permissions';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

const AuthStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const StudentStack = createNativeStackNavigator();
const FacultyStack = createNativeStackNavigator();
const SupportStack = createNativeStackNavigator();
const SecurityStack = createNativeStackNavigator();
const AdminTabs = createBottomTabNavigator();
const StudentTabs = createBottomTabNavigator();
const FacultyTabs = createBottomTabNavigator();
const SupportTabs = createBottomTabNavigator();
const SecurityTabs = createBottomTabNavigator();

// Drawer Navigators for Sidebar Integration
const AdminDrawer = createDrawerNavigator();
const StudentDrawer = createDrawerNavigator();
const FacultyDrawer = createDrawerNavigator();
const SupportDrawer = createDrawerNavigator();
const SecurityDrawer = createDrawerNavigator();
const HRDrawer = createDrawerNavigator();
const HRStack = createNativeStackNavigator();
const HRTabs = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: '#1e3a5f',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '700' as const,
  },
  headerBackTitleVisible: false,
};

const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: '#fff',
    borderTopColor: '#e4e8ec',
    paddingBottom: 4,
    height: 56,
  },
  tabBarActiveTintColor: '#1e3a5f',
  tabBarInactiveTintColor: '#7a8a9a',
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  tabBarIconStyle: {
    marginTop: 4,
  },
};

const AdminNavigator = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const canCreateTasks = user?.adminRole && hasPermission(user.adminRole, 'task:create');
  const canViewExams = user?.adminRole && hasPermission(user.adminRole, 'exam:view');
  const canViewCrowd = user?.adminRole && hasPermission(user.adminRole, 'crowd:view');

  return (
    <AdminTabs.Navigator screenOptions={tabBarOptions}>
      <AdminTabs.Screen
        name="Dashboard"
        component={ExecutiveDashboard}
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size || 24} color={color} />
          ),
        }}
      />
      {canViewExams && (
        <AdminTabs.Screen
          name="Exams"
          component={ExamDashboard}
          options={{
            title: 'Exams',
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <Icon name="quiz" size={size || 24} color={color} />
            ),
          }}
        />
      )}
      <AdminTabs.Screen
        name="Map"
        component={CampusMapScreen}
        options={{
          title: 'Campus Map',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="map" size={size || 24} color={color} />
          ),
        }}
      />
      {canViewCrowd && (
        <AdminTabs.Screen
          name="CrowdHeatmap"
          component={CrowdHeatmapScreen}
          options={{
            title: 'Crowd Intel',
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <Icon name="people" size={size || 24} color={color} />
            ),
          }}
        />
      )}
      {canCreateTasks && (
        <AdminTabs.Screen
          name="CreateTask"
          component={CreateTaskScreen}
          options={{
            title: 'New Task',
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <Icon name="add-task" size={size || 24} color={color} />
            ),
          }}
        />
      )}
    </AdminTabs.Navigator>
  );
};

// Custom Drawer Content Component
const CustomDrawerContent = (props: any) => {
  const {user} = useSelector((state: RootState) => state.auth);
  
  const handleNavigate = (route: string) => {
    try {
      // Determine parent route based on user role
      const parentRoute = 
        user?.role === 'STUDENT' ? 'StudentHome' :
        user?.role === 'FACULTY' ? 'FacultyHome' :
        user?.role === 'ADMIN' ? 'AdminHome' :
        user?.role === 'SUPPORT' ? 'SupportHome' :
        user?.role === 'SECURITY' ? 'SecurityHome' :
        (user?.role === 'HR_ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'HR_STAFF') ? 'HRHome' :
        'AdminHome';
      
      // Check if route is a stack route (contains 'Dashboard' or 'Detail')
      const isStackRoute = route.includes('Dashboard') || route.includes('Detail') || 
                          route.includes('Create') || route.includes('Calendar') ||
                          route.includes('Timeline') || route.includes('Center') ||
                          route.includes('Broadcast') || route.includes('Insights');
      
      if (isStackRoute) {
        // Navigate directly to stack route
        props.navigation.navigate(route as never);
      } else {
        // Navigate to parent, then tab
        props.navigation.navigate(parentRoute as never, {
          screen: route,
        } as never);
      }
    } catch (error) {
      console.warn(`Navigation to ${route} failed:`, error);
      // Fallback: try direct navigation
      try {
        props.navigation.navigate(route as never);
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
    }
  };
  
  return <Sidebar onNavigate={handleNavigate} />;
};

const AdminStackNavigator = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <AdminDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: IS_TABLET ? 'permanent' : 'front',
        drawerStyle: IS_TABLET
          ? {
              width: 280,
              borderRightWidth: 0,
            }
          : {
              width: 280,
            },
        headerShown: false,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerPosition: 'left',
      }}>
      <AdminDrawer.Screen name="AdminMain" component={AdminStackWithContent} />
    </AdminDrawer.Navigator>
  );
};

const AdminStackWithContent = () => {
  return (
    <AdminStack.Navigator screenOptions={screenOptions}>
      <AdminStack.Screen
        name="AdminHome"
        component={AdminNavigator}
        options={{headerShown: false}}
      />
      <AdminStack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{title: 'Task Details'}}
      />
      <AdminStack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={{title: 'Exam Details'}}
      />
      <AdminStack.Screen
        name="CreateExam"
        component={CreateExamScreen}
        options={{title: 'Create Exam'}}
      />
      <AdminStack.Screen
        name="ExamCalendar"
        component={ExamCalendarScreen}
        options={{title: 'Exam Calendar'}}
      />
    </AdminStack.Navigator>
  );
};

// Student Navigator
const StudentNavigator = () => {
  return (
    <StudentTabs.Navigator screenOptions={tabBarOptions}>
      <StudentTabs.Screen
        name="Dashboard"
        component={StudentDashboard}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size || 24} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{
          title: 'Timetable',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="schedule" size={size || 24} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Attendance"
        component={AttendanceOverviewScreen}
        options={{
          title: 'Attendance',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle" size={size || 24} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Assignments"
        component={AssignmentsListScreen}
        options={{
          title: 'Assignments',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="assignment" size={size || 24} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Exams"
        component={ExamsScreen}
        options={{
          title: 'Exams',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="quiz" size={size || 24} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{
          title: 'Announcements',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="campaign" size={size || 24} color={color} />
          ),
        }}
      />
      <StudentTabs.Screen
        name="Profile"
        component={StudentDashboard} // Placeholder
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="account-circle" size={size || 24} color={color} />
          ),
        }}
      />
    </StudentTabs.Navigator>
  );
};

const StudentStackNavigator = () => {
  return (
    <StudentDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: IS_TABLET ? 'permanent' : 'front',
        drawerStyle: IS_TABLET
          ? {
              width: 280,
              borderRightWidth: 0,
            }
          : {
              width: 280,
            },
        headerShown: false,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerPosition: 'left',
      }}>
      <StudentDrawer.Screen name="StudentMain" component={StudentStackWithContent} />
    </StudentDrawer.Navigator>
  );
};

const StudentStackWithContent = () => {
  return (
    <StudentStack.Navigator screenOptions={screenOptions}>
      <StudentStack.Screen
        name="StudentHome"
        component={StudentNavigator}
        options={{headerShown: false}}
      />
      <StudentStack.Screen
        name="AssignmentDetail"
        component={AssignmentDetailScreen}
        options={{title: 'Assignment Details'}}
      />
      <StudentStack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={{title: 'Exam Details'}}
      />
      <StudentStack.Screen
        name="AnnouncementDetail"
        component={AnnouncementsScreen}
        options={{title: 'Announcement'}}
      />
      <StudentStack.Screen
        name="PerformanceDashboard"
        component={PerformanceDashboardScreen}
        options={{title: 'Performance Dashboard'}}
      />
      <StudentStack.Screen
        name="ExamsTimeline"
        component={ExamsTimelineScreen}
        options={{title: 'Exams Timeline'}}
      />
      <StudentStack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{title: 'Notifications'}}
      />
    </StudentStack.Navigator>
  );
};

// Faculty Navigator
const FacultyNavigator = () => {
  return (
    <FacultyTabs.Navigator screenOptions={tabBarOptions}>
      <FacultyTabs.Screen
        name="Dashboard"
        component={FacultyDashboard}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size || 24} color={color} />
          ),
        }}
      />
      <FacultyTabs.Screen
        name="Attendance"
        component={AttendanceManagementScreen}
        options={{
          title: 'Attendance',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="how-to-reg" size={size || 24} color={color} />
          ),
        }}
      />
      <FacultyTabs.Screen
        name="Assignments"
        component={AssignmentsManagementScreen}
        options={{
          title: 'Assignments',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="assignment" size={size || 24} color={color} />
          ),
        }}
      />
      <FacultyTabs.Screen
        name="Analytics"
        component={ClassIntelligenceScreen}
        options={{
          title: 'Analytics',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="insights" size={size || 24} color={color} />
          ),
        }}
      />
      <FacultyTabs.Screen
        name="Profile"
        component={FacultyDashboard} // Placeholder
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="account-circle" size={size || 24} color={color} />
          ),
        }}
      />
    </FacultyTabs.Navigator>
  );
};

const FacultyStackNavigator = () => {
  return (
    <FacultyDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: IS_TABLET ? 'permanent' : 'front',
        drawerStyle: IS_TABLET
          ? {
              width: 280,
              borderRightWidth: 0,
            }
          : {
              width: 280,
            },
        headerShown: false,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerPosition: 'left',
      }}>
      <FacultyDrawer.Screen name="FacultyMain" component={FacultyStackWithContent} />
    </FacultyDrawer.Navigator>
  );
};

const FacultyStackWithContent = () => {
  return (
    <FacultyStack.Navigator screenOptions={screenOptions}>
      <FacultyStack.Screen
        name="FacultyHome"
        component={FacultyNavigator}
        options={{headerShown: false}}
      />
      <FacultyStack.Screen
        name="CreateAssignment"
        component={CreateAssignmentScreen}
        options={{title: 'Create Assignment'}}
      />
      <FacultyStack.Screen
        name="AssignmentSubmissions"
        component={SubmissionGradingScreen}
        options={{title: 'Grade Submissions'}}
      />
      <FacultyStack.Screen
        name="StudentPerformanceInsights"
        component={StudentPerformanceInsightsScreen}
        options={{title: 'Student Performance'}}
      />
      <FacultyStack.Screen
        name="AnnouncementBroadcast"
        component={AnnouncementBroadcastScreen}
        options={{title: 'Broadcast Announcement'}}
      />
    </FacultyStack.Navigator>
  );
};

// Support Navigator
const SupportNavigator = () => {
  return (
    <SupportTabs.Navigator screenOptions={tabBarOptions}>
      <SupportTabs.Screen
        name="Dashboard"
        component={SupportDashboard}
        options={{
          title: 'Tickets',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="support-agent" size={size || 24} color={color} />
          ),
        }}
      />
      <SupportTabs.Screen
        name="Analytics"
        component={SupportDashboard}
        options={{
          title: 'Analytics',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="analytics" size={size || 24} color={color} />
          ),
        }}
      />
    </SupportTabs.Navigator>
  );
};

const SupportStackNavigator = () => {
  return (
    <SupportDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: IS_TABLET ? 'permanent' : 'front',
        drawerStyle: IS_TABLET
          ? {
              width: 280,
              borderRightWidth: 0,
            }
          : {
              width: 280,
            },
        headerShown: false,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerPosition: 'left',
      }}>
      <SupportDrawer.Screen name="SupportMain" component={SupportStackWithContent} />
    </SupportDrawer.Navigator>
  );
};

const SupportStackWithContent = () => {
  return (
    <SupportStack.Navigator screenOptions={screenOptions}>
      <SupportStack.Screen
        name="SupportHome"
        component={SupportNavigator}
        options={{headerShown: false}}
      />
      <SupportStack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{title: 'Ticket Details'}}
      />
    </SupportStack.Navigator>
  );
};

// Security Navigator
const SecurityNavigator = () => {
  return (
    <SecurityTabs.Navigator screenOptions={tabBarOptions}>
      <SecurityTabs.Screen
        name="Dashboard"
        component={SecurityDashboard}
        options={{
          title: 'Incidents',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="security" size={size || 24} color={color} />
          ),
        }}
      />
      <SecurityTabs.Screen
        name="SOSAlerts"
        component={SOSAlertsDashboard}
        options={{
          title: 'SOS Alerts',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="emergency" size={size || 24} color={color} />
          ),
        }}
      />
      <SecurityTabs.Screen
        name="Geofence"
        component={GeofenceMonitorScreen}
        options={{
          title: 'Geofence',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="location-on" size={size || 24} color={color} />
          ),
        }}
      />
    </SecurityTabs.Navigator>
  );
};

const SecurityStackNavigator = () => {
  return (
    <SecurityDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: IS_TABLET ? 'permanent' : 'front',
        drawerStyle: IS_TABLET
          ? {
              width: 280,
              borderRightWidth: 0,
            }
          : {
              width: 280,
            },
        headerShown: false,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerPosition: 'left',
      }}>
      <SecurityDrawer.Screen name="SecurityMain" component={SecurityStackWithContent} />
    </SecurityDrawer.Navigator>
  );
};

const SecurityStackWithContent = () => {
  return (
    <SecurityStack.Navigator screenOptions={screenOptions}>
      <SecurityStack.Screen
        name="SecurityHome"
        component={SecurityNavigator}
        options={{headerShown: false}}
      />
      <SecurityStack.Screen
        name="IncidentDetail"
        component={SecurityDashboard}
        options={{title: 'Incident Details'}}
      />
      <SecurityStack.Screen
        name="StudentLocation"
        component={StudentLocationTrackingScreen}
        options={{title: 'Student Location'}}
      />
    </SecurityStack.Navigator>
  );
};

// HR Navigator
const HRNavigator = () => {
  return (
    <HRTabs.Navigator screenOptions={tabBarOptions}>
      <HRTabs.Screen
        name="Dashboard"
        component={HRDashboard}
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="dashboard" size={size || 24} color={color} />
          ),
        }}
      />
      <HRTabs.Screen
        name="Employees"
        component={EmployeeManagementScreen}
        options={{
          title: 'Employees',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="people" size={size || 24} color={color} />
          ),
        }}
      />
      <HRTabs.Screen
        name="Recruitment"
        component={RecruitmentScreen}
        options={{
          title: 'Recruitment',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="work" size={size || 24} color={color} />
          ),
        }}
      />
      <HRTabs.Screen
        name="Leave"
        component={LeaveManagementScreen}
        options={{
          title: 'Leave',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Icon name="event-available" size={size || 24} color={color} />
          ),
        }}
      />
    </HRTabs.Navigator>
  );
};

const HRStackNavigator = () => {
  return (
    <HRDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: IS_TABLET ? 'permanent' : 'front',
        drawerStyle: IS_TABLET
          ? {
              width: 280,
              borderRightWidth: 0,
            }
          : {
              width: 280,
            },
        headerShown: false,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerPosition: 'left',
      }}>
      <HRDrawer.Screen name="HRMain" component={HRStackWithContent} />
    </HRDrawer.Navigator>
  );
};

const HRStackWithContent = () => {
  return (
    <HRStack.Navigator screenOptions={screenOptions}>
      <HRStack.Screen
        name="HRHome"
        component={HRNavigator}
        options={{headerShown: false}}
      />
      <HRStack.Screen
        name="EmployeeDetail"
        component={EmployeeDetailScreen}
        options={{title: 'Employee Details'}}
      />
      <HRStack.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{title: 'Payroll'}}
      />
      <HRStack.Screen
        name="Performance"
        component={PerformanceScreen}
        options={{title: 'Performance'}}
      />
      <HRStack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{title: 'Expenses'}}
      />
      <HRStack.Screen
        name="Compliance"
        component={ComplianceScreen}
        options={{title: 'Compliance'}}
      />
    </HRStack.Navigator>
  );
};

const RootNavigator = () => {
  const dispatch = useDispatch();
  const {user, initializing} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        dispatch(startTasksForRole({role: user.role, userId: user.id}) as any);
        dispatch(startExamsForRole({role: user.role, userId: user.id}) as any);
      }
      return () => {
        if (user.role === 'ADMIN') {
          dispatch(stopTaskListener() as any);
          dispatch(stopExamListener() as any);
        }
      };
    }
    if (user?.role === 'ADMIN') {
      dispatch(stopTaskListener() as any);
      dispatch(stopExamListener() as any);
    }
  }, [dispatch, user]);

  if (initializing) {
    // #region agent log
    log('RootNavigator.tsx:723', 'Navigation initializing', {}, 'E');
    // #endregion
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f9'}}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={{marginTop: 12, color: '#5a6a7a', fontSize: 13}}>
          Loading CampusIQ...
        </Text>
      </View>
    );
  }

  if (!user) {
    // #region agent log
    log('RootNavigator.tsx:734', 'No user, showing auth stack', {}, 'E');
    // #endregion
    return (
      <AuthStack.Navigator screenOptions={{headerShown: false}}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  }

  // Route based on user role
  // #region agent log
  log('RootNavigator.tsx:744', 'Routing based on user role', {role: user.role, adminRole: user.adminRole}, 'E');
  // #endregion
  if (user.role === 'STUDENT') {
    return <StudentStackNavigator />;
  }
  
  if (user.role === 'FACULTY') {
    return <FacultyStackNavigator />;
  }
  
  if (user.role === 'ADMIN') {
    return <AdminStackNavigator />;
  }

  if (user.role === 'SUPPORT') {
    return <SupportStackNavigator />;
  }

  if (user.role === 'SECURITY') {
    return <SecurityStackNavigator />;
  }

  if (user.role === 'HR_ADMIN' || user.role === 'HR_MANAGER' || user.role === 'HR_STAFF') {
    return <HRStackNavigator />;
  }

  // Default to admin for unknown roles
  // #region agent log
  log('RootNavigator.tsx:765', 'Unknown role, defaulting to admin', {role: user.role}, 'E');
  // #endregion
  return <AdminStackNavigator />;
};

export default RootNavigator;
