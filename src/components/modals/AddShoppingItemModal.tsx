import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { ShoppingPriority } from '../../types';
import { X, ListPlus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    priority: ShoppingPriority;
    estimatedCost?: number;
    note?: string;
  };
}

export const AddShoppingItemModal: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { addShoppingItem, updateShoppingItem } = useMess();

  const [itemName, setItemName] = useState(initialData?.itemName || '');
  const [quantity, setQuantity] = useState(initialData?.quantity ? String(initialData.quantity) : '1');
  const [unit, setUnit] = useState(initialData?.unit || 'kg');
  const [priority, setPriority] = useState<ShoppingPriority>(initialData?.priority || 'HIGH');
  const [estimatedCost, setEstimatedCost] = useState(initialData?.estimatedCost ? String(initialData.estimatedCost) : '');
  const [note, setNote] = useState(initialData?.note || '');

  React.useEffect(() => {
    if (isOpen) {
      setItemName(initialData?.itemName || '');
      setQuantity(initialData?.quantity ? String(initialData.quantity) : '1');
      setUnit(initialData?.unit || 'kg');
      setPriority(initialData?.priority || 'HIGH');
      setEstimatedCost(initialData?.estimatedCost ? String(initialData.estimatedCost) : '');
      setNote(initialData?.note || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('Please enter item name');
      return;
    }

    const parsedQty = parseFloat(quantity) || 1;
    const parsedCost = estimatedCost ? parseFloat(estimatedCost) : undefined;

    if (initialData) {
      updateShoppingItem(initialData.id, {
        itemName: itemName.trim(),
        quantity: parsedQty,
        unit,
        priority,
        estimatedCost: parsedCost,
        note: note.trim() || undefined
      });
    } else {
      addShoppingItem({
        itemName: itemName.trim(),
        quantity: parsedQty,
        unit,
        priority,
        estimatedCost: parsedCost,
        note: note.trim() || undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{initialData ? 'Edit Shopping Item' : 'Add Shopping Item'}</h3>
              <p className="text-xs text-slate-500">Market grocery item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Miniket Rice, Ruhi fish, Eggs, Onion"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Quantity (পরিমাণ)
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none tabular-nums"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Unit (একক)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Priority (গুরুত্ব)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ShoppingPriority)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="HIGH">High (জরুরি)</option>
                <option value="MEDIUM">Medium (স্বাভাবিক)</option>
                <option value="LOW">Low (কম দরকারি)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Estimated Cost (আনুমানিক ৳)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 400"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Note (নোট)
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh live fish if available"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              {initialData ? 'Save Changes' : 'Add to List (তালিকায় যোগ করুন)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
