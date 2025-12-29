const pool = require('./connection');

// Indian holidays - Fixed dates
const fixedHolidays = [
  { name: 'Republic Day', date: '2024-01-26', type: 'NATIONAL', description: 'Republic Day of India', is_recurring: true, recurring_month: 1, recurring_day: 26 },
  { name: 'Independence Day', date: '2024-08-15', type: 'NATIONAL', description: 'Independence Day of India', is_recurring: true, recurring_month: 8, recurring_day: 15 },
  { name: 'Gandhi Jayanti', date: '2024-10-02', type: 'NATIONAL', description: 'Birthday of Mahatma Gandhi', is_recurring: true, recurring_month: 10, recurring_day: 2 },
  { name: 'Christmas', date: '2024-12-25', type: 'RELIGIOUS', description: 'Christmas Day', is_recurring: true, recurring_month: 12, recurring_day: 25 },
];

// Variable holidays for 2024-2025 (Islamic calendar based and other variable dates)
// Note: These need to be updated annually as dates vary
const variableHolidays2024 = [
  { name: 'Maha Shivaratri', date: '2024-03-08', type: 'RELIGIOUS', description: 'Maha Shivaratri', is_recurring: false, year: 2024 },
  { name: 'Holi', date: '2024-03-25', type: 'FESTIVAL', description: 'Holi - Festival of Colors', is_recurring: false, year: 2024 },
  { name: 'Good Friday', date: '2024-03-29', type: 'RELIGIOUS', description: 'Good Friday', is_recurring: false, year: 2024 },
  { name: 'Ram Navami', date: '2024-04-17', type: 'RELIGIOUS', description: 'Ram Navami', is_recurring: false, year: 2024 },
  { name: 'Eid-ul-Fitr', date: '2024-04-11', type: 'RELIGIOUS', description: 'Eid-ul-Fitr', is_recurring: false, year: 2024 },
  { name: 'Buddha Purnima', date: '2024-05-23', type: 'RELIGIOUS', description: 'Buddha Purnima', is_recurring: false, year: 2024 },
  { name: 'Eid-ul-Adha (Bakrid)', date: '2024-06-17', type: 'RELIGIOUS', description: 'Eid-ul-Adha (Bakrid)', is_recurring: false, year: 2024 },
  { name: 'Muharram', date: '2024-07-17', type: 'RELIGIOUS', description: 'Muharram', is_recurring: false, year: 2024 },
  { name: 'Dussehra', date: '2024-10-12', type: 'FESTIVAL', description: 'Dussehra - Vijayadashami', is_recurring: false, year: 2024 },
  { name: 'Diwali', date: '2024-11-01', type: 'FESTIVAL', description: 'Diwali - Festival of Lights', is_recurring: false, year: 2024 },
  { name: 'Guru Nanak Jayanti', date: '2024-11-15', type: 'RELIGIOUS', description: 'Guru Nanak Jayanti', is_recurring: false, year: 2024 },
];

const variableHolidays2025 = [
  { name: 'Maha Shivaratri', date: '2025-02-26', type: 'RELIGIOUS', description: 'Maha Shivaratri', is_recurring: false, year: 2025 },
  { name: 'Holi', date: '2025-03-14', type: 'FESTIVAL', description: 'Holi - Festival of Colors', is_recurring: false, year: 2025 },
  { name: 'Good Friday', date: '2025-04-18', type: 'RELIGIOUS', description: 'Good Friday', is_recurring: false, year: 2025 },
  { name: 'Ram Navami', date: '2025-04-06', type: 'RELIGIOUS', description: 'Ram Navami', is_recurring: false, year: 2025 },
  { name: 'Eid-ul-Fitr', date: '2025-03-31', type: 'RELIGIOUS', description: 'Eid-ul-Fitr', is_recurring: false, year: 2025 },
  { name: 'Buddha Purnima', date: '2025-05-12', type: 'RELIGIOUS', description: 'Buddha Purnima', is_recurring: false, year: 2025 },
  { name: 'Eid-ul-Adha (Bakrid)', date: '2025-06-07', type: 'RELIGIOUS', description: 'Eid-ul-Adha (Bakrid)', is_recurring: false, year: 2025 },
  { name: 'Muharram', date: '2025-07-06', type: 'RELIGIOUS', description: 'Muharram', is_recurring: false, year: 2025 },
  { name: 'Dussehra', date: '2025-10-02', type: 'FESTIVAL', description: 'Dussehra - Vijayadashami', is_recurring: false, year: 2025 },
  { name: 'Diwali', date: '2025-10-20', type: 'FESTIVAL', description: 'Diwali - Festival of Lights', is_recurring: false, year: 2025 },
  { name: 'Guru Nanak Jayanti', date: '2025-11-05', type: 'RELIGIOUS', description: 'Guru Nanak Jayanti', is_recurring: false, year: 2025 },
];

async function seedHolidays() {
  try {
    console.log('Seeding holidays...');

    // Insert fixed recurring holidays for current and next year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    for (const holiday of fixedHolidays) {
      // Insert for current year
      await pool.query(
        `INSERT INTO holidays (name, date, type, description, is_recurring, recurring_month, recurring_day, year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (date, name) DO NOTHING`,
        [
          holiday.name,
          holiday.date.replace('2024', currentYear.toString()),
          holiday.type,
          holiday.description,
          holiday.is_recurring,
          holiday.recurring_month,
          holiday.recurring_day,
          currentYear,
        ]
      );

      // Insert for next year
      await pool.query(
        `INSERT INTO holidays (name, date, type, description, is_recurring, recurring_month, recurring_day, year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (date, name) DO NOTHING`,
        [
          holiday.name,
          holiday.date.replace('2024', nextYear.toString()),
          holiday.type,
          holiday.description,
          holiday.is_recurring,
          holiday.recurring_month,
          holiday.recurring_day,
          nextYear,
        ]
      );
    }

    // Insert variable holidays for current year
    const currentYearHolidays = currentYear === 2024 ? variableHolidays2024 : variableHolidays2025;
    for (const holiday of currentYearHolidays) {
      await pool.query(
        `INSERT INTO holidays (name, date, type, description, is_recurring, year)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (date, name) DO NOTHING`,
        [
          holiday.name,
          holiday.date,
          holiday.type,
          holiday.description,
          holiday.is_recurring,
          holiday.year,
        ]
      );
    }

    // Insert variable holidays for next year
    const nextYearHolidays = nextYear === 2024 ? variableHolidays2024 : variableHolidays2025;
    for (const holiday of nextYearHolidays) {
      // Update year in date
      const dateParts = holiday.date.split('-');
      dateParts[0] = nextYear.toString();
      const updatedDate = dateParts.join('-');

      await pool.query(
        `INSERT INTO holidays (name, date, type, description, is_recurring, year)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (date, name) DO NOTHING`,
        [
          holiday.name,
          updatedDate,
          holiday.type,
          holiday.description,
          holiday.is_recurring,
          nextYear,
        ]
      );
    }

    console.log('Holidays seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding holidays failed:', error);
    process.exit(1);
  }
}

seedHolidays();

