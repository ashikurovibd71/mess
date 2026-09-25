import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { ShieldCheck, Search, Filter, Clock, User as UserIcon, Tag } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { state } = useMess();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = state.auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchEntity = log.entity.toLowerCase().includes(q);
      if (!matchDetails && !matchUser && !matchEntity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            System Audit Trail & Financial Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 22 · Immutable record of every financial transaction, duty roster change, and period closure
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Integrity Active</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, action, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500">Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="RECORD_DEPOSIT">Record Deposit</option>
            <option value="CREATE_EXPENSE">Create Expense</option>
            <option value="CREATE_BAZAR">Create Bazar</option>
            <option value="RECORD_SETTLEMENT">Record Settlement</option>
            <option value="CLOSE_MONTH">Close Month</option>
            <option value="UPDATE_DUTY_STATUS">Update Duty Status</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details / Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {log.entity} ({log.entityId.slice(0, 10)})
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{log.details}</div>
                    {log.newValue && (
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {log.oldValue ? `Old: ${log.oldValue} → ` : ''}Value: {log.newValue}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
