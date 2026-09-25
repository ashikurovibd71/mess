import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { Role } from '../../types';
import { Users, Plus, Shield, Phone, Mail, Home, CheckCircle2, XCircle, Receipt } from 'lucide-react';
import { AddMemberModal } from '../modals/AddMemberModal';
import { UniversalSlipInvoiceModal, SlipInvoiceData } from '../modals/UniversalSlipInvoiceModal';
import { EditMemberModal } from '../modals/EditMemberModal';
import { User } from '../../types';

export const MemberManagementView: React.FC = () => {
  const { state, currentRole, toggleMemberStatus, updateMemberRole, financialOverview, deleteMember } = useMess();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SlipInvoiceData | null>(null);
  const [editingMember, setEditingMember] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Mess Members
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active roommates and account status
          </p>
        </div>

        {currentRole === 'ADMIN' && (
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Member</span>
          </button>
        )}
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.members.map((member) => {
          const summary = financialOverview.memberSummaries.find((m) => m.memberId === member.id);
          const isActive = member.status === 'ACTIVE';

          return (
            <div
              key={member.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs space-y-4 transition-all ${
                isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      {member.nameBn && (
                        <span className="text-xs text-slate-500">({member.nameBn})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 uppercase tracking-wider">
                        {member.role}
                      </span>
                      <span className="text-[11px] text-slate-500">{member.roomNumber || 'Room 302'}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              {/* Contact details */}
              <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>

              {/* Financial snapshot */}
              {summary && (
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Sept Balance:</span>
                    <div
                      className={`font-bold tabular-nums text-sm ${
                        summary.netBalance > 0.01
                          ? 'text-emerald-700'
                          : summary.netBalance < -0.01
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {summary.netBalance > 0 ? `+৳${summary.netBalance}` : `৳${summary.netBalance}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Deposited:</span>
                    <div className="font-semibold text-slate-900 tabular-nums">
                      ৳{summary.totalDeposited.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              )}

              {/* Member Invoice & Statement Slip */}
              {summary && (
                <button
                  onClick={() =>
                    setSelectedSlip({
                      type: 'MEMBER_STATEMENT',
                      id: member.id,
                      title: `Statement - ${member.name}`,
                      titleBn: 'মেম্বার মাসিক হিসাব বিবরণী',
                      date: new Date().toISOString().split('T')[0],
                      amount: Math.abs(summary.netBalance),
                      payerName: member.name,
                      payerRole: member.role,
                      note: `Deposited: ৳${summary.totalDeposited}, Share: ৳${summary.share}, Net: ${summary.netBalance >= 0 ? '+' : ''}৳${summary.netBalance}`,
                      items: [
                        { itemName: 'Total Mess Fund Advance Deposited', quantity: 1, unit: 'sum', unitPrice: summary.totalDeposited, totalPrice: summary.totalDeposited },
                        { itemName: 'Equal Share of Mess Shared Expenses', quantity: 1, unit: 'share', unitPrice: summary.share, totalPrice: summary.share }
                      ]
                    })
                  }
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Statement & Invoice</span>
                </button>
              )}

              {/* Admin actions */}
              {currentRole === 'ADMIN' && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Role:</span>
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member.id, e.target.value as Role)}
                      className="text-xs px-2 py-1 border border-slate-200 rounded bg-white font-medium"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="CASHIER">CASHIER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="text-[11px] font-semibold px-2 py-1 rounded transition-colors text-blue-700 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleMemberStatus(member.id)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                        isActive
                          ? 'text-rose-700 hover:bg-rose-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete ${member.name}?`)) {
                          deleteMember(member.id);
                        }
                      }}
                      className="text-[11px] font-semibold px-2 py-1 rounded transition-colors text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddMemberModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} />
      {editingMember && (
        <EditMemberModal
          isOpen={true}
          onClose={() => setEditingMember(null)}
          member={editingMember}
        />
      )}
      <UniversalSlipInvoiceModal
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        data={selectedSlip}
      />
    </div>
  );
};
