
'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Search, RefreshCcw, ShoppingCart, User, Calendar, CheckCircle2, XCircle, UserCheck, AlertCircle } from 'lucide-react';
import { PurchasePlan, UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ApprovalManagerProps {
    currentUser?: UserAccount | null;
}

export const ApprovalManager: React.FC<ApprovalManagerProps> = ({ currentUser }) => {
  const [pendingRequests, setPendingRequests] = useState<PurchasePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersMap, setUsersMap] = useState<Record<string, UserAccount>>({});
  // Reverse map for name-based lookup
  const [usersByName, setUsersByName] = useState<Record<string, UserAccount>>({});

  const formatErrorMessage = (err: any): string => {
    if (!err) return "Unknown error occurred";
    if (typeof err === 'string') return err;
    
    const message = err.message || err.error_description || err.error?.message;
    const details = err.details || "";
    const hint = err.hint || "";
    const code = err.code || "";

    if (message) {
        return `${message}${details ? ' (Details: ' + details + ')' : ''}${hint ? ' (Hint: ' + hint + ')' : ''}${code ? ' [Code: ' + code + ']' : ''}`;
    }

    try {
        const allProps: Record<string, any> = {};
        Object.getOwnPropertyNames(err).forEach(key => {
            allProps[key] = err[key];
        });
        return JSON.stringify(allProps, null, 2);
    } catch (e) {
        return String(err);
    }
  };

  const fetchUsers = async () => {
      try {
          const { data, error } = await supabase.from('user_accounts').select('*');
          if (error) throw error;
          if (data) {
              const map: Record<string, UserAccount> = {};
              const nameMap: Record<string, UserAccount> = {};
              data.forEach((u: any) => {
                  const user: UserAccount = {
                      ...u,
                      fullName: u.full_name,
                      supervisorId: u.supervisor_id?.toString(),
                      managerId: u.manager_id?.toString()
                  };
                  map[u.id.toString()] = user;
                  nameMap[u.full_name.toLowerCase()] = user;
              });
              setUsersMap(map);
              setUsersByName(nameMap);
              return { map, nameMap };
          }
      } catch (err) {
          console.error("Fetch users error:", err);
      }
      return { map: {}, nameMap: {} };
  };

  const fetchPendingRequests = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
        const { map: currentUsersMap, nameMap: currentNameMap } = await fetchUsers();

        const { data, error } = await supabase
            .from('purchase_plans')
            .select('*')
            .in('status', ['Pending Supervisor', 'Pending Manager', 'Pending Approval'])
            .order('id', { ascending: false });
            
        if (error) throw error;

        if (data) {
            const myPendingItems: PurchasePlan[] = [];

            data.forEach(p => {
                const plan: PurchasePlan = {
                    id: p.id,
                    item: p.item,
                    specs: p.specs,
                    quantity: p.quantity,
                    unitPrice: p.unit_price,
                    totalPrice: p.total_price,
                    vendor: p.vendor,
                    status: p.status,
                    requester: p.requester,
                    requestDate: p.request_date,
                    justification: p.justification
                };

                // Use name-based fallback lookup for requester data
                const requesterData = currentNameMap[plan.requester.toLowerCase()];

                let showForMe = false;

                if (currentUser.role === 'Admin' && plan.status === 'Pending Approval') {
                    showForMe = true;
                }

                if (requesterData && requesterData.supervisorId === currentUser.id?.toString() && plan.status === 'Pending Supervisor') {
                    showForMe = true;
                }

                if (requesterData && requesterData.managerId === currentUser.id?.toString() && plan.status === 'Pending Manager') {
                    showForMe = true;
                }

                if (showForMe) {
                    myPendingItems.push(plan);
                }
            });

            setPendingRequests(myPendingItems);
        }
    } catch (err: any) {
        const readableError = formatErrorMessage(err);
        console.error("Approval fetch error details:", readableError);
        setErrorMessage(`Gagal mengambil data persetujuan: ${readableError}`);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [currentUser]);

  const handleApprove = async (plan: PurchasePlan) => {
      if(!confirm(`Approve request "${plan.item}" dari ${plan.requester}?`)) return;

      const requesterData = usersByName[plan.requester.toLowerCase()];
      let nextStatus = 'Approved';

      if (plan.status === 'Pending Supervisor') {
          if (requesterData && requesterData.managerId) {
              nextStatus = 'Pending Manager';
          }
      } else if (plan.status === 'Pending Manager') {
          nextStatus = 'Approved';
      }

      try {
          const { error } = await supabase.from('purchase_plans').update({ status: nextStatus }).eq('id', plan.id);
          if (error) throw error;
          fetchPendingRequests();
      } catch (err: any) {
          alert(`Gagal menyetujui: ${formatErrorMessage(err)}`);
      }
  };

  const handleReject = async (plan: PurchasePlan) => {
      if(confirm(`Tolak request "${plan.item}" dari ${plan.requester}?`)) {
          try {
              const { error } = await supabase.from('purchase_plans').update({ status: 'Rejected' }).eq('id', plan.id);
              if (error) throw error;
              fetchPendingRequests();
          } catch (err: any) {
              alert(`Gagal menolak: ${formatErrorMessage(err)}`);
          }
      }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  const filteredRequests = pendingRequests.filter(req => 
      req.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Approvals Required</h2>
            <p className="text-sm text-gray-500">Daftar permintaan pembelian yang membutuhkan persetujuan Anda.</p>
        </div>
        <button onClick={fetchPendingRequests} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-bold text-sm">Fetch Error</p>
                    <button onClick={() => setErrorMessage(null)} className="text-red-400"><X size={14}/></button>
                  </div>
                  <p className="text-sm opacity-90 whitespace-pre-wrap mt-1 font-mono">{errorMessage}</p>
              </div>
          </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50">
             <div className="relative max-w-md">
                 <input 
                    type="text" 
                    placeholder="Cari item atau pemohon..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             </div>
         </div>

         <div className="divide-y divide-gray-100">
             {isLoading ? (
                 <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                     <RefreshCcw className="animate-spin text-blue-500" size={32} />
                     <p className="font-medium">Memuat data persetujuan...</p>
                 </div>
             ) : filteredRequests.length === 0 ? (
                 <div className="p-16 text-center text-gray-400">
                     <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
                     <p className="text-lg font-medium">Tidak ada tugas persetujuan</p>
                     <p className="text-sm opacity-70">Semua permintaan pembelian telah diproses atau belum ada permintaan baru.</p>
                 </div>
             ) : filteredRequests.map(req => (
                 <div key={req.id} className="p-6 flex flex-col md:flex-row gap-6 items-start hover:bg-slate-50 transition-colors">
                     <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-900">{req.item}</h3>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                {req.status}
                            </span>
                         </div>
                         <p className="text-sm text-gray-500 mt-1 font-medium">{req.specs}</p>
                         <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-gray-600">
                             <div className="flex items-center gap-1.5">
                                 <User size={14} className="text-gray-400" />
                                 <span>Pemohon: {req.requester}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                 <Calendar size={14} className="text-gray-400" />
                                 <span>Tanggal: {req.requestDate}</span>
                             </div>
                             <div className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                 Total: {formatIDR(req.totalPrice)}
                             </div>
                         </div>
                         <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs italic text-gray-600 border border-gray-100">
                             "{req.justification}"
                         </div>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                         <button 
                            onClick={() => handleReject(req)} 
                            className="flex-1 md:flex-none px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
                         >
                            Reject
                         </button>
                         <button 
                            onClick={() => handleApprove(req)} 
                            className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-md shadow-green-200 transition-all flex items-center justify-center gap-2"
                         >
                            <Check size={18} /> Approve
                         </button>
                     </div>
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
};
