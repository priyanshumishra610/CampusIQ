const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.error('Migration error:', error.message);
            console.error('Statement:', statement.substring(0, 100));
          }
        }
      }
    }
    
    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

