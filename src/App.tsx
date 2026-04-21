import { useState, useEffect } from 'react';
import { PackageSearch, ClipboardList } from 'lucide-react';
import { Order } from './types';
import ViewMode from './components/ViewMode';
import ManageMode from './components/ManageMode';

export default function App() {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((o: any) => ({
          ...o,
          status: o.status || 'pending',
          createdAt: o.createdAt || new Date().toISOString()
        }));
      } catch (e) {
        return [];
      }
    }
    // Start with a small default order to demonstrate how it works
    return [
      {
        id: 'example-1',
        orderNumber: '第 1 單',
        recipientName: '試用範例',
        trackingNumber: '119255804432',
        products: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: [
          { id: 'i1', name: '牡丹蝦', quantity: 2, unit: '公斤' },
          { id: 'i2', name: '透抽', quantity: 1, unit: '包' }
        ]
      }
    ];
  });
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');

  // Trigger smooth scroll when tab changes to ensure we are at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-[100px]">
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8 pt-8 md:pt-12 pb-24 mt-2">
        {activeTab === 'view' ? (
          <ViewMode orders={orders.filter(o => o.status === 'pending')} />
        ) : (
          <ManageMode orders={orders} setOrders={setOrders} />
        )}
      </main>

      {/* Floating Bottom Navigation to ensure it's easily reachable */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex h-[90px] z-40 pb-safe">
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'view' 
              ? 'text-blue-600 bg-blue-50/50' 
              : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <PackageSearch size={32} className={activeTab === 'view' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className={`text-2xl ${activeTab === 'view' ? 'font-bold' : 'font-medium'}`}>看訂單</span>
        </button>
        <div className="w-[1px] bg-slate-200 my-4 shadow-sm" />
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'manage' 
              ? 'text-blue-600 bg-blue-50/50' 
              : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <ClipboardList size={32} className={activeTab === 'manage' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className={`text-2xl ${activeTab === 'manage' ? 'font-bold' : 'font-medium'}`}>管理編輯</span>
        </button>
      </nav>
    </div>
  );
}
