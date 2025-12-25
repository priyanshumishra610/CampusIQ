import React, {useEffect} from 'react';
import {ActivityIndicator, View, Text, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
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
import EmployeeManagementScreen from '../screens/Employee/EmployeeManagementScreen';
import {RootState} from '../redux/store';
import {startTasksForRole, stopTaskListener} from '../redux/taskSlice';
import {startExamsForRole, stopExamListener} from '../redux/examSlice';
import {signOut} from '../redux/authSlice';
import {hasPermission, getRoleDisplayName} from '../config/permissions';
import {colors} from '../theme/colors';
import {spacing, fontSize, fontWeight} from '../theme/spacing';

const AuthStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const AdminTabs = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.backgroundSecondary,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: {
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};

// Simple icon component for tabs
const TabIcon = ({name, focused}: {name: string; focused: boolean}) => {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    Exams: '📝',
    Map: '🗺️',
    CrowdHeatmap: '🔥',
    CreateTask: '➕',
    EmployeeManagement: '👥',
  };
  
  return (
    <Text style={{fontSize: 20, opacity: focused ? 1 : 0.6}}>
      {icons[name] || '○'}
    </Text>
  );
};

const tabBarOptions = ({route}: any) => ({
  tabBarIcon: ({focused}: {focused: boolean}) => (
    <TabIcon name={route.name} focused={focused} />
  ),
  tabBarStyle: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    height: 60,
    elevation: 0,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textTertiary,
  tabBarLabelStyle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: -spacing.xs,
  },
  tabBarIconStyle: {
    marginTop: spacing.xs,
  },
});

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
        }}
      />
      {canViewExams && (
        <AdminTabs.Screen
          name="Exams"
          component={ExamDashboard}
          options={{
            title: 'Exams',
            headerShown: false,
          }}
        />
      )}
      <AdminTabs.Screen
        name="Map"
        component={CampusMapScreen}
        options={{
          title: 'Map',
          headerShown: false,
        }}
      />
      {canViewCrowd && (
        <AdminTabs.Screen
          name="CrowdHeatmap"
          component={CrowdHeatmapScreen}
          options={{
            title: 'Crowd Intel',
            headerShown: false,
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
          }}
        />
      )}
      <AdminTabs.Screen
        name="EmployeeManagement"
        component={EmployeeManagementScreen}
        options={{
          title: 'Employees',
          headerShown: false,
        }}
      />
    </AdminTabs.Navigator>
  );
};

const AdminStackNavigator = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSignOut = () => {
    dispatch(signOut() as any);
  };

  return (
    <AdminStack.Navigator screenOptions={screenOptions}>
      <AdminStack.Screen
        name="AdminHome"
        component={AdminNavigator}
        options={{
          headerTitle: () => (
            <View>
              <Text style={{color: colors.textPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.md}}>
                CampusIQ
              </Text>
              {user?.adminRole && (
                <Text style={{color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: fontWeight.normal, marginTop: 2}}>
                  {getRoleDisplayName(user.adminRole)}
                </Text>
              )}
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={{marginRight: spacing.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm}} activeOpacity={0.7}>
              <Text style={{color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium}}>
                Sign Out
              </Text>
            </TouchableOpacity>
          ),
        }}
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

const RootNavigator = () => {
  const dispatch = useDispatch();
  const {user, initializing} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(startTasksForRole({role: user.role, userId: user.id}) as any);
      dispatch(startExamsForRole({role: user.role, userId: user.id}) as any);
      return () => {
        dispatch(stopTaskListener() as any);
        dispatch(stopExamListener() as any);
      };
    }
    dispatch(stopTaskListener() as any);
    dispatch(stopExamListener() as any);
  }, [dispatch, user]);

  if (initializing) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop: spacing.md, color: colors.textSecondary, fontSize: fontSize.base, fontWeight: fontWeight.medium}}>
          Loading CampusIQ...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{headerShown: false}}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  }

  return <AdminStackNavigator />;
};

export default RootNavigator;
