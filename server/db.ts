import pg from 'pg';

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

    // Ensure default mess and standard categories exist
    const defaultMessId = 'mess-dhaka-01';
    await client.query(`
      INSERT INTO messes (id, name, address, description)
      VALUES ($1, 'Dhaka Bachelor Mess', 'Dhanmondi, Dhaka', 'Bachelor Shared Living Mess')
      ON CONFLICT (id) DO NOTHING
    `, [defaultMessId]);

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

    // Ensure ONLY Ovi (ADMIN) exists from default data; remove other members and cashiers
    await client.query(`
      DELETE FROM users 
      WHERE email IN ('rahim.mess@gmail.com', 'karim.mess@gmail.com', 'hasan.mess@gmail.com', 'sakib.mess@gmail.com')
         OR id IN ('user-rahim', 'user-karim', 'user-hasan', 'user-sakib');
    `);

    // Ensure Ovi - ADMIN is seeded cleanly
    await client.query(`
      INSERT INTO users (id, name, name_bn, email, phone, password_hash, role, status, room_number, mess_id)
      VALUES (
        'user-ovi',
        'Ovi',
        'অভি',
        'ashikurovi2003@gmail.com',
        '+880 1711-223344',
        '$2b$10$K9iKLHy8YIB49FNMLkHyD.7iI9qHhpAc2l.vn8XsanOVNqYwr85gK',
        'ADMIN',
        'ACTIVE',
        'Room 301',
        $1
      )
      ON CONFLICT (email) DO UPDATE SET
        name = 'Ovi',
        role = 'ADMIN',
        status = 'ACTIVE';
    `, [defaultMessId]);

    client.release();
    console.log('Database schema ready: Only Ovi - ADMIN present as default user.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}
