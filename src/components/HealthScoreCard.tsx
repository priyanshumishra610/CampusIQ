import React, {useEffect, useState, useMemo} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {
  calculateHealthScore,
  getHealthScoreColor,
  getHealthScoreLevel,
  generateHealthSummaryPrompt,
  HealthScoreBreakdown,
} from '../services/healthScore.service';
import {generateHealthSummary} from '../services/gemini.service';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';
import {shadows} from '../theme/shadows';

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
          <ActivityIndicator size="small" color={colors.textSecondary} />
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
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
  },
  scoreValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['2xl'],
    letterSpacing: -0.3,
  },
  scoreMax: {
    fontSize: fontSize.base,
    color: colors.textTertiary,
    marginTop: -spacing.xs,
    fontWeight: fontWeight.medium,
  },
  breakdownContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  impactDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
  },
  breakdownValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    minWidth: 32,
    textAlign: 'right',
  },
  summaryContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: fontSize.base * 1.5,
    fontWeight: fontWeight.normal,
    marginBottom: spacing.xs,
  },
  aiTag: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.normal,
  },
});

export default HealthScoreCard;

