import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Home,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Shield,
  Sparkles,
  Users
} from 'lucide-react';
import { Role } from '../../types';

interface Props {
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<Props> = ({ onContinueAsGuest }) => {
  const { state, loginWithCredentials, registerUser, dbStatus } = useMess();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [phone, setPhone] = useState('+880 17');
  const [roomNumber, setRoomNumber] = useState('Room 301');
  const [role, setRole] = useState<Role>('MEMBER');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (targetEmail?: string, targetPassword?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithCredentials(targetEmail || email, targetPassword || password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in Name, Email, and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await registerUser({
        name: name.trim(),
        nameBn: nameBn.trim() || undefined,
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        roomNumber: roomNumber.trim(),
        role
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-white font-bold text-xl mb-3 backdrop-blur-xs border border-white/20">
            মেস
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Dhaka Bachelor Mess
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
            Accounting, Expense Splitting & Daily Duty Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Neon PostgreSQL Database Live</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 text-sm font-semibold bg-slate-50">
          <button
            onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
            className={`flex-1 py-3.5 text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
              mode === 'LOGIN'
                ? 'border-slate-900 text-slate-900 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In (লগইন)</span>
          </button>
          <button
            onClick={() => { setMode('REGISTER'); setErrorMsg(null); }}
            className={`flex-1 py-3.5 text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
              mode === 'REGISTER'
                ? 'border-slate-900 text-slate-900 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>New Member (নতুন মেম্বার নিবন্ধন)</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 sm:mx-8 mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'LOGIN' ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Quick 1-Click Login from Live Dynamic Members in Neon DB */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>1-Click Select Member to Log In:</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {state.members.length} registered in Neon DB
                </span>
              </div>

              {state.members.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  Loading members from Neon PostgreSQL...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {state.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleLogin(member.email, 'password123')}
                      className="group p-3 text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-slate-900">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {member.name} {member.nameBn ? `(${member.nameBn})` : ''}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                          member.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'CASHIER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {member.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or Sign In with Email
              </span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. ashikurovi2003@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In to Your Mess Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Full Name (English) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ashikur Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  নাম (বাংলা)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আশিকুর রহমান"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Phone (মোবাইল)
                </label>
                <input
                  type="tel"
                  placeholder="+880 1700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Room Number (রুম নম্বর)
                </label>
                <input
                  type="text"
                  placeholder="Room 301"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Mess Role (দায়িত্ব)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="MEMBER">MEMBER (সাধারণ সদস্য)</option>
                  <option value="CASHIER">CASHIER (ক্যাশিয়ার)</option>
                  <option value="ADMIN">ADMIN (মেস ম্যানেজার)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Creating account in Neon DB...' : 'Register Member & Enter Mess'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer with Guest Option */}
        {onContinueAsGuest && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center flex items-center justify-between text-xs">
            <span className="text-slate-500">Just want to view calculations?</span>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="font-semibold text-slate-800 hover:text-slate-950 underline underline-offset-2"
            >
              Continue as Guest (গেস্ট ভিউ)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
