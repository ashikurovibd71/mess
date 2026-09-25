import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { X, Lock, Mail, User as UserIcon, Shield, CheckCircle2, AlertCircle, Phone, Database } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { loginWithCredentials, registerUser, state } = useMess();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('ashikurovi2003@gmail.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+880 1700-000000');
  const [role, setRole] = useState<'ADMIN' | 'CASHIER' | 'MEMBER'>('MEMBER');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (targetEmail?: string, targetPassword?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithCredentials(targetEmail || email, targetPassword || password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        role
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              মেস
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'LOGIN' ? 'Bachelor Mess Login' : 'Member Registration'}
              </h3>
              <p className="text-[11px] text-slate-500">
                PostgreSQL Neon DB Authentication
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'LOGIN'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In (লগইন)
          </button>
          <button
            onClick={() => { setMode('REGISTER'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'REGISTER'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            New Member (নিবন্ধন)
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'LOGIN' ? (
          <div className="p-6 space-y-4">
            {/* Quick 1-Click Login for Mess Members */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                1-Click Quick Member Login:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLogin('ashikurovi2003@gmail.com', 'password123')}
                  className="px-2.5 py-1.5 text-left rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">Ovi (Admin)</div>
                  <div className="text-[10px] text-slate-500">ashikurovi2003@gmail.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLogin('rahim.mess@gmail.com', 'password123')}
                  className="px-2.5 py-1.5 text-left rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">Rahim (Cashier)</div>
                  <div className="text-[10px] text-slate-500">rahim.mess@gmail.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLogin('karim.mess@gmail.com', 'password123')}
                  className="px-2.5 py-1.5 text-left rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">Karim (Member)</div>
                  <div className="text-[10px] text-slate-500">karim.mess@gmail.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLogin('hasan.mess@gmail.com', 'password123')}
                  className="px-2.5 py-1.5 text-left rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">Hasan (Member)</div>
                  <div className="text-[10px] text-slate-500">hasan.mess@gmail.com</div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Or Email & Password</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs mt-2 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Sign In to Mess Dashboard'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="p-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Full Name (সদস্যের নাম)
              </label>
              <input
                type="text"
                placeholder="e.g. Ashikur Rahman Ovi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="ovi@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="+880 1..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Role (দায়িত্ব)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="MEMBER">MEMBER (সাধারণ সদস্য)</option>
                <option value="CASHIER">CASHIER (ক্যাশিয়ার)</option>
                <option value="ADMIN">ADMIN (ম্যানেজার)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs mt-3 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>Neon PostgreSQL Connected</span>
          </div>
          <span>Demo Password: password123</span>
        </div>
      </div>
    </div>
  );
};
