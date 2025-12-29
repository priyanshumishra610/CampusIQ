import React, {useEffect, useState, useMemo} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  calculateHealthScore,
  getHealthScoreColor,
  getHealthScoreLevel,
  generateHealthSummaryPrompt,
  HealthScoreBreakdown,
} from '../../services/healthScore.service';
import {generateHealthSummary} from '../../services/gemini.service';

const HealthScoreCard = () => {
  const tasks = useSelector((state: RootState) => state.tasks.items);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const breakdown = useMemo(() => calculateHealthScore(tasks), [tasks]);
  const scoreColor = useMemo(() => getHealthScoreColor(breakdown.score), [breakdown.score]);
  const scoreLevel = useMemo(() => getHealthScoreLevel(breakdown.score), [breakdown.score]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const prompt = generateHealthSummaryPrompt(breakdown.score, breakdown, tasks);
        const summary = await generateHealthSummary(prompt);
        setAiSummary(summary);
      } catch {
        setAiSummary('Campus health analysis in progress.');
      }
      setLoading(false);
    };

    fetchSummary();
  }, [breakdown.score, tasks.length]);

  const getScoreLabel = () => {
    switch (scoreLevel) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Attention Needed';
      case 'critical':
        return 'Critical';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Health Score</Text>
        <View style={[styles.badge, {backgroundColor: scoreColor}]}>
          <Text style={styles.badgeText}>{getScoreLabel()}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreCircle, {borderColor: scoreColor}]}>
          <Text style={[styles.scoreValue, {color: scoreColor}]}>
            {breakdown.score}
          </Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>

        <View style={styles.breakdownContainer}>
          <BreakdownItem
            label="Overdue Tasks"
            impact={breakdown.overdueImpact}
            color="#e74c3c"
          />
          <BreakdownItem
            label="Compliance Risks"
            impact={breakdown.complianceRiskImpact}
            color="#9b59b6"
          />
          <BreakdownItem
            label="Escalations"
            impact={breakdown.escalationImpact}
            color="#e67e22"
          />
          <BreakdownItem
            label="Pending Approvals"
            impact={breakdown.pendingApprovalImpact}
            color="#3498db"
          />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#5a6a7a" />
        ) : (
          <Text style={styles.summaryText}>
            {aiSummary || 'Analyzing campus operations...'}
          </Text>
        )}
        <Text style={styles.aiTag}>Powered by Gemini AI</Text>
      </View>
    </View>
  );
};

const BreakdownItem = ({
  label,
  impact,
  color,
}: {
  label: string;
  impact: number;
  color: string;
}) => {
  if (impact === 0) return null;
  
  return (
    <View style={styles.breakdownItem}>
      <View style={[styles.impactDot, {backgroundColor: color}]} />
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, {color}]}>-{impact}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafbfc',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 12,
    color: '#7a8a9a',
    marginTop: -2,
  },
  breakdownContainer: {
    flex: 1,
    gap: 6,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 12,
    color: '#5a6a7a',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f4',
  },
  summaryText: {
    fontSize: 14,
    color: '#2a3a4a',
    lineHeight: 21,
  },
  aiTag: {
    marginTop: 10,
    fontSize: 10,
    color: '#1e3a5f',
    fontWeight: '600',
  },
});

export default HealthScoreCard;

