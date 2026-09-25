import { pool } from './db.js';

async function reset() {
  console.log('Resetting monthly_accounts to 0...');
  try {
    await pool.query(`
      UPDATE monthly_accounts
      SET opening_balance = 0,
          total_deposits = 0,
          total_expenses = 0,
          closing_balance = 0,
          total_settlements = 0,
          total_receivables = 0,
          total_payables = 0;
    `);
    console.log('Successfully reset monthly_accounts values to 0.');
  } catch (err) {
    console.error('Error resetting monthly_accounts:', err);
  } finally {
    process.exit(0);
  }
}

reset();
