import React from 'react';
import { X, Printer, Download, Sparkles } from 'lucide-react';
import { Order } from '../../types.ts';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvRows = [
      ['Tax Invoice', order.orderNumber],
      ['Date', order.date],
      ['Customer', order.customerName],
      ['Phone', order.customerPhone],
      ['Address', order.customerAddress],
      ['Payment Method', order.paymentMethod],
      [''],
      ['SKU', 'Product Name', 'Price', 'Qty', 'Total'],
      ...order.items.map((i) => [i.sku, i.productName, `$${i.price.toFixed(2)}`, i.quantity, `$${i.subtotal.toFixed(2)}`]),
      [''],
      ['Subtotal', '', '', '', `$${order.subtotal.toFixed(2)}`],
      ['Tax (5%)', '', '', '', `$${order.tax.toFixed(2)}`],
      ['Grand Total', '', '', '', `$${order.totalAmount.toFixed(2)}`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoice_${order.orderNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">Tax Invoice Receipt</span>
            <span className="text-[11px] font-mono text-slate-500">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="invoice-printable" className="p-8 overflow-y-auto flex-1 font-sans text-xs text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-base font-bold tracking-tight text-slate-900">SmartStock AI Retail</h1>
              </div>
              <p className="text-[11px] text-slate-500">100 Market Center Parkway, Suite 400</p>
              <p className="text-[11px] text-slate-500">GST / Tax ID: US-RET-992019-X</p>
              <p className="text-[11px] text-slate-500">support@smartstock.io · +1 (800) 555-STOCK</p>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold text-slate-900 block font-mono">TAX INVOICE</span>
              <span className="font-mono text-xs text-slate-600 block">{order.orderNumber}</span>
              <span className="text-[11px] text-slate-500 block">Date: {order.date}</span>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100 rounded">
                PAYMENT COMPLETED
              </span>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-2 gap-6 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Billed To
              </div>
              <div className="font-semibold text-slate-900">{order.customerName}</div>
              <div className="text-slate-600">{order.customerPhone}</div>
              <div className="text-slate-600 truncate">{order.customerAddress}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Payment Info
              </div>
              <div className="text-slate-700">
                Method: <strong>{order.paymentMethod}</strong>
              </div>
              <div className="text-slate-700">
                Status: <strong className="text-emerald-700">{order.paymentStatus}</strong>
              </div>
              <div className="text-slate-700">
                Fulfillment: <strong>{order.orderStatus}</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2">Item Description</th>
                <th className="py-2 font-mono">SKU</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-medium text-slate-900">{item.productName}</td>
                  <td className="py-2.5 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">${item.price.toFixed(2)}</td>
                  <td className="py-2.5 text-center font-mono tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                    ${item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standard Sales Tax (5%):</span>
                <span className="font-mono tabular-nums font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-slate-900 font-bold text-sm">
                <span>Grand Total:</span>
                <span className="font-mono tabular-nums text-indigo-700">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Receipt Notice */}
          <div className="border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
            <p>Thank you for shopping at SmartStock AI Retail! All returns must be initiated within 14 days with original receipt.</p>
            <p className="mt-0.5 font-mono text-[10px]">Order Barcode: *{order.orderNumber}*</p>
          </div>
        </div>
      </div>
    </div>
  );
};
