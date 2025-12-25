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
import {RootState} from '../redux/store';
import {startTasksForRole, stopTaskListener} from '../redux/slices/taskSlice';
import {startExamsForRole, stopExamListener} from '../redux/slices/examSlice';
import {signOut} from '../redux/slices/authSlice';
import {hasPermission, getRoleDisplayName} from '../config/permissions';

const AuthStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const AdminTabs = createBottomTabNavigator();

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
          title: 'Campus Map',
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
              <Text style={{color: '#fff', fontWeight: '700', fontSize: 17}}>
                CampusIQ
              </Text>
              {user?.adminRole && (
                <Text style={{color: '#a8c4e0', fontSize: 11}}>
                  {getRoleDisplayName(user.adminRole)}
                </Text>
              )}
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={{marginRight: 8}}>
              <Text style={{color: '#a8c4e0', fontSize: 13, fontWeight: '600'}}>
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
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f9'}}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={{marginTop: 12, color: '#5a6a7a', fontSize: 13}}>
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
