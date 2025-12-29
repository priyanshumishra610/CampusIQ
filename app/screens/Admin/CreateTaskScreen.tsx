import React from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ReportForm} from '../../components/Task';
import {createTask} from '../../redux/slices/taskSlice';
import {RootState} from '../../redux/store';
import NetInfo from '@react-native-community/netinfo';

const CreateTaskScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {creating, error} = useSelector((state: RootState) => state.tasks);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = async (payload: {
    title: string;
    description: string;
    location?: {lat: number; lng: number};
    imageBase64?: string;
  }) => {
    if (!user) return;
    
    const net = await NetInfo.fetch();
    const isOnline =
      net.isConnected && (net.isInternetReachable === null || net.isInternetReachable);
    
    dispatch(
      createTask({
        ...payload,
        createdBy: user.id,
        createdByName: user.name,
        creatorRole: user.adminRole,
      }) as any,
    ).then((res: any) => {
      if (!res.error) {
        if (!isOnline) {
          Alert.alert('Saved Locally', 'Task will sync when connected to network.');
        }
        navigation.goBack();
      } else {
        const message = res.payload || error || 'Could not create task';
        Alert.alert('Error', message);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Operations Task</Text>
      <Text style={styles.subtitle}>
        Document administrative activities, compliance items, or operational needs
      </Text>
      <ReportForm onSubmit={handleSubmit} loading={creating} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c1222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginBottom: 20,
    lineHeight: 18,
  },
});

export default CreateTaskScreen;

