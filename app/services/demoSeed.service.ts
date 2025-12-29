import AsyncStorage from '@react-native-async-storage/async-storage';
import {AdminRole} from '../config/permissions';
import apiClient from './api.client';

const FLAG = 'campusiq_seed_v2';
export const DEMO_ADMIN_EMAIL = 'admin@campusiq.edu';

const samples = [
  {
    title: 'Accreditation document review deadline',
    description: 'NAAC documentation for Criterion III due next week. Faculty coordinators need to submit self-assessment reports.',
    priority: 'HIGH',
    category: 'Compliance',
    status: 'PENDING',
    createdBy: 'demo-admin-1',
    createdByName: 'Dr. Sharma (Registrar)',
    hoursAgo: 12,
  },
  {
    title: 'Budget reallocation for Q3',
    description: 'Finance committee requires department heads to submit revised budget proposals by end of week.',
    priority: 'HIGH',
    category: 'Finance',
    status: 'IN_PROGRESS',
    createdBy: 'demo-admin-2',
    createdByName: 'Dr. Patel (Dean)',
    hoursAgo: 30,
  },
  {
    title: 'Faculty recruitment - Computer Science',
    description: 'Three assistant professor positions approved. HR to initiate recruitment process.',
    priority: 'MEDIUM',
    category: 'HR',
    status: 'PENDING',
    createdBy: 'demo-admin-3',
    createdByName: 'Prof. Gupta (HOD)',
    hoursAgo: 4,
  },
  {
    title: 'Student information system migration',
    description: 'ERP system upgrade scheduled. All departments to verify data integrity before migration.',
    priority: 'MEDIUM',
    category: 'IT',
    status: 'COMPLETED',
    createdBy: 'demo-admin-4',
    createdByName: 'Mr. Kumar (IT Director)',
    hoursAgo: 50,
    resolvedHoursAgo: 10,
  },
  {
    title: 'Admission cycle planning',
    description: 'Admission committee meeting to finalize intake numbers and eligibility criteria for next academic year.',
    priority: 'HIGH',
    category: 'Admissions',
    status: 'IN_PROGRESS',
    createdBy: 'demo-admin-5',
    createdByName: 'Dr. Singh (Admissions)',
    hoursAgo: 18,
  },
  {
    title: 'Infrastructure audit findings',
    description: 'PWD inspection report received. Critical repairs needed in Science Block before monsoon.',
    priority: 'HIGH',
    category: 'Facilities',
    status: 'IN_PROGRESS',
    createdBy: 'demo-admin-6',
    createdByName: 'Mr. Reddy (Estate)',
    hoursAgo: 70,
  },
  {
    title: 'Academic calendar finalization',
    description: 'Draft academic calendar for upcoming semester needs approval from Academic Council.',
    priority: 'MEDIUM',
    category: 'Academics',
    status: 'PENDING',
    createdBy: 'demo-admin-7',
    createdByName: 'Dr. Iyer (Controller)',
    hoursAgo: 8,
  },
  {
    title: 'Faculty shortage in Mathematics department',
    description: 'Two faculty members on extended leave. Need temporary arrangements for covering classes.',
    priority: 'HIGH',
    category: 'HR',
    status: 'PENDING',
    createdBy: 'demo-admin-8',
    createdByName: 'Prof. Verma (Dean Sciences)',
    hoursAgo: 6,
  },
  {
    title: 'Grant proposal submission deadline',
    description: 'UGC research grant proposal needs final review and submission by department heads.',
    priority: 'HIGH',
    category: 'Compliance',
    status: 'PENDING',
    createdBy: 'demo-admin-9',
    createdByName: 'Dr. Menon (Research)',
    hoursAgo: 48,
  },
];

const demoUsers: {id: string; name: string; email: string; role: 'ADMIN'; adminRole: AdminRole}[] = [
  {id: 'demo-registrar', name: 'Dr. Sharma', email: 'registrar@campusiq.edu', role: 'ADMIN', adminRole: 'REGISTRAR'},
  {id: 'demo-dean', name: 'Dr. Patel', email: 'dean@campusiq.edu', role: 'ADMIN', adminRole: 'DEAN'},
  {id: 'demo-director', name: 'Mr. Kumar', email: 'director@campusiq.edu', role: 'ADMIN', adminRole: 'DIRECTOR'},
  {id: 'demo-executive', name: 'Dr. Rao', email: 'executive@campusiq.edu', role: 'ADMIN', adminRole: 'EXECUTIVE'},
];

export const seedDemoData = async () => {
  try {
    const flag = await AsyncStorage.getItem(FLAG);
    if (flag) return;

    const now = Date.now();

    // Create demo users (skip if they already exist)
    for (const user of demoUsers) {
      try {
        await apiClient.post('/auth/register', {
          email: user.email,
          password: 'password123',
          name: user.name,
          role: user.role,
          adminRole: user.adminRole,
        });
      } catch (error: any) {
        // User might already exist, continue
        if (error?.response?.status !== 400) {
          console.warn('Error creating demo user:', error);
        }
      }
    }

    // Create demo tasks
    for (const sample of samples) {
      try {
        const createdAt = new Date(now - sample.hoursAgo * 60 * 60 * 1000);
        const dueDate = sample.resolvedHoursAgo
          ? new Date(now - sample.resolvedHoursAgo * 60 * 60 * 1000)
          : new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        await apiClient.post('/tasks', {
          title: sample.title,
          description: sample.description,
          assignedTo: sample.createdBy,
          priority: sample.priority,
          dueDate: dueDate.toISOString(),
        });
      } catch (error: any) {
        console.warn('Error creating demo task:', error);
      }
    }

    await AsyncStorage.setItem(FLAG, 'done');
  } catch (error) {
    console.warn('Demo data seeding failed (non-critical):', error);
    // Don't throw - seeding is optional
  }
};
