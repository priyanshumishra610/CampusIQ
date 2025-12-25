import {Task, TaskStatus, TaskPriority} from '../redux/taskSlice';

export type HealthScoreBreakdown = {
  score: number;
  overdueImpact: number;
  complianceRiskImpact: number;
  pendingApprovalImpact: number;
  escalationImpact: number;
  budgetRiskImpact: number;
};

export type HealthScoreLevel = 'healthy' | 'warning' | 'critical';

const WEIGHTS = {
  overdueTasks: 25,
  complianceRisks: 25,
  pendingApprovals: 15,
  escalations: 20,
  budgetRisks: 15,
};

const isOverdue = (task: Task): boolean => {
  if (task.status === 'RESOLVED') return false;
  const createdAt = task.createdAt instanceof Date
    ? task.createdAt
    : task.createdAt?.toDate?.() || new Date();
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (task.priority === 'HIGH' && daysSinceCreation > 2) return true;
  if (task.priority === 'MEDIUM' && daysSinceCreation > 5) return true;
  if (task.priority === 'LOW' && daysSinceCreation > 10) return true;
  return false;
};

const isComplianceRisk = (task: Task): boolean => {
  return (
    task.category === 'Compliance' &&
    task.priority === 'HIGH' &&
    task.status !== 'RESOLVED'
  );
};

const isPendingApproval = (task: Task): boolean => {
  return task.status === 'NEW' && task.priority !== 'LOW';
};

const isBudgetRisk = (task: Task): boolean => {
  return (
    task.category === 'Finance' &&
    task.priority === 'HIGH' &&
    task.status !== 'RESOLVED'
  );
};

export const calculateHealthScore = (tasks: Task[]): HealthScoreBreakdown => {
  if (tasks.length === 0) {
    return {
      score: 100,
      overdueImpact: 0,
      complianceRiskImpact: 0,
      pendingApprovalImpact: 0,
      escalationImpact: 0,
      budgetRiskImpact: 0,
    };
  }

  const activeTasks = tasks.filter(t => t.status !== 'RESOLVED');
  const totalActive = activeTasks.length || 1;

  const overdueCount = tasks.filter(isOverdue).length;
  const complianceRiskCount = tasks.filter(isComplianceRisk).length;
  const pendingApprovalCount = tasks.filter(isPendingApproval).length;
  const escalatedCount = tasks.filter(t => t.status === 'ESCALATED').length;
  const budgetRiskCount = tasks.filter(isBudgetRisk).length;

  const overdueImpact = Math.min((overdueCount / totalActive) * WEIGHTS.overdueTasks, WEIGHTS.overdueTasks);
  const complianceRiskImpact = Math.min((complianceRiskCount / totalActive) * WEIGHTS.complianceRisks * 2, WEIGHTS.complianceRisks);
  const pendingApprovalImpact = Math.min((pendingApprovalCount / totalActive) * WEIGHTS.pendingApprovals, WEIGHTS.pendingApprovals);
  const escalationImpact = Math.min((escalatedCount / totalActive) * WEIGHTS.escalations * 1.5, WEIGHTS.escalations);
  const budgetRiskImpact = Math.min((budgetRiskCount / totalActive) * WEIGHTS.budgetRisks * 2, WEIGHTS.budgetRisks);

  const totalImpact = overdueImpact + complianceRiskImpact + pendingApprovalImpact + escalationImpact + budgetRiskImpact;
  const score = Math.max(0, Math.min(100, Math.round(100 - totalImpact)));

  return {
    score,
    overdueImpact: Math.round(overdueImpact),
    complianceRiskImpact: Math.round(complianceRiskImpact),
    pendingApprovalImpact: Math.round(pendingApprovalImpact),
    escalationImpact: Math.round(escalationImpact),
    budgetRiskImpact: Math.round(budgetRiskImpact),
  };
};

export const getHealthScoreLevel = (score: number): HealthScoreLevel => {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'warning';
  return 'critical';
};

export const getHealthScoreColor = (score: number): string => {
  const level = getHealthScoreLevel(score);
  switch (level) {
    case 'healthy':
      return '#27ae60';
    case 'warning':
      return '#f39c12';
    case 'critical':
      return '#c0392b';
  }
};

export const generateHealthSummaryPrompt = (
  score: number,
  breakdown: HealthScoreBreakdown,
  tasks: Task[],
): string => {
  const overdueCount = tasks.filter(isOverdue).length;
  const complianceRiskCount = tasks.filter(isComplianceRisk).length;
  const escalatedCount = tasks.filter(t => t.status === 'ESCALATED').length;
  const pendingCount = tasks.filter(t => t.status === 'NEW').length;

  return `
You are an AI advisor for CampusIQ, a college operations intelligence platform.
Generate a concise 1-2 sentence executive summary of the campus health status.

Current Health Score: ${score}/100
- Overdue tasks: ${overdueCount}
- High-priority compliance risks: ${complianceRiskCount}
- Escalated items: ${escalatedCount}
- Pending approvals: ${pendingCount}
- Total active tasks: ${tasks.filter(t => t.status !== 'RESOLVED').length}

Tone: Professional, calm, actionable. No emojis. Focus on the most critical insight.
If score >= 80: Reassuring but mention any minor concerns.
If score 60-79: Highlight the primary concern requiring attention.
If score < 60: Urgent but composed, specify the critical area needing immediate focus.

Respond with ONLY the summary text, no quotes or formatting.
  `.trim();
};

