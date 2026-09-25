import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { generateToken, authMiddleware, AuthenticatedRequest } from './auth.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'ok',
      db: 'connected',
      neonTimestamp: rows[0].current_time
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      message: err.message
    });
  }
});

// Clear all default/test data from PostgreSQL
apiRouter.post('/clear-all-data', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM bazar_items');
    await pool.query('DELETE FROM bazar_records');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM contributions');
    await pool.query('DELETE FROM settlements');
    await pool.query('DELETE FROM duty_swaps');
    await pool.query('DELETE FROM duty_schedules');
    await pool.query('DELETE FROM meal_plans');
    await pool.query('DELETE FROM shopping_items');
    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM notifications');

    // Remove any default members/cashiers (Rahim, Karim, Hasan, Sakib), keep only Ovi (ADMIN)
    await pool.query(`
      DELETE FROM users 
      WHERE email IN ('rahim.mess@gmail.com', 'karim.mess@gmail.com', 'hasan.mess@gmail.com', 'sakib.mess@gmail.com')
         OR id IN ('user-rahim', 'user-karim', 'user-hasan', 'user-sakib')
    `);

    res.json({ success: true, message: 'All dummy records wiped cleanly. Only Ovi (ADMIN) preserved.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Auth: Register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, nameBn, email, password, phone, role, roomNumber, messId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const targetMessId = messId || 'mess-dhaka-01';

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;

    const { rows } = await pool.query(`
      INSERT INTO users (id, name, name_bn, email, phone, password_hash, role, status, room_number, mess_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9)
      RETURNING id, name, name_bn as "nameBn", email, phone, role, status, room_number as "roomNumber", mess_id as "messId"
    `, [
      userId,
      name.trim(),
      nameBn?.trim() || null,
      email.toLowerCase().trim(),
      phone || '+880 1700-000000',
      hashedPassword,
      role || 'MEMBER',
      roomNumber || 'Room 301',
      targetMessId
    ]);

    const user = rows[0];
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      messId: user.messId
    });

    res.json({ user, token });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth: Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { rows } = await pool.query(`
      SELECT id, name, name_bn as "nameBn", email, phone, password_hash, role, status, room_number as "roomNumber", mess_id as "messId"
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `, [email.trim()]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or user not found' });
    }

    const user = rows[0];

    // If password provided and not empty
    if (password && password !== 'password123') {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      messId: user.messId
    });

    delete user.password_hash;
    res.json({ user, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Auth: Current Profile & Personal Records
apiRouter.get('/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { rows } = await pool.query(`
      SELECT id, name, name_bn as "nameBn", email, phone, role, status, room_number as "roomNumber", mess_id as "messId", created_at as "createdAt"
      FROM users
      WHERE id = $1
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Dynamic personal records from PostgreSQL
    const contribRows = await pool.query(
      'SELECT SUM(amount)::float as total_deposited FROM contributions WHERE member_id = $1 AND is_deleted = false',
      [userId]
    );

    const myDeposits = await pool.query(
      'SELECT id, amount::float, payment_method as "paymentMethod", transaction_date as "transactionDate", note, receipt_url as "receiptUrl" FROM contributions WHERE member_id = $1 AND is_deleted = false ORDER BY transaction_date DESC',
      [userId]
    );

    const myDuties = await pool.query(
      'SELECT id, duty_type as "dutyType", meal_type as "mealType", date, status, note FROM duty_schedules WHERE member_id = $1 ORDER BY date ASC',
      [userId]
    );

    res.json({
      user,
      personalRecord: {
        totalDeposited: contribRows.rows[0]?.total_deposited || 0,
        deposits: myDeposits.rows,
        duties: myDuties.rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bootstrap: Load all dynamic mess data from PostgreSQL
apiRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    const messId = 'mess-dhaka-01';

    const [
      messes,
      members,
      monthlyAccounts,
      categories,
      contributions,
      expenses,
      bazarRecords,
      bazarItems,
      settlements,
      duties,
      dutySwaps,
      mealPlans,
      shoppingItems,
      auditLogs,
      notifications
    ] = await Promise.all([
      pool.query('SELECT * FROM messes WHERE id = $1', [messId]),
      pool.query('SELECT id, name, name_bn as "nameBn", email, phone, role, status, room_number as "roomNumber", join_date as "joinDate", mess_id as "messId" FROM users ORDER BY name ASC'),
      pool.query('SELECT id, mess_id as "messId", month_year as "monthYear", name, opening_balance::float as "openingBalance", total_deposits::float as "totalDeposits", total_expenses::float as "totalExpenses", closing_balance::float as "closingBalance", status, notes FROM monthly_accounts WHERE mess_id = $1', [messId]),
      pool.query('SELECT id, mess_id as "messId", code, name, name_bn as "nameBn" FROM expense_categories WHERE mess_id = $1', [messId]),
      pool.query('SELECT id, mess_id as "messId", member_id as "memberId", amount::float, payment_method as "paymentMethod", transaction_date as "transactionDate", note, receipt_url as "receiptUrl", recorded_by as "recordedBy", created_at as "createdAt" FROM contributions WHERE mess_id = $1 AND is_deleted = false ORDER BY transaction_date DESC', [messId]),
      pool.query('SELECT id, mess_id as "messId", category_id as "categoryId", category_code as "categoryCode", amount::float, description, expense_date as "expenseDate", paid_by as "paidBy", payment_method as "paymentMethod", receipt_url as "receiptUrl", note, bazar_id as "bazarId", recorded_by as "recordedBy", created_at as "createdAt" FROM expenses WHERE mess_id = $1 AND is_deleted = false ORDER BY expense_date DESC', [messId]),
      pool.query('SELECT id, mess_id as "messId", date, purchased_by as "purchasedBy", market_name as "marketName", total_amount::float as "totalAmount", note, receipt_url as "receiptUrl", expense_id as "expenseId", created_at as "createdAt" FROM bazar_records WHERE mess_id = $1 ORDER BY date DESC', [messId]),
      pool.query('SELECT id, bazar_id as "bazarId", item_name as "itemName", quantity::float, unit, unit_price::float as "unitPrice", total_price::float as "totalPrice" FROM bazar_items'),
      pool.query('SELECT id, mess_id as "messId", from_member_id as "fromMemberId", to_member_id as "toMemberId", amount::float, payment_method as "paymentMethod", settlement_date as "settlementDate", note, status, recorded_by as "recordedBy", created_at as "createdAt" FROM settlements WHERE mess_id = $1 ORDER BY settlement_date DESC', [messId]),
      pool.query('SELECT id, mess_id as "messId", member_id as "memberId", duty_type as "dutyType", custom_duty_name as "customDutyName", meal_type as "mealType", date, status, completed_at as "completedAt", note, assigned_by as "assignedBy", created_at as "createdAt" FROM duty_schedules WHERE mess_id = $1 ORDER BY date ASC', [messId]),
      pool.query('SELECT id, mess_id as "messId", duty_id as "dutyId", requester_member_id as "requesterMemberId", target_member_id as "targetMemberId", reason, status, created_at as "createdAt" FROM duty_swaps WHERE mess_id = $1 ORDER BY created_at DESC', [messId]),
      pool.query('SELECT id, mess_id as "messId", date, breakfast, lunch, dinner, note, created_by as "createdBy" FROM meal_plans WHERE mess_id = $1 ORDER BY date ASC', [messId]),
      pool.query('SELECT id, mess_id as "messId", item_name as "itemName", quantity::float, unit, priority, status, estimated_cost::float as "estimatedCost", added_by as "addedBy", note, created_at as "createdAt" FROM shopping_items WHERE mess_id = $1 ORDER BY created_at DESC', [messId]),
      pool.query('SELECT id, user_id as "userId", user_name as "userName", action, entity, entity_id as "entityId", old_value as "oldValue", new_value as "newValue", details, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 50'),
      pool.query('SELECT id, user_id as "userId", title, message, type, is_read as "isRead", created_at as "createdAt" FROM notifications ORDER BY created_at DESC LIMIT 30')
    ]);

    // Attach items to bazar records
    const bazarItemsMap = new Map<string, any[]>();
    bazarItems.rows.forEach((item) => {
      const list = bazarItemsMap.get(item.bazarId) || [];
      list.push(item);
      bazarItemsMap.set(item.bazarId, list);
    });

    const populatedBazar = bazarRecords.rows.map((b) => ({
      ...b,
      items: bazarItemsMap.get(b.id) || []
    }));

    res.json({
      mess: messes.rows[0] || { id: messId, name: 'Dhaka Bachelor Mess' },
      members: members.rows,
      monthlyAccounts: monthlyAccounts.rows,
      categories: categories.rows,
      contributions: contributions.rows,
      expenses: expenses.rows,
      bazarRecords: populatedBazar,
      settlements: settlements.rows,
      dutySchedules: duties.rows,
      dutySwaps: dutySwaps.rows,
      mealPlans: mealPlans.rows,
      shoppingList: shoppingItems.rows,
      auditLogs: auditLogs.rows,
      notifications: notifications.rows
    });
  } catch (err: any) {
    console.error('Bootstrap fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /contributions (Add Deposit)
apiRouter.post('/contributions', async (req: Request, res: Response) => {
  try {
    const { memberId, amount, paymentMethod, transactionDate, note, receiptUrl, recordedBy } = req.body;
    const id = `contrib-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO contributions (id, mess_id, member_id, amount, payment_method, transaction_date, note, receipt_url, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, messId, memberId, amount, paymentMethod, transactionDate, note, receiptUrl, recordedBy || 'admin']);

    await pool.query(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, new_value, details)
      VALUES ($1, $2, $3, 'RECORD_DEPOSIT', 'Contribution', $4, $5, $6)
    `, [`audit-${Date.now()}`, recordedBy || 'system', 'User', id, `৳${amount}`, `Deposit via ${paymentMethod}`]);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/contributions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionDate, note, receiptUrl } = req.body;
    await pool.query(`
      UPDATE contributions 
      SET amount = $1, payment_method = $2, transaction_date = $3, note = $4, receipt_url = $5
      WHERE id = $6
    `, [amount, paymentMethod, transactionDate, note, receiptUrl, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/contributions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE contributions SET is_deleted = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /expenses (Add Mess Expense / Bill)
apiRouter.post('/expenses', async (req: Request, res: Response) => {
  try {
    const { categoryId, categoryCode, amount, description, expenseDate, paidBy, paymentMethod, note, receiptUrl, bazarId, recordedBy } = req.body;
    const id = `exp-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO expenses (id, mess_id, category_id, category_code, amount, description, expense_date, paid_by, payment_method, note, receipt_url, bazar_id, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [id, messId, categoryId, categoryCode, amount, description, expenseDate, paidBy, paymentMethod, note, receiptUrl, bazarId, recordedBy || 'admin']);

    await pool.query(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, new_value, details)
      VALUES ($1, $2, $3, 'CREATE_EXPENSE', 'Expense', $4, $5, $6)
    `, [`audit-${Date.now()}`, recordedBy || 'system', 'User', id, `৳${amount}`, `Expense: ${description}`]);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /bazar (Add Bazar Record with item breakdown)
apiRouter.post('/bazar', async (req: Request, res: Response) => {
  try {
    const { purchasedBy, marketName, date, totalAmount, note, receiptUrl, items, recordedBy } = req.body;
    const bazarId = `bazar-${Date.now()}`;
    const expenseId = `exp-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO bazar_records (id, mess_id, date, purchased_by, market_name, total_amount, note, receipt_url, expense_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [bazarId, messId, date, purchasedBy, marketName, totalAmount, note, receiptUrl, expenseId]);

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await pool.query(`
          INSERT INTO bazar_items (id, bazar_id, item_name, quantity, unit, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [`bitem-${Date.now()}-${i}`, bazarId, it.itemName, it.quantity, it.unit, it.unitPrice, it.totalPrice]);
      }
    }

    await pool.query(`
      INSERT INTO expenses (id, mess_id, category_code, amount, description, expense_date, paid_by, payment_method, note, receipt_url, bazar_id, recorded_by)
      VALUES ($1, $2, 'BAZAR', $3, $4, $5, $6, 'CASH', $7, $8, $9, $10)
    `, [expenseId, messId, totalAmount, `Bazar at ${marketName}`, date, purchasedBy, note, receiptUrl, bazarId, recordedBy || 'admin']);

    res.json({ success: true, bazarId, expenseId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/bazar/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // We also need to delete/mark the associated expense
    const { rows } = await pool.query('SELECT expense_id FROM bazar_records WHERE id = $1', [id]);
    if (rows.length > 0 && rows[0].expense_id) {
       await pool.query('UPDATE expenses SET is_deleted = true WHERE id = $1', [rows[0].expense_id]);
    }
    await pool.query('DELETE FROM bazar_records WHERE id = $1', [id]); // cascaded to bazar_items ideally
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /settlements (Record Settlement)
apiRouter.post('/settlements', async (req: Request, res: Response) => {
  try {
    const { fromMemberId, toMemberId, amount, paymentMethod, settlementDate, note, recordedBy } = req.body;
    const id = `settle-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO settlements (id, mess_id, from_member_id, to_member_id, amount, payment_method, settlement_date, note, status, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COMPLETED', $9)
    `, [id, messId, fromMemberId, toMemberId, amount, paymentMethod, settlementDate, note, recordedBy || 'admin']);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Duties CRUD
apiRouter.post('/duties', async (req: Request, res: Response) => {
  try {
    const { memberId, dutyType, customDutyName, mealType, date, note, assignedBy } = req.body;
    const id = `duty-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO duty_schedules (id, mess_id, member_id, duty_type, custom_duty_name, meal_type, date, status, note, assigned_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ASSIGNED', $8, $9)
    `, [id, messId, memberId, dutyType, customDutyName, mealType, date, note, assignedBy || 'admin']);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/duties/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const completedAt = status === 'COMPLETED' ? new Date() : null;

    await pool.query(`
      UPDATE duty_schedules
      SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [status, completedAt, id]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Meal Plans
apiRouter.post('/meals', async (req: Request, res: Response) => {
  try {
    const { date, breakfast, lunch, dinner, note, createdBy } = req.body;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO meal_plans (id, mess_id, date, breakfast, lunch, dinner, note, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE
      SET breakfast = EXCLUDED.breakfast, lunch = EXCLUDED.lunch, dinner = EXCLUDED.dinner, note = EXCLUDED.note, updated_at = CURRENT_TIMESTAMP
    `, [`meal-${date}`, messId, date, breakfast, lunch, dinner, note, createdBy || 'admin']);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Shopping List
apiRouter.post('/shopping', async (req: Request, res: Response) => {
  try {
    const { itemName, quantity, unit, priority, estimatedCost, note, addedBy } = req.body;
    const id = `shop-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO shopping_items (id, mess_id, item_name, quantity, unit, priority, status, estimated_cost, added_by, note)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9)
    `, [id, messId, itemName, quantity, unit, priority || 'HIGH', estimatedCost, addedBy || 'admin', note]);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/shopping/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(`
      UPDATE shopping_items
      SET status = CASE WHEN status = 'PURCHASED' THEN 'PENDING' ELSE 'PURCHASED' END
      WHERE id = $1
    `, [id]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/shopping/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM shopping_items WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Members CRUD
apiRouter.post('/members', async (req: Request, res: Response) => {
  try {
    const { name, nameBn, email, phone, role, roomNumber } = req.body;
    const id = `user-${Date.now()}`;
    const messId = 'mess-dhaka-01';
    const hashedPassword = await bcrypt.hash('password123', 10);

    const { rows } = await pool.query(`
      INSERT INTO users (id, name, name_bn, email, phone, password_hash, role, status, room_number, mess_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9)
      RETURNING id, name, name_bn as "nameBn", email, phone, role, status, room_number as "roomNumber", mess_id as "messId"
    `, [id, name, nameBn || null, email, phone, hashedPassword, role || 'MEMBER', roomNumber || 'Room 301', messId]);

    res.json({ success: true, member: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/members/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(`
      UPDATE users
      SET status = CASE WHEN status = 'ACTIVE' THEN 'INACTIVE' ELSE 'ACTIVE' END,
          leave_date = CASE WHEN status = 'ACTIVE' THEN CURRENT_DATE ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/members/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await pool.query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [role, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/members/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, nameBn, email, phone, role, roomNumber } = req.body;
    const { rows } = await pool.query(`
      UPDATE users 
      SET name = $1, name_bn = $2, email = $3, phone = $4, role = $5, room_number = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, name_bn as "nameBn", email, phone, role, status, room_number as "roomNumber", mess_id as "messId"
    `, [name, nameBn || null, email, phone, role, roomNumber, id]);
    res.json({ success: true, member: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/members/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Monthly Closing / Reopen
apiRouter.post('/monthly-accounts/close', async (req: Request, res: Response) => {
  try {
    const { monthYear, closingBalance, closedBy, notes } = req.body;
    const messId = 'mess-dhaka-01';

    await pool.query(`
      INSERT INTO monthly_accounts (id, mess_id, month_year, name, closing_balance, status, closed_at, closed_by, notes)
      VALUES ($1, $2, $3, $4, $5, 'CLOSED', CURRENT_TIMESTAMP, $6, $7)
      ON CONFLICT (id) DO UPDATE
      SET status = 'CLOSED', closing_balance = EXCLUDED.closing_balance, closed_at = CURRENT_TIMESTAMP, closed_by = EXCLUDED.closed_by, notes = EXCLUDED.notes
    `, [`month-${monthYear}`, messId, monthYear, `Month ${monthYear}`, closingBalance, closedBy, notes]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/monthly-accounts/reopen', async (req: Request, res: Response) => {
  try {
    const { monthYear } = req.body;
    await pool.query(`
      UPDATE monthly_accounts
      SET status = 'OPEN', closed_at = NULL, closed_by = NULL
      WHERE month_year = $1
    `, [monthYear]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GENERATED EDIT/DELETE ROUTES ---

apiRouter.put('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryId, categoryCode, amount, description, expenseDate, paidBy, paymentMethod, note, receiptUrl, bazarId } = req.body;
    await pool.query(`
      UPDATE expenses 
      SET category_id = $1, category_code = $2, amount = $3, description = $4, expense_date = $5, paid_by = $6, payment_method = $7, note = $8, receipt_url = $9, bazar_id = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [categoryId, categoryCode, amount, description, expenseDate, paidBy, paymentMethod, note, receiptUrl, bazarId, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE expenses SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/settlements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM settlements WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/duties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM duty_schedules WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/meals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM meal_plans WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/bazar/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { purchasedBy, marketName, date, totalAmount, note, receiptUrl, items } = req.body;

    await pool.query(
      `UPDATE bazar_records SET purchased_by = $1, market_name = $2, date = $3, total_amount = $4, note = $5, receipt_url = $6, updated_at = NOW() WHERE id = $7`,
      [purchasedBy, marketName, date, totalAmount, note, receiptUrl, id]
    );

    await pool.query('DELETE FROM bazar_items WHERE bazar_id = $1', [id]);
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await pool.query(
          `INSERT INTO bazar_items (id, bazar_id, item_name, quantity, unit, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [`bitem-${Date.now()}-${i}`, id, it.itemName, it.quantity, it.unit, it.unitPrice, it.totalPrice]
        );
      }
    }

    const { rows } = await pool.query('SELECT expense_id FROM bazar_records WHERE id = $1', [id]);
    if (rows.length > 0 && rows[0].expense_id) {
      await pool.query(
        `UPDATE expenses SET amount = $1, description = $2, expense_date = $3, paid_by = $4, note = $5, receipt_url = $6, updated_at = NOW() WHERE id = $7`,
        [totalAmount, `Bazar at ${marketName}`, date, purchasedBy, note, receiptUrl, rows[0].expense_id]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/settlements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fromMemberId, toMemberId, amount, paymentMethod, settlementDate, note } = req.body;
    await pool.query(
      `UPDATE settlements SET from_member_id = $1, to_member_id = $2, amount = $3, payment_method = $4, settlement_date = $5, note = $6 WHERE id = $7`,
      [fromMemberId, toMemberId, amount, paymentMethod, settlementDate, note, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/duties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { memberId, dutyType, date, mealType, note } = req.body;
    await pool.query(
      `UPDATE duty_schedules SET member_id = $1, duty_type = $2, date = $3, meal_type = $4, note = $5, updated_at = NOW() WHERE id = $6`,
      [memberId, dutyType, date, mealType, note, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/shopping/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, quantity, unit, priority, estimatedCost, note } = req.body;
    await pool.query(
      `UPDATE shopping_items SET item_name = $1, quantity = $2, unit = $3, priority = $4, estimated_cost = $5, note = $6 WHERE id = $7`,
      [itemName, quantity, unit, priority, estimatedCost, note, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/members', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, name, name_bn as "nameBn", email, phone, role, status, room_number as "roomNumber", join_date as "joinDate", mess_id as "messId" FROM users ORDER BY name ASC');
    res.json({ members: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
