import React from 'react';
import { X, ExternalLink, Receipt } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  receiptUrl?: string;
  amount?: number;
  date?: string;
}

export const ReceiptPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  receiptUrl,
  amount,
  date
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">
                {date ? `Date: ${date}` : ''} {amount ? `· ৳${amount.toLocaleString('en-IN')}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-slate-100 flex items-center justify-center min-h-[300px]">
          {receiptUrl ? (
            <img
              src={receiptUrl}
              alt="Receipt Attachment"
              className="max-h-[400px] w-auto object-contain rounded-lg shadow-sm border border-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-lg border border-slate-200 w-full">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-medium text-slate-700">Digital Voucher Verified</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Transaction recorded and verified by Cashier in mess ledger
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
