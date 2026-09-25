import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { roundMoney } from '../../services/accountingEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: { itemName: string; quantity: number; unit: string; unitPrice?: number }[];
  initialData?: {
    id: string;
    purchasedBy: string;
    marketName: string;
    date: string;
    note?: string;
    receiptUrl?: string;
    items: {
      itemName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
    }[];
  };
}

interface ItemRow {
  itemName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

export const AddBazarModal: React.FC<Props> = ({ isOpen, onClose, initialItems, initialData }) => {
  const { activeMembers, addBazarRecord, updateBazarRecord, isMonthClosed, currentUser } = useMess();

  const [purchasedBy, setPurchasedBy] = useState(initialData?.purchasedBy || currentUser.id);
  const [marketName, setMarketName] = useState(initialData?.marketName || 'Dhanmondi Raw Market (ধানমন্ডি কাঁচাবাজার)');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  const [receiptUrl, setReceiptUrl] = useState(initialData?.receiptUrl || '');

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialData && initialData.items) {
      return initialData.items.map((i) => ({
        itemName: i.itemName,
        quantity: String(i.quantity || 1),
        unit: i.unit || 'kg',
        unitPrice: String(i.unitPrice || 0)
      }));
    }
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((i) => ({
        itemName: i.itemName,
        quantity: String(i.quantity || 1),
        unit: i.unit || 'kg',
        unitPrice: String(i.unitPrice || 0)
      }));
    }
    return [
      { itemName: 'Miniket Rice (চাল)', quantity: '5', unit: 'kg', unitPrice: '80' },
      { itemName: 'Rui Fish (মাছ)', quantity: '1.5', unit: 'kg', unitPrice: '320' },
      { itemName: 'Fresh Vegetables (সবজি)', quantity: '1', unit: 'pack', unitPrice: '180' }
    ];
  });

  React.useEffect(() => {
    if (isOpen) {
      setPurchasedBy(initialData?.purchasedBy || currentUser.id);
      setMarketName(initialData?.marketName || 'Dhanmondi Raw Market (ধানমন্ডি কাঁচাবাজার)');
      setDate(initialData?.date || new Date().toISOString().split('T')[0]);
      setNote(initialData?.note || '');
      setReceiptUrl(initialData?.receiptUrl || '');
      
      if (initialData && initialData.items) {
        setItems(
          initialData.items.map((i) => ({
            itemName: i.itemName,
            quantity: String(i.quantity || 1),
            unit: i.unit || 'kg',
            unitPrice: String(i.unitPrice || 0)
          }))
        );
      } else if (initialItems && initialItems.length > 0) {
        setItems(
          initialItems.map((i) => ({
            itemName: i.itemName,
            quantity: String(i.quantity || 1),
            unit: i.unit || 'kg',
            unitPrice: String(i.unitPrice || 0)
          }))
        );
      } else {
        setItems([
          { itemName: 'Miniket Rice (চাল)', quantity: '5', unit: 'kg', unitPrice: '80' },
          { itemName: 'Rui Fish (মাছ)', quantity: '1.5', unit: 'kg', unitPrice: '320' },
          { itemName: 'Fresh Vegetables (সবজি)', quantity: '1', unit: 'pack', unitPrice: '180' }
        ]);
      }
    }
  }, [isOpen, initialData, initialItems, currentUser.id]);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: keyof ItemRow, val: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  const addItemRow = () => {
    setItems([...items, { itemName: '', quantity: '1', unit: 'kg', unitPrice: '0' }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Live calculated total
  const calculatedGrandTotal = roundMoney(
    items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      return sum + q * p;
    }, 0)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(
      (item) => item.itemName.trim() !== '' && (parseFloat(item.quantity) || 0) > 0
    );

    if (validItems.length === 0) {
      alert('Please enter at least one valid bazar item');
      return;
    }

    const formattedItems = validItems.map((item) => {
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return {
        itemName: item.itemName.trim(),
        quantity,
        unit: item.unit.trim() || 'kg',
        unitPrice,
        totalPrice: roundMoney(quantity * unitPrice)
      };
    });

    if (initialData) {
      updateBazarRecord(initialData.id, {
        purchasedBy,
        marketName: marketName.trim() || 'Local Market',
        date,
        note: note.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        items: formattedItems
      });
    } else {
      addBazarRecord({
        purchasedBy,
        marketName: marketName.trim() || 'Local Market',
        date,
        note: note.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        items: formattedItems
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Record Bazar Expense</h3>
              <p className="text-xs text-slate-500">Market purchase & items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Purchased By
              </label>
              <select
                value={purchasedBy}
                onChange={(e) => setPurchasedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              >
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Market / Shop Name
              </label>
              <input
                type="text"
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                placeholder="e.g. Kawran Bazar, Super Shop"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              />
            </div>
          </div>

          {/* Line items section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Items List
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs font-medium text-slate-900 hover:text-slate-700 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-slate-500 uppercase px-1">
                <div className="col-span-5">Item Name</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit</div>
                <div className="col-span-2 text-right">Unit Price (৳)</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((row, idx) => {
                const q = parseFloat(row.quantity) || 0;
                const p = parseFloat(row.unitPrice) || 0;
                const sub = roundMoney(q * p);

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="e.g. Miniket Rice (চাল)"
                        value={row.itemName}
                        onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        placeholder="1"
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-800"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={row.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none"
                      >
                        <option value="kg">kg (কেজি)</option>
                        <option value="litre">litre (লিটার)</option>
                        <option value="pcs">pcs (টি)</option>
                        <option value="pack">pack (প্যাকেট)</option>
                        <option value="dozen">dozen (ডজন)</option>
                        <option value="hali">hali (হালি)</option>
                        <option value="g">gram (গ্রাম)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="৳"
                        value={row.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs text-right border border-slate-200 rounded-md tabular-nums font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
                        required
                      />
                      <div className="text-[10px] text-right text-slate-500 tabular-nums">
                        = ৳{sub}
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-700">Calculated Bazar Total:</span>
              <p className="text-[11px] text-slate-500">Automatically sums all quantity × unit price</p>
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">
              ৳{calculatedGrandTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Note / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Extra chicken purchased for weekend"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Receipt Attachment
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Receipt photo URL"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUrl('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80')}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Slip
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMonthClosed}
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              Save Bazar Expense (বাজার সংরক্ষণ করুন)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
