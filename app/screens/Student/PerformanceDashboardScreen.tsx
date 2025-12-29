import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchStudentAttendanceSummary,
  fetchStudentAttendanceStats,
} from '../../redux/slices/attendanceSlice';
import {
  fetchStudentAssignments,
  fetchStudentAssignmentSummary,
} from '../../redux/slices/assignmentSlice';
import {fetchExams} from '../../redux/slices/examSlice';
import {useAIAcademicAdvisor} from '../../hooks/useAI';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/**
 * Simple Line Chart Component
 * Displays trend data over time
 */
const SimpleLineChart = ({
  data,
  color,
  label,
}: {
  data: number[];
  color: string;
  label: string;
}) => {
  const maxValue = Math.max(...data, 1);
  const chartHeight = 120;
  const chartWidth = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.base * 2;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (value / maxValue) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.chartWrapper}>
        <View style={[styles.chart, {height: chartHeight}]}>
          <View style={styles.chartGrid}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.gridLine,
                  {top: (i / 3) * chartHeight},
                ]}
              />
            ))}
          </View>
          <View style={styles.chartContent}>
            <View style={styles.chartBars}>
              {data.map((value, index) => {
                const barHeight = (value / maxValue) * chartHeight;
                return (
                  <View
                    key={index}
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: color,
                        width: (chartWidth / data.length) - 4,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.chartLabels}>
          {data.map((_, index) => (
            <Text key={index} style={styles.chartLabelText}>
              W{index + 1}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

/**
 * Risk Alert Card
 */
const RiskAlert = ({type, message, severity}: {type: string; message: string; severity: 'low' | 'medium' | 'high'}) => {
  const severityColors = {
    low: Colors.warning,
    medium: Colors.warning,
    high: Colors.error,
  };

  return (
    <View style={[styles.riskAlert, {borderLeftColor: severityColors[severity]}]}>
      <Text style={styles.riskAlertType}>{type}</Text>
      <Text style={styles.riskAlertMessage}>{message}</Text>
    </View>
  );
};

const PerformanceDashboardScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {summary: attendanceSummary, stats: attendanceStats, loading: attendanceLoading} = useSelector(
    (state: RootState) => state.attendance,
  );
  const {summary: assignmentSummary, loading: assignmentLoading} = useSelector(
    (state: RootState) => state.assignment,
  );
  const {exams, loading: examsLoading} = useSelector((state: RootState) => state.exam);

  const {getAdvice, loading: aiLoading, advice} = useAIAcademicAdvisor();
  const [selectedAdviceTopic, setSelectedAdviceTopic] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchStudentAttendanceSummary({studentId: user.id}) as any);
      dispatch(fetchStudentAttendanceStats(user.id) as any);
      dispatch(fetchStudentAssignments({studentId: user.id}) as any);
      dispatch(fetchStudentAssignmentSummary(user.id) as any);
      dispatch(fetchExams({studentId: user.id}) as any);
    }
  }, [dispatch, user]);

  const overallAttendance = useMemo(() => {
    if (attendanceSummary.length === 0) return 0;
    return Math.round(
      attendanceSummary.reduce((sum, s) => sum + s.attendancePercentage, 0) /
        attendanceSummary.length,
    );
  }, [attendanceSummary]);

  // Mock trend data (in production, fetch from backend)
  const attendanceTrend = useMemo(() => {
    // Generate mock weekly attendance trend
    const base = overallAttendance;
    return Array.from({length: 8}, (_, i) => {
      const variation = (Math.random() - 0.5) * 10;
      return Math.max(0, Math.min(100, base + variation));
    });
  }, [overallAttendance]);

  const gradesTrend = useMemo(() => {
    // Mock grades trend
    return [75, 78, 82, 80, 85, 83, 87, 85];
  }, []);

  const riskAlerts = useMemo(() => {
    const alerts: Array<{type: string; message: string; severity: 'low' | 'medium' | 'high'}> = [];
    
    if (overallAttendance < 75) {
      alerts.push({
        type: 'Attendance Risk',
        message: `Your attendance is ${overallAttendance}%. Maintain 75% to avoid issues.`,
        severity: overallAttendance < 60 ? 'high' : 'medium',
      });
    }

    if (assignmentSummary?.overdue && assignmentSummary.overdue > 0) {
      alerts.push({
        type: 'Overdue Assignments',
        message: `You have ${assignmentSummary.overdue} overdue assignment(s). Submit them soon.`,
        severity: assignmentSummary.overdue > 2 ? 'high' : 'medium',
      });
    }

    if (assignmentSummary?.pending && assignmentSummary.pending > 3) {
      alerts.push({
        type: 'Pending Assignments',
        message: `You have ${assignmentSummary.pending} pending assignments. Plan your time wisely.`,
        severity: 'low',
      });
    }

    return alerts;
  }, [overallAttendance, assignmentSummary]);

  const handleGetAdvice = (topic: string) => {
    setSelectedAdviceTopic(topic);
    getAdvice(topic);
  };

  const loading = attendanceLoading || assignmentLoading || examsLoading;

  if (loading && attendanceSummary.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance Dashboard</Text>
        <Text style={styles.headerSubtitle}>Track your academic progress</Text>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={[styles.statValue, {color: overallAttendance >= 75 ? Colors.success : Colors.error}]}>
            {overallAttendance}%
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Grade</Text>
          <Text style={[styles.statValue, {color: Colors.primary}]}>
            {gradesTrend[gradesTrend.length - 1]}%
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, {color: Colors.warning}]}>
            {assignmentSummary?.pending || 0}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Exams</Text>
          <Text style={[styles.statValue, {color: Colors.info}]}>
            {exams?.length || 0}
          </Text>
        </View>
      </View>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Risk Alerts</Text>
          {riskAlerts.map((alert, index) => (
            <RiskAlert key={index} {...alert} />
          ))}
        </View>
      )}

      {/* Attendance Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Trend</Text>
        <SimpleLineChart data={attendanceTrend} color={Colors.primary} label="Weekly Attendance %" />
      </View>

      {/* Grades Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grades Trend</Text>
        <SimpleLineChart data={gradesTrend} color={Colors.success} label="Average Grades %" />
      </View>

      {/* AI Mentor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 AI Academic Mentor</Text>
        <Text style={styles.sectionSubtitle}>Get personalized academic advice</Text>
        
        <View style={styles.adviceTopics}>
          {['Study Tips', 'Time Management', 'Exam Preparation', 'Career Guidance'].map(topic => (
            <TouchableOpacity
              key={topic}
              style={[
                styles.adviceTopicButton,
                selectedAdviceTopic === topic && styles.adviceTopicButtonActive,
              ]}
              onPress={() => handleGetAdvice(topic)}
              disabled={aiLoading}>
              <Text
                style={[
                  styles.adviceTopicText,
                  selectedAdviceTopic === topic && styles.adviceTopicTextActive,
                ]}>
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {aiLoading && (
          <View style={styles.aiResponse}>
            <Text style={styles.aiResponseText}>Thinking...</Text>
          </View>
        )}

        {advice && selectedAdviceTopic && (
          <View style={styles.aiResponse}>
            <Text style={styles.aiResponseTitle}>{selectedAdviceTopic}</Text>
            <Text style={styles.aiResponseText}>{advice}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Attendance')}>
            <Text style={styles.actionButtonText}>View Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Assignments')}>
            <Text style={styles.actionButtonText}>View Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Exams')}>
            <Text style={styles.actionButtonText}>View Exams</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: Spacing.base,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryAccentLight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.base,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    fontWeight: Typography.fontWeight.semibold,
  },
  statValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  riskAlert: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  riskAlertType: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  riskAlertMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Shadows.base,
  },
  chartLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  chartWrapper: {
    marginTop: Spacing.sm,
  },
  chart: {
    width: '100%',
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  chartGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
  },
  chartContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  bar: {
    borderRadius: BorderRadius.sm,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  chartLabelText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  adviceTopics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  adviceTopicButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adviceTopicButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  adviceTopicText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semibold,
  },
  adviceTopicTextActive: {
    color: Colors.textInverse,
  },
  aiResponse: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  aiResponseTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  aiResponseText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default PerformanceDashboardScreen;

