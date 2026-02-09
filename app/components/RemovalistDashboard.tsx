'use client'

import { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { MOCK_JOBS, MOCK_REMOVALISTS } from '../data/mockData';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { Job, Bid, SubscriptionTier } from '../types';
import {
  Search, Filter, MapPin, Calendar, Truck, Package, DollarSign,
  Send, Clock, CheckCircle2, XCircle, Eye, Star, TrendingUp,
  CreditCard, Award, BarChart3, ChevronDown, ChevronUp, ArrowRight,
  MessageSquare, Shield, Zap, Crown, AlertTriangle
} from 'lucide-react';

const STATUS_PILL: Record<string, string> = {
  published: 'bg-cyan-50 text-cyan-700',
  bidding:   'bg-amber-50 text-amber-700',
};

const BID_STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  accepted:  'bg-emerald-50 text-emerald-700',
  declined:  'bg-red-50 text-red-500',
  withdrawn: 'bg-stone-100 text-stone-500',
};

const TIER_ICON: Record<SubscriptionTier, typeof Star> = {
  free: Star,
  starter: Zap,
  professional: Award,
  enterprise: Crown,
};

const TIER_GRADIENT: Record<SubscriptionTier, string> = {
  free: 'from-stone-400 to-stone-500',
  starter: 'from-blue-500 to-blue-600',
  professional: 'from-violet-500 to-purple-600',
  enterprise: 'from-amber-500 to-orange-600',
};

export default function RemovalistDashboard() {
  const { user } = useRole();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-bids' | 'subscription'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showBidForm, setShowBidForm] = useState<string | null>(null);

  // Bid form state
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidCrew, setBidCrew] = useState('2');
  const [bidHours, setBidHours] = useState('4');
  const [bidInsurance, setBidInsurance] = useState(true);
  const [bidPacking, setBidPacking] = useState(false);

  const subscription = user.subscription || 'free';
  const plan = SUBSCRIPTION_PLANS.find(p => p.tier === subscription)!;
  const TierIcon = TIER_ICON[subscription];

  // Available jobs for bidding
  const availableJobs = MOCK_JOBS.filter(j =>
    (j.status === 'published' || j.status === 'bidding') &&
    (searchQuery === '' || j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.fromAddress.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // My bids (across all jobs)
  const myBids: (Bid & { jobTitle: string; estimatedQuote: number })[] = [];
  for (const job of MOCK_JOBS) {
    for (const bid of job.bids) {
      if (bid.removalistId === user.id) {
        myBids.push({ ...bid, jobTitle: job.title, estimatedQuote: job.estimatedQuote });
      }
    }
  }

  const bidsThisMonth = myBids.length;
  const bidsRemaining = plan.bidsPerMonth === 0 ? Infinity : plan.bidsPerMonth - bidsThisMonth;

  const TABS = [
    { key: 'browse' as const, label: 'Browse Jobs', icon: Search },
    { key: 'my-bids' as const, label: 'My Bids', icon: Truck },
    { key: 'subscription' as const, label: 'Subscription', icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Removalist Portal</h2>
          <p className="text-sm text-stone-400 mt-1">Find jobs, submit bids, grow your business</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${TIER_GRADIENT[subscription]} text-white text-xs font-bold shadow-md`}>
          <TierIcon size={14} />
          {plan.name} Plan
          {bidsRemaining < Infinity && <span className="ml-1 opacity-80">· {bidsRemaining} bids left</span>}
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
              {t.key === 'my-bids' && myBids.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">{myBids.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── BROWSE JOBS ───────────────────────────────────────── */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by city, title, or keyword…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-cyan-600">{availableJobs.length}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Available Jobs</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-amber-600">{bidsThisMonth}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Bids This Month</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-600">{myBids.filter(b => b.status === 'accepted').length}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Won</p>
            </div>
          </div>

          {/* Job cards */}
          <div className="space-y-3">
            {availableJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
                <Search size={32} className="mx-auto mb-3 text-stone-300" />
                <p className="text-stone-500 font-semibold">No matching jobs</p>
              </div>
            ) : (
              availableJobs.map(job => {
                const expanded = expandedJobId === job.id;
                const alreadyBid = job.bids.some(b => b.removalistId === user.id);
                const showForm = showBidForm === job.id;
                return (
                  <div key={job.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-all hover:shadow-sm">
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedJobId(expanded ? null : job.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${STATUS_PILL[job.status] || 'bg-stone-100 text-stone-500'}`}>{job.status}</span>
                            {job.bids.length > 0 && <span className="text-[9px] text-amber-600 font-semibold">{job.bids.length} bid{job.bids.length !== 1 ? 's' : ''}</span>}
                          </div>
                          <p className="text-sm font-bold text-stone-800">{job.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-stone-400">
                            <span className="flex items-center gap-1"><MapPin size={10} />{job.fromAddress.city} → {job.toAddress.city}</span>
                            <span className="flex items-center gap-1"><Calendar size={10} />{job.preferredDate}{job.flexibleDates ? ' (flexible)' : ''}</span>
                            <span className="flex items-center gap-1"><Package size={10} />{job.totalVolumeM3} m³</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[9px] text-stone-400 font-bold uppercase">Guide</p>
                            <p className="text-base font-black text-stone-700">${job.estimatedQuote.toLocaleString()}</p>
                          </div>
                          {expanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="px-4 pb-4 border-t border-stone-100 pt-4 space-y-4">
                        {/* Job detail cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-stone-50 rounded-lg p-3 text-center">
                            <Truck size={16} className="mx-auto text-stone-400 mb-1" />
                            <p className="text-sm font-black text-stone-700">{job.vehiclesRequired}</p>
                            <p className="text-[9px] text-stone-400">Vehicles</p>
                          </div>
                          <div className="bg-stone-50 rounded-lg p-3 text-center">
                            <Package size={16} className="mx-auto text-stone-400 mb-1" />
                            <p className="text-sm font-black text-stone-700">{job.totalVolumeM3} m³</p>
                            <p className="text-[9px] text-stone-400">Volume</p>
                          </div>
                          <div className="bg-stone-50 rounded-lg p-3 text-center">
                            <MapPin size={16} className="mx-auto text-stone-400 mb-1" />
                            <p className="text-xs font-bold text-stone-700">{job.fromAddress.city}</p>
                            <p className="text-[9px] text-stone-400">Pick-up</p>
                          </div>
                          <div className="bg-stone-50 rounded-lg p-3 text-center">
                            <MapPin size={16} className="mx-auto text-cyan-500 mb-1" />
                            <p className="text-xs font-bold text-stone-700">{job.toAddress.city}</p>
                            <p className="text-[9px] text-stone-400">Drop-off</p>
                          </div>
                        </div>

                        {job.notes && (
                          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                            <MessageSquare size={14} className="text-amber-500 mt-0.5 shrink-0" />
                            <p>{job.notes}</p>
                          </div>
                        )}

                        {/* Pro/Enterprise: show load-out preview would go here */}
                        {(subscription === 'professional' || subscription === 'enterprise') && (
                          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-xs text-violet-700 flex items-center gap-2">
                            <Eye size={14} />
                            <span className="font-semibold">Full 3D packing diagram available</span> — view after placing a bid.
                          </div>
                        )}

                        {/* Bid CTA */}
                        {alreadyBid ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                            <CheckCircle2 size={14} /> You&apos;ve already bid on this job
                          </div>
                        ) : bidsRemaining <= 0 ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 font-semibold flex items-center gap-2">
                            <AlertTriangle size={14} /> You&apos;ve used all bids this month — <button onClick={() => setActiveTab('subscription')} className="underline">upgrade your plan</button>
                          </div>
                        ) : showForm ? (
                          /* Bid form */
                          <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-200">
                            <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Submit Your Bid</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-bold text-stone-500 uppercase block mb-1">Amount ($)</label>
                                <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={String(job.estimatedQuote)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-stone-500 uppercase block mb-1">Crew Size</label>
                                <input type="number" value={bidCrew} onChange={e => setBidCrew(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-stone-500 uppercase block mb-1">Est. Hours</label>
                                <input type="number" value={bidHours} onChange={e => setBidHours(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                              </div>
                              <div className="flex items-end gap-3 pb-1">
                                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-600">
                                  <input type="checkbox" checked={bidInsurance} onChange={e => setBidInsurance(e.target.checked)} className="rounded" /> Insurance
                                </label>
                                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-600">
                                  <input type="checkbox" checked={bidPacking} onChange={e => setBidPacking(e.target.checked)} className="rounded" /> Packing
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-stone-500 uppercase block mb-1">Message</label>
                              <textarea value={bidMessage} onChange={e => setBidMessage(e.target.value)} rows={3} placeholder="Tell the customer why you're the best choice…" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                                <Send size={14} /> Submit Bid
                              </button>
                              <button onClick={() => setShowBidForm(null)} className="px-4 py-2 rounded-lg bg-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-300 transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowBidForm(job.id)}
                            className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <DollarSign size={16} /> Place a Bid
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── MY BIDS ───────────────────────────────────────────── */}
      {activeTab === 'my-bids' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Bids', value: myBids.length, color: 'text-blue-600' },
              { label: 'Pending', value: myBids.filter(b => b.status === 'pending').length, color: 'text-amber-600' },
              { label: 'Won', value: myBids.filter(b => b.status === 'accepted').length, color: 'text-emerald-600' },
              { label: 'Declined', value: myBids.filter(b => b.status === 'declined').length, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {myBids.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
              <Truck size={32} className="mx-auto mb-3 text-stone-300" />
              <p className="text-stone-500 font-semibold">No bids yet</p>
              <p className="text-xs text-stone-400 mt-1">Browse available jobs and submit your first bid</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBids.map(bid => (
                <div key={bid.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-stone-800">{bid.jobTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${BID_STATUS_STYLE[bid.status]}`}>{bid.status}</span>
                        <span className="text-[10px] text-stone-400">{bid.crewSize} crew · {bid.estimatedHours}h</span>
                        <span className="text-[10px] text-stone-400">Guide: ${bid.estimatedQuote.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-stone-800">${bid.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-stone-400">{new Date(bid.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUBSCRIPTION ──────────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current plan */}
          <div className={`bg-gradient-to-r ${TIER_GRADIENT[subscription]} rounded-2xl p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Current Plan</p>
                <p className="text-2xl font-black mt-1">{plan.name}</p>
                <p className="text-sm opacity-80 mt-1">
                  {plan.bidsPerMonth === 0 ? 'Unlimited bids' : `${plan.bidsPerMonth} bids/month`}
                  {plan.bidsPerMonth > 0 && ` · ${bidsRemaining} remaining`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">${plan.price}</p>
                <p className="text-xs opacity-80">/month</p>
              </div>
            </div>
          </div>

          {/* All plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map(p => {
              const active = p.tier === subscription;
              const TIcon = TIER_ICON[p.tier];
              return (
                <div key={p.tier} className={`rounded-2xl border-2 p-5 transition-all ${active ? 'border-blue-500 bg-blue-50/50 shadow-lg' : p.highlighted ? 'border-violet-300 bg-violet-50/30' : 'border-stone-200 bg-white'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <TIcon size={18} className={active ? 'text-blue-600' : 'text-stone-400'} />
                    <h4 className="font-black text-stone-800">{p.name}</h4>
                    {p.highlighted && !active && <span className="text-[8px] bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full font-black">POPULAR</span>}
                    {active && <span className="text-[8px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full font-black">CURRENT</span>}
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-black text-stone-800">${p.price}</span>
                    <span className="text-xs text-stone-400">/mo</span>
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {p.features.map(f => (
                      <li key={f} className="text-[11px] text-stone-600 flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {active ? (
                    <div className="text-center text-xs font-bold text-blue-600">Active</div>
                  ) : (
                    <button className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${p.highlighted ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                      {p.price > plan.price ? 'Upgrade' : 'Switch'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
