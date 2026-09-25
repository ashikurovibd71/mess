import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_Cjy4pkHfz8sX@ep-frosty-frost-b4daq16y-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export async function initDb() {
  console.log('Connecting to PostgreSQL database at Neon...');
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connection established successfully.');

    // 1. Create tables schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS messes (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        description TEXT,
        created_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_bn VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(64),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        room_number VARCHAR(64),
        join_date DATE DEFAULT CURRENT_DATE,
        leave_date DATE,
        profile_image TEXT,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monthly_accounts (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        month_year VARCHAR(16) NOT NULL,
        name VARCHAR(128) NOT NULL,
        opening_balance NUMERIC(12,2) DEFAULT 0,
        total_deposits NUMERIC(12,2) DEFAULT 0,
        total_expenses NUMERIC(12,2) DEFAULT 0,
        total_settlements NUMERIC(12,2) DEFAULT 0,
        total_receivables NUMERIC(12,2) DEFAULT 0,
        total_payables NUMERIC(12,2) DEFAULT 0,
        closing_balance NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(32) DEFAULT 'OPEN',
        closed_at TIMESTAMP WITH TIME ZONE,
        closed_by VARCHAR(64),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS expense_categories (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        name_bn VARCHAR(128),
        is_custom BOOLEAN DEFAULT FALSE,
        icon VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS contributions (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        member_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        payment_method VARCHAR(64) NOT NULL,
        transaction_date DATE NOT NULL,
        note TEXT,
        receipt_url TEXT,
        recorded_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        category_id VARCHAR(64) REFERENCES expense_categories(id) ON DELETE SET NULL,
        category_code VARCHAR(64) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        description TEXT NOT NULL,
        expense_date DATE NOT NULL,
        paid_by VARCHAR(64),
        payment_method VARCHAR(64) NOT NULL,
        receipt_url TEXT,
        note TEXT,
        bazar_id VARCHAR(64),
        recorded_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS bazar_records (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        purchased_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        market_name VARCHAR(255) NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL,
        note TEXT,
        receipt_url TEXT,
        expense_id VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bazar_items (
        id VARCHAR(64) PRIMARY KEY,
        bazar_id VARCHAR(64) REFERENCES bazar_records(id) ON DELETE CASCADE,
        item_name VARCHAR(255) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL,
        total_price NUMERIC(12,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settlements (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        from_member_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        to_member_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        payment_method VARCHAR(64) NOT NULL,
        settlement_date DATE NOT NULL,
        note TEXT,
        status VARCHAR(32) DEFAULT 'COMPLETED',
        recorded_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS duty_schedules (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        member_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        duty_type VARCHAR(64) NOT NULL,
        custom_duty_name VARCHAR(128),
        meal_type VARCHAR(64),
        date DATE NOT NULL,
        status VARCHAR(32) DEFAULT 'ASSIGNED',
        completed_at TIMESTAMP WITH TIME ZONE,
        note TEXT,
        assigned_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS duty_swaps (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        duty_id VARCHAR(64) REFERENCES duty_schedules(id) ON DELETE CASCADE,
        requester_member_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        target_member_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(32) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_by VARCHAR(64),
        reviewed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS meal_plans (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        breakfast TEXT,
        lunch TEXT,
        dinner TEXT,
        note TEXT,
        created_by VARCHAR(64),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shopping_items (
        id VARCHAR(64) PRIMARY KEY,
        mess_id VARCHAR(64) REFERENCES messes(id) ON DELETE CASCADE,
        item_name VARCHAR(255) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        priority VARCHAR(32) DEFAULT 'HIGH',
        status VARCHAR(32) DEFAULT 'PENDING',
        estimated_cost NUMERIC(10,2),
        added_by VARCHAR(64),
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        user_name VARCHAR(255),
        action VARCHAR(64) NOT NULL,
        entity VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64),
        old_value TEXT,
        new_value TEXT,
        details TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(64) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Check and seed initial mess & users if empty
    const { rows: messRows } = await client.query('SELECT count(*) FROM messes');
    if (parseInt(messRows[0].count) === 0) {
      console.log('Seeding initial Mess and default user accounts...');
      const defaultMessId = 'mess-dhaka-01';

      await client.query(`
        INSERT INTO messes (id, name, address, description, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        defaultMessId,
        'Dhaka Bachelor Mess',
        'House 42, Road 9, Dhanmondi, Dhaka-1205',
        'Shared bachelor living apartment',
        'user-ovi'
      ]);

      const hashedPassword = await bcrypt.hash('password123', 10);

      // Default Users: Ovi (Admin), Rahim (Cashier), Karim, Hasan, Sakib
      const usersData = [
        ['user-ovi', 'Ovi', 'অভি', 'ashikurovi2003@gmail.com', '+880 1711-223344', hashedPassword, 'ADMIN', 'ACTIVE', 'Room 301', defaultMessId],
        ['user-rahim', 'Rahim', 'রহিম', 'rahim.mess@gmail.com', '+880 1811-223344', hashedPassword, 'CASHIER', 'ACTIVE', 'Room 302', defaultMessId],
        ['user-karim', 'Karim', 'করিম', 'karim.mess@gmail.com', '+880 1911-223344', hashedPassword, 'MEMBER', 'ACTIVE', 'Room 302', defaultMessId],
        ['user-hasan', 'Hasan', 'হাসান', 'hasan.mess@gmail.com', '+880 1511-223344', hashedPassword, 'MEMBER', 'ACTIVE', 'Room 303', defaultMessId],
        ['user-sakib', 'Sakib', 'সাকিব', 'sakib.mess@gmail.com', '+880 1611-223344', hashedPassword, 'MEMBER', 'ACTIVE', 'Room 303', defaultMessId]
      ];

      for (const u of usersData) {
        await client.query(`
          INSERT INTO users (id, name, name_bn, email, phone, password_hash, role, status, room_number, mess_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, u);
      }

      // Categories
      const categories = [
        ['cat-bazar', defaultMessId, 'BAZAR', 'Bazar / Grocery', 'বাজার খরচ'],
        ['cat-elec', defaultMessId, 'ELECTRICITY', 'Electricity Bill', 'বিদ্যুৎ বিল'],
        ['cat-gas', defaultMessId, 'GAS', 'Gas / Cylinder', 'গ্যাস বিল'],
        ['cat-water', defaultMessId, 'WATER', 'Water Supply', 'পানি বিল'],
        ['cat-net', defaultMessId, 'INTERNET', 'Internet / WiFi', 'ইন্টারনেট বিল'],
        ['cat-rent', defaultMessId, 'HOUSE_RENT', 'House Rent', 'বাড়ি ভাড়া'],
        ['cat-clean', defaultMessId, 'CLEANING', 'Cleaning & Maid', 'বুয়া ও পরিষ্কার'],
        ['cat-maint', defaultMessId, 'MAINTENANCE', 'Apartment Maintenance', 'মেরামত'],
        ['cat-food', defaultMessId, 'FOOD', 'Special Feast / Snacks', 'খাবার / নাস্তা'],
        ['cat-other', defaultMessId, 'OTHER', 'Other Mess Expenses', 'অন্যান্য খরচ']
      ];

      for (const cat of categories) {
        await client.query(`
          INSERT INTO expense_categories (id, mess_id, code, name, name_bn)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, cat);
      }

      // Monthly account for September 2026
      await client.query(`
        INSERT INTO monthly_accounts (id, mess_id, month_year, name, opening_balance, total_deposits, total_expenses, closing_balance, status)
        VALUES ('month-2026-09', $1, '2026-09', 'September 2026', 2000, 20000, 20000, 2000, 'OPEN')
        ON CONFLICT (id) DO NOTHING
      `, [defaultMessId]);

      // Seed deposits matching prompt: Ovi 5000, Rahim 3000, Karim 4000, Hasan 4500, Sakib 3500 = 20,000
      const deposits = [
        ['contrib-1', defaultMessId, 'user-ovi', 5000, 'BKASH', '2026-09-02', 'September advance deposit', 'user-rahim'],
        ['contrib-2', defaultMessId, 'user-rahim', 3000, 'CASH', '2026-09-03', 'Cash deposit to drawer', 'user-ovi'],
        ['contrib-3', defaultMessId, 'user-karim', 4000, 'NAGAD', '2026-09-04', 'Nagad deposit', 'user-rahim'],
        ['contrib-4', defaultMessId, 'user-hasan', 4500, 'BKASH', '2026-09-05', 'bKash deposit', 'user-rahim'],
        ['contrib-5', defaultMessId, 'user-sakib', 3500, 'CASH', '2026-09-05', 'Cash deposit', 'user-rahim']
      ];

      for (const d of deposits) {
        await client.query(`
          INSERT INTO contributions (id, mess_id, member_id, amount, payment_method, transaction_date, note, recorded_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, d);
      }

      // Seed expenses matching prompt: Bazar 12000, Electricity 2000, Gas 1000, Internet 1000, Other 4000 = 20,000
      const expenses = [
        ['exp-1', defaultMessId, 'cat-bazar', 'BAZAR', 1530, 'Weekly Fresh Bazar (Fish, Rice, Veggies, Eggs)', '2026-09-25', 'user-ovi', 'CASH', 'bazar-1', 'user-rahim'],
        ['exp-2', defaultMessId, 'cat-bazar', 'BAZAR', 4200, 'Major Monthly Staples (Rice sack, Lentils, Oil)', '2026-09-05', 'user-rahim', 'CASH', null, 'user-rahim'],
        ['exp-3', defaultMessId, 'cat-bazar', 'BAZAR', 3450, 'Weekly Bazar (Chicken, Beef, Potato, Onion)', '2026-09-12', 'user-karim', 'CASH', null, 'user-rahim'],
        ['exp-4', defaultMessId, 'cat-bazar', 'BAZAR', 2820, 'Mid-Month Bazar (Eggs, Rui Fish, Vegetables)', '2026-09-19', 'user-hasan', 'CASH', null, 'user-rahim'],
        ['exp-elec', defaultMessId, 'cat-elec', 'ELECTRICITY', 2000, 'DESCO Prepaid Electricity Meter Recharge', '2026-09-24', 'user-rahim', 'BKASH', null, 'user-rahim'],
        ['exp-gas', defaultMessId, 'cat-gas', 'GAS', 1000, 'Titas Gas Monthly Prepaid Smart Card Recharge', '2026-09-20', 'user-rahim', 'NAGAD', null, 'user-rahim'],
        ['exp-net', defaultMessId, 'cat-net', 'INTERNET', 1000, 'AmberIT 50 Mbps Fiber Broadband Monthly Bill', '2026-09-15', 'user-rahim', 'BKASH', null, 'user-rahim'],
        ['exp-other-maid', defaultMessId, 'cat-clean', 'CLEANING', 2500, 'Monthly House Maid Honorarium & Cooking Charge', '2026-09-07', 'user-rahim', 'CASH', null, 'user-rahim'],
        ['exp-other-water', defaultMessId, 'cat-other', 'OTHER', 1500, 'Pure Drinking Mineral Water Jars (10 Jars)', '2026-09-14', 'user-sakib', 'CASH', null, 'user-rahim']
      ];

      for (const e of expenses) {
        await client.query(`
          INSERT INTO expenses (id, mess_id, category_id, category_code, amount, description, expense_date, paid_by, payment_method, bazar_id, recorded_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, e);
      }

      // Seed Bazar record
      await client.query(`
        INSERT INTO bazar_records (id, mess_id, date, purchased_by, market_name, total_amount, note, expense_id)
        VALUES ('bazar-1', $1, '2026-09-25', 'user-ovi', 'Dhanmondi Raw Market', 1530, 'Fresh morning raw market purchase', 'exp-1')
        ON CONFLICT (id) DO NOTHING
      `, [defaultMessId]);

      const bazarItems = [
        ['bitem-1', 'bazar-1', 'Miniket Rice (মিনিকেট চাল)', 5, 'kg', 80, 400],
        ['bitem-2', 'bazar-1', 'Fresh Rui Fish (রুই মাছ)', 1.5, 'kg', 300, 450],
        ['bitem-3', 'bazar-1', 'Assorted Vegetables (কাঁচা সবজি)', 1, 'pack', 200, 200],
        ['bitem-4', 'bazar-1', 'Soybean Oil (সয়াবিন তেল)', 1.5, 'litre', 200, 300],
        ['bitem-5', 'bazar-1', 'Farm Eggs (ফার্মের ডিম)', 15, 'pcs', 12, 180]
      ];

      for (const item of bazarItems) {
        await client.query(`
          INSERT INTO bazar_items (id, bazar_id, item_name, quantity, unit, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, item);
      }

      // Duties
      const duties = [
        ['duty-1', defaultMessId, 'user-ovi', 'BAZAR', null, '2026-09-25', 'COMPLETED', 'user-rahim'],
        ['duty-2', defaultMessId, 'user-rahim', 'COOKING', 'BREAKFAST', '2026-09-25', 'COMPLETED', 'user-ovi'],
        ['duty-3', defaultMessId, 'user-karim', 'COOKING', 'LUNCH', '2026-09-25', 'ASSIGNED', 'user-ovi'],
        ['duty-4', defaultMessId, 'user-hasan', 'COOKING', 'DINNER', '2026-09-25', 'ASSIGNED', 'user-ovi'],
        ['duty-5', defaultMessId, 'user-sakib', 'CLEANING', null, '2026-09-25', 'ASSIGNED', 'user-rahim']
      ];

      for (const d of duties) {
        await client.query(`
          INSERT INTO duty_schedules (id, mess_id, member_id, duty_type, meal_type, date, status, assigned_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, d);
      }

      // Meal plan
      await client.query(`
        INSERT INTO meal_plans (id, mess_id, date, breakfast, lunch, dinner, created_by)
        VALUES ('meal-2026-09-25', $1, '2026-09-25', 'Paratha + Egg Omelette + Hot Tea', 'Steamed Rice + Rui Fish Curry + Dal', 'Rice + Chicken Bhuna + Mixed Vegetable', 'user-rahim')
        ON CONFLICT (id) DO NOTHING
      `, [defaultMessId]);

      // Shopping items
      const shopItems = [
        ['shop-1', defaultMessId, 'Miniket Rice (চাল)', 5, 'kg', 'HIGH', 'PENDING', 400, 'user-rahim'],
        ['shop-2', defaultMessId, 'Fresh Potato (আলু)', 3, 'kg', 'HIGH', 'PENDING', 150, 'user-karim'],
        ['shop-3', defaultMessId, 'Local Onion (পেঁয়াজ)', 2, 'kg', 'HIGH', 'PENDING', 200, 'user-hasan']
      ];

      for (const s of shopItems) {
        await client.query(`
          INSERT INTO shopping_items (id, mess_id, item_name, quantity, unit, priority, status, estimated_cost, added_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, s);
      }

      console.log('PostgreSQL database seeded successfully with September 2026 records.');
    }

    client.release();
  } catch (err) {
    console.error('Database initialization warning:', err);
  }
}
