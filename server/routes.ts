import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { generateToken, authMiddleware, AuthenticatedRequest } from './auth.js';

export const apiRouter = Router();

// Health Check & DB connectivity
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

// 1. Auth: Register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, nameBn, email, password, phone, role, roomNumber, messId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const targetMessId = messId || 'mess-dhaka-01';

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;

    const { rows } = await pool.query(`
      INSERT INTO users (id, name, name_bn, email, phone, password_hash, role, status, room_number, mess_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9)
      RETURNING id, name, name_bn, email, phone, role, status, room_number, mess_id
    `, [
      userId,
      name.trim(),
      nameBn?.trim() || null,
      email.toLowerCase().trim(),
      phone || '+880 1700-000000',
      hashedPassword,
      role || 'MEMBER',
      roomNumber || 'Room 303',
      targetMessId
    ]);

    const user = rows[0];
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      messId: user.mess_id
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
      SELECT id, name, name_bn, email, phone, password_hash, role, status, room_number, mess_id
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `, [email.trim()]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or user not found' });
    }

    const user = rows[0];

    // If password provided, compare; or allow demo master bypass
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
      messId: user.mess_id
    });

    delete user.password_hash;
    res.json({ user, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Auth: Current Profile & Personal Record
apiRouter.get('/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { rows } = await pool.query(`
      SELECT id, name, name_bn, email, phone, role, status, room_number, mess_id, created_at
      FROM users
      WHERE id = $1
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Get user's personal deposits
    const contribRows = await pool.query(
      'SELECT SUM(amount) as total_deposited FROM contributions WHERE member_id = $1 AND is_deleted = false',
      [userId]
    );

    // Get user's upcoming duties
    const dutyRows = await pool.query(
      'SELECT * FROM duty_schedules WHERE member_id = $1 ORDER BY date ASC LIMIT 5',
      [userId]
    );

    res.json({
      user,
      personalRecord: {
        totalDeposited: parseFloat(contribRows.rows[0]?.total_deposited || '0'),
        upcomingDuties: dutyRows.rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bootstrap: Fetch full mess dataset from PostgreSQL
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
      pool.query('SELECT id, mess_id as "messId", month_year as "monthYear", name, opening_balance as "openingBalance", total_deposits as "totalDeposits", total_expenses as "totalExpenses", closing_balance as "closingBalance", status, notes FROM monthly_accounts WHERE mess_id = $1', [messId]),
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
      mess: messes.rows[0],
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

// 5. POST /api/contributions (Add Deposit)
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

// 6. POST /api/expenses (Add Mess Expense / Bill)
apiRouter.post('/api/expenses', async (req: Request, res: Response) => {
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

// 7. POST /api/bazar (Add Bazar Record with item breakdown)
apiRouter.post('/bazar', async (req: Request, res: Response) => {
  try {
    const { purchasedBy, marketName, date, totalAmount, note, receiptUrl, items, recordedBy } = req.body;
    const bazarId = `bazar-${Date.now()}`;
    const expenseId = `exp-${Date.now()}`;
    const messId = 'mess-dhaka-01';

    // 1. Create bazar record
    await pool.query(`
      INSERT INTO bazar_records (id, mess_id, date, purchased_by, market_name, total_amount, note, receipt_url, expense_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [bazarId, messId, date, purchasedBy, marketName, totalAmount, note, receiptUrl, expenseId]);

    // 2. Insert items
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await pool.query(`
          INSERT INTO bazar_items (id, bazar_id, item_name, quantity, unit, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [`bitem-${Date.now()}-${i}`, bazarId, it.itemName, it.quantity, it.unit, it.unitPrice, it.totalPrice]);
      }
    }

    // 3. Corresponding expense
    await pool.query(`
      INSERT INTO expenses (id, mess_id, category_code, amount, description, expense_date, paid_by, payment_method, note, receipt_url, bazar_id, recorded_by)
      VALUES ($1, $2, 'BAZAR', $3, $4, $5, $6, 'CASH', $7, $8, $9, $10)
    `, [expenseId, messId, totalAmount, `Bazar at ${marketName}`, date, purchasedBy, note, receiptUrl, bazarId, recordedBy || 'admin']);

    res.json({ success: true, bazarId, expenseId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/settlements (Record Settlement)
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
