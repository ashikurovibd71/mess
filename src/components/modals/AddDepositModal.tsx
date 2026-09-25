import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { PaymentMethod } from '../../types';
import { X, DollarSign, Upload, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionDate: string;
    note?: string;
    receiptUrl?: string;
  };
}

export const AddDepositModal: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { activeMembers, addContribution, updateContribution, isMonthClosed } = useMess();

  const [memberId, setMemberId] = useState(initialData?.memberId || activeMembers[0]?.id || '');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'CASH');
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transactionDate || new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState(initialData?.note || '');
  const [receiptUrl, setReceiptUrl] = useState(initialData?.receiptUrl || '');

  // Reset fields when opened/closed with different data
  React.useEffect(() => {
    if (isOpen) {
      setMemberId(initialData?.memberId || activeMembers[0]?.id || '');
      setAmount(initialData?.amount ? String(initialData.amount) : '');
      setPaymentMethod(initialData?.paymentMethod || 'CASH');
      setTransactionDate(initialData?.transactionDate || new Date().toISOString().split('T')[0]);
      setNote(initialData?.note || '');
      setReceiptUrl(initialData?.receiptUrl || '');
    }
  }, [isOpen, initialData, activeMembers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    if (initialData) {
      updateContribution(initialData.id, {
        amount: parsedAmount,
        paymentMethod,
        transactionDate,
        note: note.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined
      });
    } else {
      addContribution({
        memberId: memberId || activeMembers[0]?.id,
        amount: parsedAmount,
        paymentMethod,
        transactionDate,
        note: note.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{initialData ? 'Edit Deposit' : 'Record Deposit'}</h3>
            <p className="text-xs text-slate-500">Mess fund advance</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isMonthClosed && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>This month is closed. Deposit cannot be recorded.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Member
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 disabled:opacity-70 disabled:bg-slate-50"
              required
              disabled={!!initialData} // Usually you can't change the member of a deposit later easily
            >
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Amount (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">৳</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 tabular-nums font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-medium"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Notes / TrxID
            </label>
            <input
              type="text"
              placeholder="e.g. bKash TrxID 9K3D8X, September advance"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Receipt / Slip Attachment
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Optional receipt image URL or screenshot link"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <button
                type="button"
                onClick={() => setReceiptUrl('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80')}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
              >
                Sample Slip
              </button>
            </div>
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
              disabled={isMonthClosed}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {initialData ? 'Save Changes' : 'Confirm Deposit (জমা সম্পন্ন করুন)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
