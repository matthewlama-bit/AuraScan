'use client'

import { useState } from 'react';
import { MOCK_JOBS, MOCK_REMOVALISTS, MOCK_STATS } from '../data/mockData';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { Job, Bid, User, SubscriptionTier } from '../types';
import {
  BarChart3, Users, Truck, DollarSign, TrendingUp, Package, Search,
  Eye, ChevronDown, ChevronUp, MapPin, Calendar, CheckCircle2,
  XCircle, Clock, AlertTriangle, Shield, Star, Zap, Award, Crown,
  FileText, ArrowUpRight, ArrowDownRight, Activity, CreditCard,
  MessageSquare, Filter
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  draft:         'bg-stone-100 text-stone-600',
  published:     'bg-cyan-50 text-cyan-700',
  bidding:       'bg-amber-50 text-amber-700',
  awarded:       'bg-emerald-50 text-emerald-700',
  'in-progress': 'bg-blue-50 text-blue-700',
  completed:     'bg-green-50 text-green-700',
  cancelled:     'bg-red-50 text-red-600',
};

const BID_STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  accepted:  'bg-emerald-50 text-emerald-700',
  declined:  'bg-red-50 text-red-500',
  withdrawn: 'bg-stone-100 text-stone-500',
};

const TIER_COLOR: Record<SubscriptionTier, string> = {
  free:         'text-stone-500 bg-stone-100',
  starter:      'text-blue-600 bg-blue-50',
  professional: 'text-violet-600 bg-violet-50',
  enterprise:   'text-amber-600 bg-amber-50',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'removalists' | 'revenue'>('overview');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const stats = MOCK_STATS;

  const allJobs = statusFilter === 'all' ? MOCK_JOBS : MOCK_JOBS.filter(j => j.status === statusFilter);
  const allBids = MOCK_JOBS.flatMap(j => j.bids);

  const TABS = [
    { key: 'overview' as const,    label: 'Overview',    icon: BarChart3 },
    { key: 'jobs' as const,        label: 'All Jobs',    icon: Package },
    { key: 'removalists' as const, label: 'Removalists', icon: Truck },
    { key: 'revenue' as const,     label: 'Revenue',     icon: DollarSign },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Admin Dashboard</h2>
          <p className="text-sm text-stone-400 mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
          <Shield size={14} /> Admin Access
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t.key ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Jobs',        value: stats.totalJobs,       icon: Package,    color: 'text-cyan-600',    bg: 'bg-cyan-50',    trend: '+12%' },
              { label: 'Active Jobs',        value: stats.activeJobs,      icon: Activity,   color: 'text-blue-600',    bg: 'bg-blue-50',    trend: '+8%' },
              { label: 'Total Bids',         value: stats.totalBids,       icon: FileText,   color: 'text-amber-600',   bg: 'bg-amber-50',   trend: '+23%' },
              { label: 'Revenue (MRR)',       value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+18%' },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                      <Icon size={16} className={k.color} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight size={10} /> {k.trend}
                    </span>
                  </div>
                  <p className="text-xl font-black text-stone-800">{k.value}</p>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{k.label}</p>
                </div>
              );
            })}
          </div>

          {/* Second row: more stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active Removalists', value: stats.activeRemovalists, icon: Truck,       color: 'text-blue-600' },
              { label: 'Active Customers',   value: stats.activeCustomers,   icon: Users,       color: 'text-emerald-600' },
              { label: 'Avg Bid Amount',     value: `$${stats.avgBidAmount.toLocaleString()}`, icon: DollarSign, color: 'text-stone-600' },
              { label: 'Conversion Rate',    value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-violet-600' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
                  <Icon size={16} className={`mx-auto ${s.color} mb-1`} />
                  <p className="text-lg font-black text-stone-800">{s.value}</p>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Recent activity feed */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="text-sm font-black text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={16} className="text-cyan-500" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { text: 'New job published: "Sydney → Melbourne 2BR apartment"', time: '2 hours ago', icon: Package, color: 'text-cyan-500' },
                { text: 'Swift Movers submitted a bid on "Bondi studio move"', time: '5 hours ago', icon: DollarSign, color: 'text-amber-500' },
                { text: 'Titan Removals won "Family home Chatswood → Epping"', time: '1 day ago', icon: CheckCircle2, color: 'text-emerald-500' },
                { text: 'Budget Shift signed up — Free tier', time: '2 days ago', icon: Users, color: 'text-blue-500' },
                { text: 'Office relocation CBD completed successfully', time: '3 days ago', icon: CheckCircle2, color: 'text-green-500' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={13} className={item.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-700">{item.text}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL JOBS ──────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-stone-400" />
            {['all', 'draft', 'published', 'bidding', 'awarded', 'in-progress', 'completed', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full transition-all ${statusFilter === s ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
              >
                {s} {s !== 'all' && <span className="ml-1 opacity-60">({MOCK_JOBS.filter(j => s === 'all' || j.status === s).length})</span>}
              </button>
            ))}
          </div>

          {/* Jobs table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-stone-50 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b">
              <div className="col-span-4">Job</div>
              <div className="col-span-2">Route</div>
              <div className="col-span-1 text-center">Volume</div>
              <div className="col-span-1 text-center">Bids</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Guide</div>
              <div className="col-span-2 text-right">Date</div>
            </div>
            {allJobs.map(job => (
              <div key={job.id}>
                <div
                  className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-stone-50 cursor-pointer transition-colors border-b border-stone-50"
                  onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                >
                  <div className="col-span-4">
                    <p className="text-xs font-bold text-stone-800 truncate">{job.title}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{job.id}</p>
                  </div>
                  <div className="col-span-2 text-[10px] text-stone-500">{job.fromAddress.city} → {job.toAddress.city}</div>
                  <div className="col-span-1 text-center text-xs font-semibold text-stone-600">{job.totalVolumeM3} m³</div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs font-bold ${job.bids.length > 0 ? 'text-amber-600' : 'text-stone-300'}`}>{job.bids.length}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[job.status]}`}>{job.status}</span>
                  </div>
                  <div className="col-span-1 text-center text-xs font-bold text-stone-700">${job.estimatedQuote.toLocaleString()}</div>
                  <div className="col-span-2 text-right text-[10px] text-stone-400">{job.preferredDate || '—'}</div>
                </div>
                {expandedJobId === job.id && (
                  <div className="px-4 py-4 bg-stone-50 border-b border-stone-200">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">Customer</p>
                        <p className="text-sm font-semibold text-stone-700">{job.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">Vehicles</p>
                        <p className="text-sm font-semibold text-stone-700">{job.vehiclesRequired}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">Notes</p>
                        <p className="text-xs text-stone-600">{job.notes || '—'}</p>
                      </div>
                    </div>
                    {job.bids.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase mb-2">Bids ({job.bids.length})</p>
                        <div className="space-y-2">
                          {job.bids.map(bid => (
                            <div key={bid.id} className="bg-white rounded-lg p-3 border border-stone-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">{bid.companyName.charAt(0)}</div>
                                <div>
                                  <p className="text-xs font-bold text-stone-700">{bid.companyName}</p>
                                  <p className="text-[10px] text-stone-400">{bid.crewSize} crew · {bid.estimatedHours}h · {bid.insuranceIncluded ? 'Insured' : 'No insurance'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
                                <p className="text-sm font-black text-stone-800">${bid.amount.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REMOVALISTS ───────────────────────────────────────── */}
      {activeTab === 'removalists' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['free', 'starter', 'professional', 'enterprise'] as SubscriptionTier[]).map(tier => {
              const count = MOCK_REMOVALISTS.filter(r => r.subscription === tier).length;
              const p = SUBSCRIPTION_PLANS.find(p => p.tier === tier)!;
              return (
                <div key={tier} className="bg-white border border-stone-200 rounded-xl p-4 text-center">
                  <p className="text-xl font-black text-stone-800">{count}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${TIER_COLOR[tier].split(' ')[0]}`}>{p.name}</p>
                  <p className="text-[10px] text-stone-400">${p.price}/mo each</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-stone-50 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b">
              <div className="col-span-3">Company</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2 text-center">ABN</div>
              <div className="col-span-2 text-center">Plan</div>
              <div className="col-span-1 text-center">Bids</div>
              <div className="col-span-2 text-right">Joined</div>
            </div>
            {MOCK_REMOVALISTS.map(rem => {
              const bidCount = MOCK_JOBS.flatMap(j => j.bids).filter(b => b.removalistId === rem.id).length;
              return (
                <div key={rem.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600">{(rem.companyName || 'X').charAt(0)}</div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">{rem.companyName}</p>
                      <p className="text-[10px] text-stone-400">{rem.name}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-stone-600 truncate">{rem.email}</p>
                    <p className="text-[10px] text-stone-400">{rem.phone}</p>
                  </div>
                  <div className="col-span-2 text-center text-[10px] text-stone-500 font-mono">{rem.abn}</div>
                  <div className="col-span-2 text-center">
                    <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${TIER_COLOR[rem.subscription || 'free']}`}>{rem.subscription || 'free'}</span>
                  </div>
                  <div className="col-span-1 text-center text-xs font-semibold text-stone-600">{bidCount}</div>
                  <div className="col-span-2 text-right text-[10px] text-stone-400">{new Date(rem.createdAt).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REVENUE ────────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'MRR', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+18%', up: true },
              { label: 'Paying Removalists', value: MOCK_REMOVALISTS.filter(r => r.subscription && r.subscription !== 'free').length, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+3', up: true },
              { label: 'ARPU', value: `$${Math.round(stats.totalRevenue / Math.max(1, MOCK_REMOVALISTS.filter(r => r.subscription && r.subscription !== 'free').length))}`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+5%', up: true },
              { label: 'Churn', value: '2.1%', icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50', trend: '-0.3%', up: false },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                      <Icon size={16} className={k.color} />
                    </div>
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>
                      {k.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {k.trend}
                    </span>
                  </div>
                  <p className="text-xl font-black text-stone-800">{k.value}</p>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{k.label}</p>
                </div>
              );
            })}
          </div>

          {/* Revenue by tier */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="text-sm font-black text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              Revenue by Plan
            </h3>
            <div className="space-y-3">
              {SUBSCRIPTION_PLANS.filter(p => p.price > 0).map(p => {
                const count = MOCK_REMOVALISTS.filter(r => r.subscription === p.tier).length;
                const revenue = count * p.price;
                const pct = stats.totalRevenue > 0 ? Math.round((revenue / stats.totalRevenue) * 100) : 0;
                return (
                  <div key={p.tier} className="flex items-center gap-4">
                    <div className="w-24">
                      <p className="text-xs font-bold text-stone-700">{p.name}</p>
                      <p className="text-[10px] text-stone-400">{count} sub{count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${p.tier === 'starter' ? 'from-blue-400 to-blue-500' : p.tier === 'professional' ? 'from-violet-400 to-violet-500' : 'from-amber-400 to-amber-500'} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-[9px] font-black text-white">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <p className="text-sm font-black text-stone-700">${revenue.toLocaleString()}</p>
                      <p className="text-[9px] text-stone-400">/month</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming revenue projections */}
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl border border-emerald-200 p-6">
            <h3 className="text-sm font-black text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Growth Projection
            </h3>
            <p className="text-xs text-stone-500 mb-4">Based on current growth rate and pipeline</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[9px] font-bold text-stone-400 uppercase">3 Months</p>
                <p className="text-xl font-black text-emerald-700">${Math.round(stats.totalRevenue * 1.18 * 1.18 * 1.18).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-stone-400 uppercase">6 Months</p>
                <p className="text-xl font-black text-emerald-700">${Math.round(stats.totalRevenue * Math.pow(1.18, 6)).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-stone-400 uppercase">12 Months</p>
                <p className="text-xl font-black text-emerald-700">${Math.round(stats.totalRevenue * Math.pow(1.18, 12)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
