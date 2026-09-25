import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { DutySchedule } from '../../types';
import { X, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  duty: DutySchedule | null;
}

export const RequestDutySwapModal: React.FC<Props> = ({ isOpen, onClose, duty }) => {
  const { activeMembers, currentUser, requestDutySwap } = useMess();

  const [targetMemberId, setTargetMemberId] = useState(
    activeMembers.find((m) => m.id !== currentUser.id)?.id || ''
  );
  const [reason, setReason] = useState('');

  if (!isOpen || !duty) return null;

  const otherMembers = activeMembers.filter((m) => m.id !== duty.memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberId) {
      alert('Please select a member to swap with');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for the swap');
      return;
    }

    requestDutySwap(duty.id, targetMemberId, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-semibold">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Request Duty Swap</h3>
              <p className="text-xs text-slate-500">ডিউটি অদল-বদল অনুরোধ · Section 42</p>
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
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-800">Your Current Assignment:</div>
            <div className="text-slate-600">
              {duty.dutyType} {duty.mealType ? `(${duty.mealType})` : ''} on{' '}
              <span className="font-semibold text-slate-900">{duty.date}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Swap With (কার সাথে পরিবর্তন করবেন)
            </label>
            <select
              value={targetMemberId}
              onChange={(e) => setTargetMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              required
            >
              {otherMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Reason (কারণ / জরুরি কাজ)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Office meeting in morning / Class exam / Going home"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              required
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
              Send Swap Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
