import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { DutySchedule, DutyType } from '../../types';
import {
  CalendarCheck,
  CalendarDays,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Filter,
  Check,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { GenerateDutyModal } from '../modals/GenerateDutyModal';
import { RequestDutySwapModal } from '../modals/RequestDutySwapModal';

export const DutyManagementView: React.FC = () => {
  const {
    state,
    currentUser,
    currentRole,
    membersMap,
    dutyStats,
    toggleDutyStatus,
    respondDutySwap,
    addManualDuty,
    updateDuty,
    deleteDuty
  } = useMess();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedDutyForSwap, setSelectedDutyForSwap] = useState<DutySchedule | null>(null);

  const [filterDutyType, setFilterDutyType] = useState<string>('ALL');
  const [filterMemberId, setFilterMemberId] = useState<string>('ALL');

  const [showManualForm, setShowManualForm] = useState(false);
  const [editingDutyId, setEditingDutyId] = useState<string | null>(null);
  const [manualMemberId, setManualMemberId] = useState(state.members[0]?.id || '');
  const [manualDutyType, setManualDutyType] = useState<DutyType>('BAZAR');
  const [manualMealType, setManualMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('LUNCH');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualNote, setManualNote] = useState('');

  const todayStr = '2026-09-25';

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDutyId) {
      updateDuty(editingDutyId, {
        memberId: manualMemberId,
        dutyType: manualDutyType,
        date: manualDate,
        mealType: manualDutyType === 'COOKING' ? manualMealType : undefined,
        note: manualNote.trim() || undefined
      });
    } else {
      addManualDuty({
        memberId: manualMemberId,
        dutyType: manualDutyType,
        date: manualDate,
        mealType: manualDutyType === 'COOKING' ? manualMealType : undefined,
        note: manualNote.trim() || undefined
      });
    }
    setShowManualForm(false);
    setEditingDutyId(null);
    setManualNote('');
  };

  // Filtered duties
  const filteredDuties = state.dutySchedules.filter((d) => {
    if (filterDutyType !== 'ALL' && d.dutyType !== filterDutyType) return false;
    if (filterMemberId !== 'ALL' && d.memberId !== filterMemberId) return false;
    return true;
  });

  // Pending duty swaps
  const pendingSwaps = state.dutySwaps.filter((s) => s.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Duty Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cooking, bazar, and cleaning shift rotation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Auto-Generate</span>
          </button>
          <button
            onClick={() => {
              setEditingDutyId(null);
              setManualMemberId(state.members[0]?.id || '');
              setManualDutyType('BAZAR');
              setManualDate(new Date().toISOString().split('T')[0]);
              setManualNote('');
              setShowManualForm(!showManualForm);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Assign</span>
          </button>
        </div>
      </div>

      {/* Manual Duty Assignment Collapse */}
      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-slate-900">{editingDutyId ? 'Edit Duty Assignment' : 'Assign Custom Duty Shift'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Member</label>
              <select
                value={manualMemberId}
                onChange={(e) => setManualMemberId(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg"
              >
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duty Type</label>
              <select
                value={manualDutyType}
                onChange={(e) => setManualDutyType(e.target.value as DutyType)}
                className="w-full text-xs px-3 py-2 border rounded-lg"
              >
                <option value="BAZAR">BAZAR (বাজার)</option>
                <option value="COOKING">COOKING (রান্না)</option>
                <option value="CLEANING">CLEANING (পরিষ্কার)</option>
                <option value="OTHER">OTHER (অন্যান্য)</option>
              </select>
            </div>
            {manualDutyType === 'COOKING' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meal Type</label>
                <select
                  value={manualMealType}
                  onChange={(e) => setManualMealType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border rounded-lg"
                >
                  <option value="BREAKFAST">Breakfast (সকাল)</option>
                  <option value="LUNCH">Lunch (দুপুর)</option>
                  <option value="DINNER">Dinner (রাত)</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Instructions</label>
            <input
              type="text"
              placeholder="e.g. Need to clean the refrigerator and kitchen tiles"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowManualForm(false);
                setEditingDutyId(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg"
            >
              Save Assignment
            </button>
          </div>
        </form>
      )}

      {/* Pending Swap Requests Alert (Section 42) */}
      {pendingSwaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>Pending Duty Swap Requests ({pendingSwaps.length})</span>
          </div>

          <div className="divide-y divide-amber-200/60 text-xs">
            {pendingSwaps.map((swap) => {
              const requester = membersMap.get(swap.requesterMemberId);
              const target = membersMap.get(swap.targetMemberId);
              const duty = state.dutySchedules.find((d) => d.id === swap.dutyId);

              const canRespond =
                currentUser.id === swap.targetMemberId || currentRole === 'ADMIN';

              return (
                <div key={swap.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {requester?.name} requested to swap {duty?.dutyType} on {duty?.date} with {target?.name}
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Reason: "{swap.reason}"
                    </div>
                  </div>

                  {canRespond ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => respondDutySwap(swap.id, true)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Swap</span>
                      </button>
                      <button
                        onClick={() => respondDutySwap(swap.id, false)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-xs font-medium"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Waiting for {target?.name} / Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Duty Distribution Statistics Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Duty Summary
            </h2>
            <p className="text-xs text-slate-500">
              Completed shifts per member
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3 text-center">Bazar Duties</th>
                <th className="py-2.5 px-3 text-center">Cooking Duties</th>
                <th className="py-2.5 px-3 text-center">Cleaning Duties</th>
                <th className="py-2.5 px-3 text-center">Total Completed</th>
                <th className="py-2.5 px-3 text-center">Missed Shifts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dutyStats.map((stat) => (
                <tr key={stat.memberId} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{stat.memberName}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums font-medium text-slate-700">
                    {stat.bazarCount}
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums font-medium text-slate-700">
                    {stat.cookingCount}
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums font-medium text-slate-700">
                    {stat.cleaningCount}
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums font-bold text-emerald-700">
                    {stat.totalCompleted}
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums font-medium text-rose-600">
                    {stat.totalMissed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters & Duty Schedule List (Section 46) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Duty Schedule & Roster History ({filteredDuties.length})
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={filterDutyType}
              onChange={(e) => setFilterDutyType(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">All Duties (সব দায়িত্ব)</option>
              <option value="BAZAR">Bazar Only</option>
              <option value="COOKING">Cooking Only</option>
              <option value="CLEANING">Cleaning Only</option>
            </select>

            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">All Members</option>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredDuties.map((duty) => {
            const member = membersMap.get(duty.memberId);
            const isCompleted = duty.status === 'COMPLETED';
            const isMissed = duty.status === 'MISSED';
            const isCurrentUserDuty = duty.memberId === currentUser.id;

            return (
              <div
                key={duty.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      duty.dutyType === 'BAZAR'
                        ? 'bg-emerald-100 text-emerald-800'
                        : duty.dutyType === 'COOKING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {duty.dutyType === 'BAZAR' ? 'বাজার' : duty.dutyType === 'COOKING' ? 'রান্না' : 'ক্লিন'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {duty.dutyType} {duty.mealType ? `(${duty.mealType})` : ''}
                      </span>
                      <span className="text-xs text-slate-600">· {member?.name}</span>
                      {duty.date === todayStr && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-900 text-white rounded">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Date: {duty.date} {duty.note ? `· ${duty.note}` : ''}
                    </div>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : isMissed ? (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Missed
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleDutyStatus(duty.id)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                      >
                        Complete
                      </button>

                      {/* Request swap if current user duty */}
                      {isCurrentUserDuty && (
                        <button
                          onClick={() => setSelectedDutyForSwap(duty)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Swap
                        </button>
                      )}

                      {/* Admin mark missed */}
                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => toggleDutyStatus(duty.id, true)}
                          className="px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title="Mark Missed"
                        >
                          Missed
                        </button>
                      )}
                      {/* Edit and Delete for Admins */}
                      {currentRole === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => {
                              setEditingDutyId(duty.id);
                              setManualMemberId(duty.memberId);
                              setManualDutyType(duty.dutyType);
                              if (duty.mealType) setManualMealType(duty.mealType as any);
                              setManualDate(duty.date);
                              setManualNote(duty.note || '');
                              setShowManualForm(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Duty"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this duty?')) {
                                deleteDuty(duty.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Duty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <GenerateDutyModal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
      <RequestDutySwapModal
        isOpen={!!selectedDutyForSwap}
        onClose={() => setSelectedDutyForSwap(null)}
        duty={selectedDutyForSwap}
      />
    </div>
  );
};
