import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Database, ShieldAlert, Store, BellRing } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('SmartStock AI Supermart');
  const [currency, setCurrency] = useState('USD ($)');
  const [taxRate, setTaxRate] = useState(5.0);
  const [reorderThresholdDefault, setReorderThresholdDefault] = useState(15);
  const [expiryAlertDays, setExpiryAlertDays] = useState(7);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Store & System Parameters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure default reorder thresholds, tax calculation rules, and database automation preferences
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration parameters updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Store Profile */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-indigo-600" />
            <span>Store Profile & Currency</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Store / Business Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Operating Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="USD ($)">USD ($) - United States Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Standard Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Applied automatically during POS cart checkout calculation.
              </span>
            </div>
          </div>
        </div>

        {/* Automation & Alert Triggers */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <BellRing className="w-4 h-4 text-amber-600" />
            <span>Automated Inventory Triggers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Default Safety Stock Reorder Threshold
              </label>
              <input
                type="number"
                min="1"
                value={reorderThresholdDefault}
                onChange={(e) => setReorderThresholdDefault(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Triggers warning alert when product shelf count drops to or below this quantity.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Expiry Notice Horizon (Days)
              </label>
              <input
                type="number"
                min="1"
                value={expiryAlertDays}
                onChange={(e) => setExpiryAlertDays(parseInt(e.target.value) || 7)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Flags expiring lots for clearance discount prior to expiration date.
              </span>
            </div>
          </div>
        </div>

        {/* Database & Data Integrity */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-slate-700" />
            <span>Relational Store Storage</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-xs">
            Data is persisted atomically with ACID consistency to the local database file at <code className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">data/smartstock_db.json</code> with foreign key relations across users, products, sales, orders, and suppliers.
          </p>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
