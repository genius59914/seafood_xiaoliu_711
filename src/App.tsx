import { useState, useEffect } from 'react';
import { PackageSearch, ClipboardList, LogOut, Users } from 'lucide-react';
import { Order } from './types';
import ViewMode from './components/ViewMode';
import ManageMode from './components/ManageMode';
import { useStoreSync } from './hooks/useStoreSync';
import { signInWithGoogle, signOut } from './lib/firebase';

export default function App() {
  const { user, storeId, orders, loading, saveOrder, deleteOrder, updateStoreEmails, storeData } = useStoreSync();
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Trigger smooth scroll when tab changes to ensure we are at top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-xl">載入資料中...</div>;
  }

  const renderManageTab = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center p-4 py-12">
          <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-sm border border-slate-200 text-center w-full max-w-md">
            <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList size={48} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">管理編輯需登入</h2>
            <p className="text-slate-500 font-medium mb-8">請登入您的 Google 帳號，或是請店長將您的 Email 加入白名單以進行編輯。</p>
            <button 
              onClick={signInWithGoogle}
              className="w-full bg-blue-600 text-white font-bold text-xl py-4 rounded-[16px] hover:bg-blue-700 active:scale-95 transition-all shadow-md"
            >
              使用 Google 登入
            </button>
          </div>
        </div>
      );
    }
    return <ManageMode orders={orders} onSaveOrder={saveOrder} onDeleteOrder={deleteOrder} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-[100px]">
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10 sticky top-0">
        <div>
           <h1 className="font-black text-slate-800 text-xl">{storeData?.name || '出貨小幫手'}</h1>
           {user && <span className="text-xs font-bold text-slate-400">已登入：{user.displayName}</span>}
        </div>
        <div className="flex gap-2">
           {user && storeData?.ownerId === user.uid && (
              <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold active:bg-blue-100 transition-colors">
                 <Users size={18} />
                 <span className="hidden sm:inline">邀請家人</span>
              </button>
           )}
           {user ? (
             <button onClick={signOut} className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-100"><LogOut size={20}/></button>
           ) : (
             <button onClick={signInWithGoogle} className="p-2 text-blue-600 font-bold bg-blue-50 rounded-xl px-4 hover:bg-blue-100 transition-colors">登入管理</button>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8 pt-6 pb-24">
        {activeTab === 'view' ? (
          <ViewMode orders={orders.filter(o => o.status === 'pending').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())} />
        ) : (
          renderManageTab()
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

      {showInviteModal && storeData && (
        <InviteModal 
           storeData={storeData} 
           onClose={() => setShowInviteModal(false)}
           onSave={(emails) => { updateStoreEmails(emails); setShowInviteModal(false); }}
        />
      )}
    </div>
  );
}

function InviteModal({ storeData, onClose, onSave }: { storeData: any, onClose: ()=>void, onSave: (emails: string[])=>void }) {
   const [emails, setEmails] = useState(storeData.allowedEmails.join('\n'));

   return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-800">與家人共用訂單</h2>
            <p className="text-slate-500 font-medium">請在下方輸入家人的 Google 帳號 (Email)，一行一個。加入後他們登入就會直接看到店裡的訂單！</p>
            <textarea 
               value={emails}
               onChange={e => setEmails(e.target.value)}
               placeholder="family1@gmail.com&#10;family2@gmail.com"
               className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-slate-700 resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-2">
               <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
               <button onClick={() => onSave(emails.split('\n').map((e:string)=>e.trim()).filter((e:string)=>e))} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">儲存並分享</button>
            </div>
         </div>
      </div>
   );
}
