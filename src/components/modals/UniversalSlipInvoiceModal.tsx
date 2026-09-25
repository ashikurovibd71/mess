import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Receipt,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  User as UserIcon,
  ShoppingBag,
  ExternalLink,
  Share2,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export type SlipInvoiceType =
  | 'DEPOSIT'
  | 'BAZAR'
  | 'EXPENSE'
  | 'SETTLEMENT'
  | 'MEMBER_STATEMENT'
  | 'MONTHLY_SUMMARY';

export interface SlipInvoiceData {
  type: SlipInvoiceType;
  id: string;
  invoiceNumber?: string;
  title: string;
  titleBn?: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  payerName?: string;
  payerRole?: string;
  receiverName?: string;
  category?: string;
  description?: string;
  note?: string;
  receiptUrl?: string;
  recordedBy?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  memberSummary?: {
    memberName: string;
    totalDeposited: number;
    share: number;
    netBalance: number;
  };
  monthlyOverview?: {
    monthYear: string;
    openingBalance: number;
    totalDeposits: number;
    totalExpenses: number;
    cashBalance: number;
    perMemberShare: number;
    activeMemberCount: number;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: SlipInvoiceData | null;
}

export const UniversalSlipInvoiceModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'SLIP' | 'INVOICE' | 'PHOTO'>('SLIP');
  const [copied, setCopied] = useState(false);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const invoiceNo =
    data.invoiceNumber ||
    `INV-${data.type.slice(0, 3)}-${data.id.slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const getShareableText = () => {
    let text = `📋 *ঢাকা ব্যাচেলর মেস (Dhaka Bachelor Mess)*\n`;
    text += `রসিদ নং: ${invoiceNo}\n`;
    text += `তারিখ: ${data.date}\n`;
    text += `হিসাবের ধরন: ${data.title}\n`;
    text += `পরিমাণ: ৳${data.amount.toLocaleString('en-IN')}\n`;
    if (data.paymentMethod) text += `মাধ্যম: ${data.paymentMethod}\n`;
    if (data.payerName) text += `প্রদানকারী: ${data.payerName}\n`;
    if (data.receiverName) text += `গ্রহণকারী: ${data.receiverName}\n`;
    if (data.items && data.items.length > 0) {
      text += `\nআইটেম বিবরণ:\n`;
      data.items.forEach((it) => {
        text += `- ${it.itemName}: ${it.quantity} ${it.unit} @ ৳${it.unitPrice} = ৳${it.totalPrice}\n`;
      });
    }
    if (data.note) text += `নোট: ${data.note}\n`;
    text += `\nস্ট্যাটাস: ভেরিফাইড ও অডিটকৃত ✅`;
    return text;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareableText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeLabel = () => {
    switch (data.type) {
      case 'DEPOSIT':
        return { en: 'Deposit Money Receipt', bn: 'জমা মানি রসিদ', color: 'emerald' };
      case 'BAZAR':
        return { en: 'Bazar Purchase Memo', bn: 'বাজার খরচের মেমো', color: 'blue' };
      case 'EXPENSE':
        return { en: 'Utility / Expense Voucher', bn: 'ইউটিলিটি ও মেস খরচ ভাউচার', color: 'amber' };
      case 'SETTLEMENT':
        return { en: 'Settlement Clearance Slip', bn: 'দেনা-পাওনা নিষ্পত্তি স্লিপ', color: 'indigo' };
      case 'MEMBER_STATEMENT':
        return { en: 'Member Account Statement', bn: 'মেম্বার মাসিক হিসাব বিবরণী', color: 'purple' };
      case 'MONTHLY_SUMMARY':
        return { en: 'Mess Monthly Audit Invoice', bn: 'মেসের সামগ্রিক মাসিক ইনভয়েস', color: 'slate' };
    }
  };

  const typeMeta = getTypeLabel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print-wrapper">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              মেস
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{typeMeta.bn}</span>
                <span className="text-slate-400 font-normal text-xs">/ {typeMeta.en}</span>
              </h2>
              <p className="text-[11px] font-mono text-slate-500">
                Invoice No: {invoiceNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Copy for WhatsApp / Messenger"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Share Slip'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs (Hidden in print) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 text-xs font-bold px-4 pt-2 print:hidden gap-1">
          <button
            onClick={() => setActiveTab('SLIP')}
            className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
              activeTab === 'SLIP'
                ? 'bg-white border-slate-200 text-slate-900 border-b-white z-10 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Money Receipt / Slip (মানি রসিদ)</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICE')}
            className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
              activeTab === 'INVOICE'
                ? 'bg-white border-slate-200 text-slate-900 border-b-white z-10 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official Invoice (মেস ইনভয়েস)</span>
          </button>

          {data.receiptUrl && (
            <button
              onClick={() => setActiveTab('PHOTO')}
              className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
                activeTab === 'PHOTO'
                  ? 'bg-white border-slate-200 text-slate-900 border-b-white z-10 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
              <span>Attached Photo Receipt (কাগজি রসিদ)</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 flex-1 print:p-0 print:bg-white print:overflow-visible">
          {/* TAB 1: THERMAL SLIP / CASH VOUCHER STYLE */}
          {activeTab === 'SLIP' && (
            <div
              ref={printableAreaRef}
              className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-slate-200 p-6 font-mono text-slate-800 relative print:shadow-none print:border-none print:max-w-full"
            >
              {/* Slip Top Edge Decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-800 via-emerald-600 to-slate-800 rounded-t-xl print:hidden"></div>

              {/* Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <div className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white font-sans font-bold text-xs mb-1">
                  DHAKA BACHELOR MESS
                </div>
                <div className="text-[12px] font-sans text-slate-600">
                  Shared Living & Expense Management
                </div>
                <div className="text-[10px] text-slate-400">
                  Dhanmondi, Dhaka · Bachelor Mess Fund
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 py-1 rounded">
                  {typeMeta.bn} ({typeMeta.en})
                </div>
              </div>

              {/* Meta details */}
              <div className="py-3 text-[11px] border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt / Voucher:</span>
                  <span className="font-bold text-slate-900">{invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-semibold text-slate-800">{data.date}</span>
                </div>
                {data.payerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Member (Payer):</span>
                    <span className="font-bold text-slate-900">{data.payerName}</span>
                  </div>
                )}
                {data.receiverName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receiver / Payee:</span>
                    <span className="font-bold text-slate-900">{data.receiverName}</span>
                  </div>
                )}
                {data.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800 uppercase">{data.paymentMethod}</span>
                  </div>
                )}
                {data.category && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-800">{data.category}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="py-2.5 text-xs border-b border-dashed border-slate-300">
                <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Description:</span>
                <span className="font-semibold text-slate-900">{data.title}</span>
                {data.note && (
                  <div className="text-[11px] text-slate-500 italic mt-0.5">"{data.note}"</div>
                )}
              </div>

              {/* Itemized Table if Bazar items */}
              {data.items && data.items.length > 0 && (
                <div className="py-3 border-b border-dashed border-slate-300">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
                    <span>Item</span>
                    <span>Qty × Rate = Total</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {data.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="truncate max-w-[140px] text-slate-800">{it.itemName}</span>
                        <span className="tabular-nums font-medium text-slate-900">
                          {it.quantity}{it.unit} × ৳{it.unitPrice} = ৳{it.totalPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Box */}
              <div className="py-4 text-center bg-slate-50 my-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">
                  TOTAL TRANSACTION AMOUNT
                </div>
                <div className="text-2xl font-black text-slate-900 font-sans tracking-tight mt-0.5">
                  ৳{data.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-700 font-sans font-semibold mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified & Cleared in Mess Ledger</span>
                </div>
              </div>

              {/* Barcode & Verification */}
              <div className="pt-2 text-center border-t border-dashed border-slate-300">
                {/* Visual faux barcode */}
                <div className="flex justify-center items-center gap-[2px] h-7 my-2 opacity-80 overflow-hidden">
                  {[4, 2, 6, 2, 4, 8, 3, 2, 5, 2, 4, 6, 3, 2, 4, 7, 2, 5, 3, 2, 6, 2, 4, 8].map((h, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 w-[2px]"
                      style={{ height: `${h * 3}px` }}
                    ></div>
                  ))}
                </div>
                <div className="text-[9px] font-mono tracking-widest text-slate-400">
                  *{invoiceNo}*
                </div>

                <div className="mt-3 flex justify-between items-center text-[10px] font-sans text-slate-400 pt-2 border-t border-slate-100">
                  <div>Authorized: Cashier / Admin</div>
                  <div className="text-emerald-700 font-bold">AUDITED ✅</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FULL FORMAL A4 INVOICE */}
          {activeTab === 'INVOICE' && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8 font-sans text-slate-800 print:shadow-none print:border-none">
              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                      মেস
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900">
                        DHAKA BACHELOR MESS
                      </h1>
                      <div className="text-xs text-slate-500">
                        Bachelor Apartment Shared Financial System
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 pt-2">
                    Flat #4B, House #24, Road #7, Dhanmondi, Dhaka-1205
                  </p>
                  <p className="text-xs text-slate-500">
                    Contact: +880 1711-223344 · mess.dhaka@bachelor.com
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white uppercase tracking-wider">
                    OFFICIAL INVOICE
                  </span>
                  <div className="text-sm font-mono font-bold text-slate-900 pt-1">
                    #{invoiceNo}
                  </div>
                  <div className="text-xs text-slate-500">
                    Billing Date: <strong className="text-slate-800">{data.date}</strong>
                  </div>
                  <div className="text-xs text-slate-500">
                    Period: <strong className="text-slate-800">September 2026</strong>
                  </div>
                </div>
              </div>

              {/* Bill To / Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    TRANSACTION INVOLVED / PARTICIPANT:
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {data.payerName || 'Dhaka Mess Member'}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Role: {data.payerRole || 'Mess Member'}
                  </div>
                  {data.receiverName && (
                    <div className="text-slate-600 mt-0.5">
                      Transferred To: <strong>{data.receiverName}</strong>
                    </div>
                  )}
                  <div className="text-slate-500 mt-1">
                    Payment Channel: <strong>{data.paymentMethod || 'Cash / Online Transfer'}</strong>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    VOUCHER CLASSIFICATION:
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {typeMeta.en}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    বাংলা নাম: {typeMeta.bn}
                  </div>
                  <div className="text-slate-500 mt-1">
                    Recorded By: <strong>{data.recordedBy || 'Admin / Cashier'}</strong>
                  </div>
                </div>
              </div>

              {/* Itemized Invoice Table */}
              <div className="py-6">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Description / Particulars</th>
                      <th className="py-3 px-4 text-center">Unit / Rate</th>
                      <th className="py-3 px-4 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items && data.items.length > 0 ? (
                      data.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{it.itemName}</td>
                          <td className="py-2.5 px-4 text-center text-slate-600">
                            {it.quantity} {it.unit} @ ৳{it.unitPrice}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                            ৳{it.totalPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-mono text-slate-400">1</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{data.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {data.description || data.note || 'Official verified bachelor mess transaction record'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">1 unit</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                          ৳{data.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right text-slate-600">
                        Subtotal (উপমোট):
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 tabular-nums">
                        ৳{data.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-right text-slate-500 font-normal">
                        Mess Service & Processing Fee:
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500 tabular-nums font-normal">
                        ৳0.00
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 text-sm bg-slate-100">
                      <td colSpan={3} className="py-3.5 px-4 text-right font-black text-slate-900">
                        Grand Total (সর্বমোট টাকা):
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums text-base">
                        ৳{data.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terms, Verification & Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div className="space-y-1 text-[11px] text-slate-500">
                  <div className="font-bold text-slate-700 uppercase tracking-wide">
                    Verification Note:
                  </div>
                  <p>Digitally recorded and verified in Dhaka Bachelor Mess Ledger.</p>
                </div>

                <div className="flex justify-end gap-8 pt-4">
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 w-32 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-slate-800">Ovi (Admin)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                      Mess Cashier / Admin
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-10 border-b border-slate-400 w-32 flex items-end justify-center pb-1">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        AUDITED & SIGNED
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                      Account Status
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTO RECEIPT */}
          {activeTab === 'PHOTO' && data.receiptUrl && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[350px]">
              <div className="text-center mb-4">
                <h3 className="text-xs font-bold text-slate-700">Uploaded Physical Memo / Photo Slip</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Attached voucher image for physical audit</p>
              </div>
              <img
                src={data.receiptUrl}
                alt="Receipt Attachment"
                className="max-h-[500px] w-auto object-contain rounded-xl shadow-md border border-slate-200"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Ledger Certified · 100% Auditable</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close (বন্ধ করুন)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
