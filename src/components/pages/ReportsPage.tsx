import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string>('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'sales',
      title: 'Sales Performance Report',
      description: 'Historical customer transactions, order totals, and gross revenue breakdown',
      icon: TrendingUp,
    },
    {
      id: 'inventory',
      title: 'Master Inventory Valuation Report',
      description: 'Full SKU inventory status, available quantities, wholesale costs, and retail valuation',
      icon: Package,
    },
    {
      id: 'expiry',
      title: 'Shelf-Life & Expiry Risk Report',
      description: 'Lot batch numbers, expiration timelines, at-risk values, and clearance priorities',
      icon: Calendar,
    },
    {
      id: 'low-stock',
      title: 'Low Stock & Replenishment Reorder Report',
      description: 'Inventory items that have dropped below designated safety reorder thresholds',
      icon: AlertTriangle,
    },
    {
      id: 'predictions',
      title: 'AI Demand Forecast & PO Optimization',
      description: 'Machine learning 7-day and 30-day velocity projections with confidence levels',
      icon: Cpu,
    },
  ];

  const handleGenerate = async (type: string) => {
    setActiveReport(type);
    setLoading(true);
    try {
      const res = await api.getReport(type as any);
      setReportData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleGenerate('sales');
  }, []);

  const handleDownloadCsv = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) return;

    const items = reportData.data;
    const keys = Object.keys(items[0]).filter((k) => typeof items[0][k] !== 'object');

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        keys.join(','),
        ...items.map((row: any) =>
          keys
            .map((k) => {
              const val = row[k];
              return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            })
            .join(',')
        ),
      ].join('\n');

    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Executive Reports & CSV Data Export
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate structured operational summaries, export raw data spreadsheets, or print formal audit documents
        </p>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTypes.map((rep) => {
          const Icon = rep.icon;
          const isActive = activeReport === rep.id;

          return (
            <button
              key={rep.id}
              onClick={() => handleGenerate(rep.id)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="space-y-2">
                <div
                  className={`p-2 rounded-lg w-fit ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">{rep.title}</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {rep.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Report Preview & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{reportData?.title || 'Report Preview'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Generated at: {reportData?.generatedAt || new Date().toLocaleString()} · {reportData?.data?.length || 0} records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Data Preview Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Compiling report data...</div>
        ) : !reportData || !reportData.data || reportData.data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No report records available</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {Object.keys(reportData.data[0])
                    .filter((k) => typeof reportData.data[0][k] !== 'object')
                    .map((header) => (
                      <th key={header} className="py-2.5 px-3">
                        {header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70 font-mono text-[11px]">
                    {Object.keys(row)
                      .filter((k) => typeof row[k] !== 'object')
                      .map((k) => (
                        <td key={k} className="py-2 px-3 text-slate-700 max-w-[200px] truncate">
                          {typeof row[k] === 'number'
                            ? k.toLowerCase().includes('price') ||
                              k.toLowerCase().includes('amount') ||
                              k.toLowerCase().includes('revenue') ||
                              k.toLowerCase().includes('value')
                              ? `$${row[k].toFixed(2)}`
                              : row[k]
                            : String(row[k])}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
