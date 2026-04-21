import { Package } from 'lucide-react';
import { Order } from '../types';

export const formatTrackingNumber = (val: string) => {
  const clean = val.replace(/[^a-zA-Z0-9]/g, '');
  return clean.match(/.{1,4}/g)?.join('-') || val;
};

export default function ViewMode({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        <div className="bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-300 p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Package size={64} className="mb-4 opacity-20 text-slate-500" />
          <p className="text-slate-400 font-bold mb-2 text-2xl">尚未新增訂單</p>
          <p className="text-slate-300 text-sm uppercase tracking-widest font-bold">空位</p>
        </div>
      </div>
    );
  }

  const getOrderItems = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => `${item.name} x ${item.quantity} ${item.unit}`);
    }
    if (order.products && order.products.trim()) {
       return order.products.split('\n').filter(p => p.trim());
    }
    return [];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
      {orders.map((order, index) => {
        const displayItems = getOrderItems(order);
        
        return (
        <div key={order.id} className={`bg-white rounded-[24px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-slate-200 p-6 flex flex-col justify-between border-l-8 ${index % 2 === 0 ? 'border-l-blue-600' : 'border-l-green-600'} min-h-[300px]`}>
          <div>
            <div className="flex justify-between items-start mb-6">
              <span className="bg-blue-100 text-blue-800 px-5 py-2 rounded-full text-xl font-extrabold max-w-[50%] truncate shadow-sm">
                {order.orderNumber}
              </span>
              <div className="text-right">
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">取貨人</p>
                <p className="text-3xl font-black text-slate-800 break-words">{order.recipientName}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-400 font-bold mb-2 uppercase tracking-wider">商品名稱</p>
               {displayItems.length > 0 ? (
                  <ul className="text-2xl font-bold text-slate-700 list-disc list-inside space-y-1">
                    {displayItems.map((productStr, i) => (
                      <li key={i} className="break-words py-1">{productStr}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xl text-slate-400 italic font-bold">無商品紀錄</p>
                )}
            </div>
          </div>

          <div className="mt-auto">
            <p className="text-sm text-slate-400 font-bold mb-2 uppercase tracking-wider">寄件編號</p>
            <p className="text-3xl font-mono font-bold text-blue-600 break-all select-all pt-1">
              {formatTrackingNumber(order.trackingNumber)}
            </p>
            {/* 💡 依據需求暫時隱藏 QR Code 按鈕
            <button
              onClick={() => setSelectedQR(order.trackingNumber)}
              className="mt-6 bg-blue-600 text-white rounded-[16px] py-4 px-5 flex items-center justify-center gap-3 font-bold transition-all active:scale-95 w-full text-2xl active:bg-blue-700 shadow-sm"
            >
              <ScanLine size={32} strokeWidth={2.5} />
              查看 QR Code
            </button>
            */}
          </div>
        </div>
      )})}
    </div>
  );
}
