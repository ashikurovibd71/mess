const fs = require('fs');

const file = 'server/routes.ts';
let content = fs.readFileSync(file, 'utf8');

const additionalRoutes = `
// --- GENERATED EDIT/DELETE ROUTES ---

apiRouter.put('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryId, categoryCode, amount, description, expenseDate, paidBy, paymentMethod, note, receiptUrl, bazarId } = req.body;
    await pool.query(\`
      UPDATE expenses 
      SET category_id = $1, category_code = $2, amount = $3, description = $4, expense_date = $5, paid_by = $6, payment_method = $7, note = $8, receipt_url = $9, bazar_id = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    \`, [categoryId, categoryCode, amount, description, expenseDate, paidBy, paymentMethod, note, receiptUrl, bazarId, id]);
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
`;

fs.appendFileSync(file, additionalRoutes);
console.log('Routes added successfully.');
