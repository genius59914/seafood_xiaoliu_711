import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { Plus, Edit3, Trash2, X, Check, LayoutGrid, List as ListIcon, Trash, CalendarSearch, PackageCheck, Package, RotateCcw } from 'lucide-react';
import { formatTrackingNumber } from './ViewMode';

const PRODUCT_OPTIONS = [
  { name: '牡丹蝦', unit: '公斤' },
  { name: '葡萄蝦', unit: '公斤' },
  { name: '胭脂蝦', unit: '公斤' },
  { name: '角蝦', unit: '公斤' },
  { name: '透抽', unit: '包' },
  { name: '白蝦(大盒)', unit: '盒' },
];

export default function ManageMode({
  orders,
  onSaveOrder,
  onDeleteOrder
}: {
  orders: Order[];
  onSaveOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [displayMode, setDisplayMode] = useState<'card' | 'list'>('card');
  const [subTab, setSubTab] = useState<'pending' | 'shipped' | 'stats'>('pending');

  const pendingOrders = orders.filter(o => o.status === 'pending').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const shippedOrders = orders.filter(o => o.status === 'shipped').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const deleteOrder = (id: string, number: string) => {
    if (window.confirm(`確定要刪除「${number}」這筆訂單嗎？\n(刪除後無法復原)`)) {
      onDeleteOrder(id);
    }
  };

  const handleSave = (order: Order) => {
    onSaveOrder(order);
    setEditingOrder(null);
    setIsAdding(false);
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'shipped' : 'pending';
    const orderToUpdate = orders.find(o => o.id === id);
    if (orderToUpdate) {
       onSaveOrder({ ...orderToUpdate, status: newStatus as any });
    }
  };


  if (editingOrder || isAdding) {
    return (
      <OrderForm 
        initialData={editingOrder} 
        onSave={handleSave} 
        onCancel={() => {
          setEditingOrder(null);
          setIsAdding(false);
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6 lg:max-w-4xl mx-auto px-0 md:px-8 py-0 md:py-4">
      <div className="flex justify-between items-end mb-2 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-black text-slate-800">管理訂單與統計</h2>
        <div className="flex gap-1 bg-slate-200/60 p-1.5 rounded-[16px]">
          <button 
            onClick={() => setDisplayMode('card')} 
            className={`p-2 rounded-xl transition-all ${displayMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <LayoutGrid size={24}/>
          </button>
          <button 
            onClick={() => setDisplayMode('list')} 
            className={`p-2 rounded-xl transition-all ${displayMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <ListIcon size={24}/>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-slate-200/50 p-2 rounded-[20px] overflow-x-auto">
        <button onClick={()=>setSubTab('pending')} className={`flex-1 min-w-[120px] py-3 px-2 rounded-2xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${subTab === 'pending' ? 'bg-white text-blue-600 shadow-sm shadow-black/5' : 'text-slate-500 hover:bg-slate-200/50'}`}><Package size={20}/> 待出貨 ({pendingOrders.length})</button>
        <button onClick={()=>setSubTab('shipped')} className={`flex-1 min-w-[120px] py-3 px-2 rounded-2xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${subTab === 'shipped' ? 'bg-white text-green-600 shadow-sm shadow-black/5' : 'text-slate-500 hover:bg-slate-200/50'}`}><PackageCheck size={20}/> 已出貨 ({shippedOrders.length})</button>
        <button onClick={()=>setSubTab('stats')} className={`flex-1 min-w-[120px] py-3 px-2 rounded-2xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${subTab === 'stats' ? 'bg-white text-purple-600 shadow-sm shadow-black/5' : 'text-slate-500 hover:bg-slate-200/50'}`}><CalendarSearch size={20}/> 區間統計</button>
      </div>

      {subTab !== 'stats' && (
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsAdding(true);
          }}
          className="w-full py-5 bg-slate-800 text-white rounded-[20px] text-2xl font-bold mb-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] flex items-center justify-center gap-3 active:bg-slate-900 transition-all active:scale-[0.98]"
        >
          <Plus size={32} strokeWidth={2.5} />
          新增一筆訂單
        </button>
      )}

      {subTab === 'stats' ? (
        <StatsView orders={orders} />
      ) : (
        <OrderListView 
          orders={subTab === 'pending' ? pendingOrders : shippedOrders}
          subTab={subTab}
          displayMode={displayMode}
          toggleStatus={toggleStatus}
          setEditingOrder={setEditingOrder}
          deleteOrder={deleteOrder}
        />
      )}
    </div>
  );
}

function OrderListView({ 
  orders, 
  subTab, 
  displayMode, 
  toggleStatus, 
  setEditingOrder, 
  deleteOrder 
}: { 
  orders: Order[], 
  subTab: string, 
  displayMode: string, 
  toggleStatus: (id: string, s: string)=>void, 
  setEditingOrder: (o:Order)=>void, 
  deleteOrder: (id:string, n:string)=>void 
}) {
  if (orders.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-[24px] border border-slate-200 shadow-sm mt-4">
        <p className="text-xl text-slate-400 font-bold tracking-wide">
          {subTab === 'pending' ? '目前沒有任何待出貨訂單' : '目前沒有任何已出貨訂單紀錄'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
      {displayMode === 'card' ? (
        // Card Compact View
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div key={order.id} className={`flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0 pb-4 ${index !== orders.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-1">
                  建立於 {new Date(order.createdAt).toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </span>
                <span className="font-bold text-slate-800 text-2xl">
                  {order.orderNumber} - {order.recipientName}
                </span>
                <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 rounded-md w-max text-lg mt-1">
                  {formatTrackingNumber(order.trackingNumber)}
                </span>
              </div>
              <div className="flex flex-row gap-2 md:gap-4 md:ml-4 flex-wrap">
                <button 
                  onClick={() => toggleStatus(order.id, order.status)}
                  className={`flex-1 justify-center font-bold text-xl px-4 py-3 rounded-xl whitespace-nowrap flex items-center gap-2 active:scale-95 ${
                    order.status === 'pending' ? 'bg-green-100 text-green-700 active:bg-green-200' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {order.status === 'pending' ? <><PackageCheck size={20}/> 標記已出貨</> : <><RotateCcw size={20}/> 改回待出貨</>}
                </button>
                <div className="flex gap-2 w-full md:w-auto">
                   <button onClick={() => setEditingOrder(order)} className="text-blue-500 flex-1 justify-center font-bold text-xl px-6 py-3 bg-blue-50 rounded-xl whitespace-nowrap active:bg-blue-100">
                     編輯
                   </button>
                   <button onClick={() => deleteOrder(order.id, order.orderNumber)} className="text-red-500 flex-1 justify-center font-bold text-xl px-6 py-3 bg-red-50 rounded-xl whitespace-nowrap active:bg-red-100">
                     刪除
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Detailed List View
        <div className="flex flex-col gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-[20px] overflow-hidden">
              <div className="bg-slate-200/50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                   <h3 className="font-black text-xl text-slate-800">{order.orderNumber}</h3>
                   <span className="text-xs text-slate-400 font-bold bg-white px-2 py-1 rounded-md">
                     日期：{new Date(order.createdAt).toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                   </span>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   <button 
                     onClick={() => toggleStatus(order.id, order.status)}
                     className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg font-bold flex items-center gap-2 active:scale-95 ${
                       order.status === 'pending' ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-white text-slate-600 shadow-sm'
                     }`}
                   >
                     {order.status === 'pending' ? <><PackageCheck size={18}/> 標記出貨</> : <><RotateCcw size={18}/> 改回待出貨</>}
                   </button>
                   <button onClick={() => setEditingOrder(order)} className="p-2 bg-white rounded-lg text-blue-600 shadow-sm active:scale-95"><Edit3 size={20}/></button>
                   <button onClick={() => deleteOrder(order.id, order.orderNumber)} className="p-2 bg-white rounded-lg text-red-600 shadow-sm active:scale-95"><Trash2 size={20}/></button>
                </div>
              </div>
              <div className="p-5 flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="flex flex-col min-w-[200px]">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">取貨人</span>
                  <span className="text-2xl font-bold text-slate-800">{order.recipientName}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-3">寄件編號</span>
                  <span className="text-xl font-mono text-blue-600 font-bold">{formatTrackingNumber(order.trackingNumber)}</span>
                </div>
                <div className="flex-1 w-full relative">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">商品明細</span>
                  {order.items && order.items.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <span className="font-bold text-lg text-slate-800">{item.name}</span>
                          <div className="ml-auto bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold">
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : order.products?.trim() ? (
                    <ul className="list-disc list-inside font-bold text-slate-700 text-lg">
                      {order.products.split('\n').map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  ) : (
                    <p className="text-slate-400 font-bold italic">無明細</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsView({ orders }: { orders: Order[] }) {
  const toISODate = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); 
    return toISODate(d);
  });
  const [endDate, setEndDate] = useState(toISODate(new Date()));

  const stats = useMemo(() => {
     const filtered = orders.filter(o => {
        const oDateStr = toISODate(new Date(o.createdAt));
        return oDateStr >= startDate && oDateStr <= endDate;
     });
     
     const results: Record<string, { quantity: number, unit: string }> = {};
     filtered.forEach(o => {
        if (o.items) {
           o.items.forEach(item => {
              if (!results[item.name]) {
                 results[item.name] = { quantity: 0, unit: item.unit };
              }
              results[item.name].quantity += item.quantity;
           });
        }
     });
     return { results, orderCount: filtered.length };
  }, [orders, startDate, endDate]);

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col gap-6">
       <h3 className="text-xl font-black text-slate-800">銷售統計 (所有訂單)</h3>
       <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
         <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">起始日期</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"/>
         </div>
         <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">結束日期</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"/>
         </div>
       </div>
       
       <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
         <div className="text-slate-500 font-bold mb-2">
           此區間內共有 <span className="text-3xl text-blue-600 px-2">{stats.orderCount}</span> 筆訂單
         </div>
         
         {Object.keys(stats.results).length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               {Object.entries(stats.results).map(([name, data]) => (
                  <div key={name} className="bg-[#FFFDF0] border border-[#FCE89B]/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm">
                    <span className="text-2xl xl:text-3xl font-black text-amber-700 tracking-wider mb-1">{name}</span>
                    <span className="text-5xl xl:text-6xl font-black text-amber-950 mt-1">{data.quantity} <span className="text-2xl text-amber-700/80 font-bold ml-1">{data.unit}</span></span>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              在這個時間區間內沒有任何商品明細
            </div>
         )}
       </div>
    </div>
  );
}


function OrderForm({ 
  initialData, 
  onSave, 
  onCancel 
}: { 
  initialData: Order | null;
  onSave: (order: Order) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Order>(
    initialData || {
      id: Date.now().toString(),
      orderNumber: '',
      recipientName: '',
      trackingNumber: '',
      products: '',
      items: [],
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  );

  const [selectedProductIdx, setSelectedProductIdx] = useState(0);
  const [itemQty, setItemQty] = useState<number | string>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber.trim() || !formData.recipientName.trim() || !formData.trackingNumber.trim()) {
      alert('請務必填寫：訂單名稱、取貨人、寄件編號！');
      return;
    }
    
    onSave({
      ...formData,
      trackingNumber: formData.trackingNumber.replace(/[\s-]/g, '')
    });
  };

  const handleAddItem = () => {
    const qty = Number(itemQty);
    if (qty > 0) {
      const product = PRODUCT_OPTIONS[selectedProductIdx];
      setFormData({
        ...formData,
        items: [
          ...(formData.items || []),
          {
            id: Date.now().toString() + Math.random(),
            name: product.name,
            quantity: qty,
            unit: product.unit
          }
        ]
      });
      setItemQty(1); 
    }
  };

  const removeItem = (id: string) => {
    setFormData({
      ...formData,
      items: (formData.items || []).filter(item => item.id !== id)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 xl:p-10 rounded-[24px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col gap-8 border border-slate-200 mt-2 mb-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-2 pb-4 border-b border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          {initialData ? '編輯訂單資訊' : '新增訂單資訊'}
        </h2>
        <button type="button" onClick={onCancel} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 active:bg-slate-200 transition-colors">
          <X size={28} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xl font-bold text-slate-700">訂單名稱 <span className="text-red-500">*</span></label>
        <p className="text-sm text-slate-400 font-bold mb-1">如：第 1 單</p>
        <input 
          type="text"
          value={formData.orderNumber}
          onChange={e => setFormData({...formData, orderNumber: e.target.value})}
          placeholder="例如：第 1 單"
          className="bg-slate-50 border-2 border-slate-200 rounded-[16px] px-5 py-4 text-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-800 font-bold placeholder:font-normal placeholder:text-slate-300"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xl font-bold text-slate-700">取貨人姓名 <span className="text-red-500">*</span></label>
        <p className="text-sm text-slate-400 font-bold mb-1">去寄件時要核對的名字</p>
        <input 
          type="text"
          value={formData.recipientName}
          onChange={e => setFormData({...formData, recipientName: e.target.value})}
          placeholder="例如：陳小明"
          className="bg-slate-50 border-2 border-slate-200 rounded-[16px] px-5 py-4 text-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-800 font-bold placeholder:font-normal placeholder:text-slate-300"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xl font-bold text-blue-800">寄件編號 <span className="text-red-500">*</span></label>
        <p className="text-sm text-blue-600 font-bold mb-1">店員用來掃描的條碼數字</p>
        <input 
          type="text"
          value={formData.trackingNumber}
          onChange={e => setFormData({...formData, trackingNumber: e.target.value})}
          placeholder="例如：123456789012"
          className="bg-blue-50 border-2 border-blue-200 rounded-[16px] px-5 py-4 text-2xl font-mono focus:outline-none focus:border-blue-500 transition-colors text-blue-900 tracking-widest font-black placeholder:font-normal placeholder:tracking-normal placeholder:text-blue-300/60 uppercase"
        />
      </div>

      <div className="flex flex-col gap-4 border-t-2 border-dashed border-slate-200 pt-6">
        <div className="flex items-center gap-2">
          <label className="text-xl font-bold text-slate-700">填寫商品明細</label>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex flex-col gap-2">
             <select 
               value={selectedProductIdx} 
               onChange={e => setSelectedProductIdx(Number(e.target.value))}
               className="bg-slate-50 border-2 border-slate-200 rounded-[16px] px-5 py-4 text-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-500 appearance-none bg-no-repeat"
               style={{ backgroundPosition: 'right 1rem center', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
             >
               {PRODUCT_OPTIONS.map((prod, idx) => (
                 <option key={idx} value={idx}>{prod.name}</option>
               ))}
             </select>
          </div>
          <div className="w-full sm:w-1/3 flex items-center gap-3">
             <input 
               type="number"
               min="1"
               value={itemQty}
               onChange={e => setItemQty(e.target.value)}
               className="w-full bg-slate-50 border-2 border-slate-200 rounded-[16px] px-5 py-4 text-2xl font-bold text-slate-800 focus:outline-none focus:border-blue-500 text-center"
             />
             <span className="text-xl font-bold text-slate-500 whitespace-nowrap min-w-[2.5rem]">
               {PRODUCT_OPTIONS[selectedProductIdx].unit}
             </span>
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleAddItem}
          className="bg-blue-100 text-blue-700 font-bold text-xl py-4 rounded-[16px] active:bg-blue-200 transition-colors shadow-sm"
        >
          + 加入此商品
        </button>

        {formData.items && formData.items.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-slate-500 font-bold mb-1">目前已加入清單：</p>
            {formData.items.map((item, idx) => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-[16px]">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 text-slate-600 font-black rounded-full w-8 h-8 flex items-center justify-center text-sm">{idx + 1}</div>
                  <span className="text-2xl font-bold text-slate-800">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black text-slate-700">{item.quantity} <span className="text-lg text-slate-500 font-bold">{item.unit}</span></span>
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-3 bg-red-100 text-red-600 rounded-xl active:bg-red-200 active:scale-95"
                  >
                    <Trash size={20} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
        <button 
          type="button"
          onClick={onCancel}
          className="w-full sm:w-1/3 bg-slate-100 text-slate-700 text-2xl font-bold py-5 rounded-[16px] active:bg-slate-200 transition-colors"
        >
          取消
        </button>
        <button 
          type="submit"
          className="w-full sm:w-2/3 bg-slate-800 text-white text-2xl font-bold py-5 rounded-[16px] flex items-center justify-center gap-3 active:bg-slate-900 shadow-md transition-colors"
        >
          <Check size={32} className="stroke-[3]" />
          儲存確認
        </button>
      </div>
    </form>
  );
}
