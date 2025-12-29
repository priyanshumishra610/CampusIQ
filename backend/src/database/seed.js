const pool = require('./connection');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Seeding database...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test users
    const users = [
      {
        email: 'admin@campusiq.edu',
        password_hash: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        admin_role: 'SUPER_ADMIN',
        department: 'Administration',
      },
      {
        email: 'faculty@campusiq.edu',
        password_hash: hashedPassword,
        name: 'Faculty User',
        role: 'FACULTY',
        department: 'Computer Science',
        faculty_id: 'FAC001',
        employee_id: 'EMP001',
      },
      {
        email: 'student@campusiq.edu',
        password_hash: hashedPassword,
        name: 'Student User',
        role: 'STUDENT',
        department: 'Computer Science',
        student_id: 'STU001',
        enrollment_number: 'ENR001',
      },
      {
        email: 'support@campusiq.edu',
        password_hash: hashedPassword,
        name: 'Support Staff',
        role: 'SUPPORT',
        department: 'IT Support',
      },
      {
        email: 'security@campusiq.edu',
        password_hash: hashedPassword,
        name: 'Security Officer',
        role: 'SECURITY',
        department: 'Security',
      },
    ];
    
    for (const user of users) {
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role, admin_role, department, faculty_id, employee_id, student_id, enrollment_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.email,
          user.password_hash,
          user.name,
          user.role,
          user.admin_role || null,
          user.department || null,
          user.faculty_id || null,
          user.employee_id || null,
          user.student_id || null,
          user.enrollment_number || null,
        ]
      );
    }
    
    console.log('Database seeded successfully!');
    console.log('Test users created:');
    console.log('- admin@campusiq.edu / password123');
    console.log('- faculty@campusiq.edu / password123');
    console.log('- student@campusiq.edu / password123');
    console.log('- support@campusiq.edu / password123');
    console.log('- security@campusiq.edu / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

