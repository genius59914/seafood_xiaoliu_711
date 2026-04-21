import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc, onSnapshot, serverTimestamp, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Order } from '../types';

export function useStoreSync() {
  const [user, setUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<{name: string, ownerId: string, allowedEmails: string[]} | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  // 2. Resolve Store ID and Subscribe to Orders
  useEffect(() => {
    let unsubscribeOrders: () => void = () => {};
    let unsubscribeStore: () => void = () => {};

    const resolveStore = async () => {
      try {
        const storesRef = collection(db, 'stores');
        let resolvedId = null;

        if (user) {
          // Check if user owns a store
          const qOwner = query(storesRef, where('ownerId', '==', user.uid));
          const ownerDocs = await getDocs(qOwner);

          if (!ownerDocs.empty) {
            resolvedId = ownerDocs.docs[0].id;
          } else {
            // Check if user is an invited member
            if (user.email) {
              const qMember = query(storesRef, where('allowedEmails', 'array-contains', user.email));
              const memberDocs = await getDocs(qMember);
              if (!memberDocs.empty) {
                resolvedId = memberDocs.docs[0].id;
              }
            }
          }

          // If no store found, create one automatically
          if (!resolvedId) {
            resolvedId = doc(collection(db, 'stores')).id;
            await setDoc(doc(db, 'stores', resolvedId), {
              name: `${user.displayName || '家人'}的工作區`,
              ownerId: user.uid,
              allowedEmails: [],
              createdAt: serverTimestamp()
            });
          }
            
          // Migrate local storage data (always check, just in case user logged in after creating local orders but already had a store)!
          const saved = localStorage.getItem('orders');
          if (saved) {
             try {
                const parsed = JSON.parse(saved);
                for (let o of parsed) {
                   await setDoc(doc(db, 'stores', resolvedId, 'orders', o.id), {
                      orderNumber: o.orderNumber || '',
                      recipientName: o.recipientName || '',
                      trackingNumber: o.trackingNumber || '',
                      products: o.products || '',
                      items: o.items || [],
                      status: o.status || 'pending',
                      createdAt: o.createdAt || new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      authorId: user.uid
                   });
                }
                localStorage.removeItem('orders');
             } catch(e) { console.error("Migration failed", e); }
          }
        } else {
          // No user logged in? Because this applet acts as a single-family backend, fetch the first available store
          const qFirst = query(storesRef, limit(1));
          const firstDocs = await getDocs(qFirst);
          if (!firstDocs.empty) {
             resolvedId = firstDocs.docs[0].id;
          }
        }

        if (!resolvedId) {
          setLoading(false);
          return;
        }

        setStoreId(resolvedId);

        // Listen to Store changes
        unsubscribeStore = onSnapshot(doc(db, 'stores', resolvedId), (docSnap) => {
          if (docSnap.exists()) {
             setStoreData(docSnap.data() as any);
          }
        });

        // Listen to Orders
        unsubscribeOrders = onSnapshot(collection(db, 'stores', resolvedId, 'orders'), (snapshot) => {
          const loadedOrders = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              // Convert Firestore Timestamp to ISO string if needed, fallback to current time if optimistic pending write
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString())
            };
          }) as Order[];
          setOrders(loadedOrders);
          setLoading(false);
        }, (err) => {
           console.error("Orders listener error", err);
           setLoading(false);
        });

      } catch (err) {
        console.error("Store resolution error:", err);
        setLoading(false);
      }
    };

    resolveStore();

    return () => {
      unsubscribeOrders();
      unsubscribeStore();
    };
  }, [user]);

  const saveOrder = async (order: Order) => {
    if (!storeId || !user) return;
    const isNew = !orders.some(o => o.id === order.id);
    
    // According to blueprint, we need these strictly defined types
    const sanitizedTracking = order.trackingNumber ? order.trackingNumber.replace(/[\s-]/g, '') : '';
    const orderDocData = {
      orderNumber: order.orderNumber || '',
      recipientName: order.recipientName || '',
      trackingNumber: sanitizedTracking,
      status: order.status || 'pending',
      products: order.products || '',
      items: order.items || [],
      updatedAt: serverTimestamp(),
      authorId: user.uid
    };

    // Reference to doc
    const docRef = doc(db, 'stores', storeId, 'orders', order.id);

    try {
      if (isNew) {
        await setDoc(docRef, {
          ...orderDocData,
          createdAt: serverTimestamp() // Must use request.time for create according to rules
        });
      } else {
        await updateDoc(docRef, orderDocData);
      }
    } catch(err) {
       console.error("Save failed:", err);
       alert("儲存失敗，請檢查網路連線或稍後再試");
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!storeId) return;
    try {
      await deleteDoc(doc(db, 'stores', storeId, 'orders', orderId));
    } catch(err) {
      console.error("Delete failed:", err);
    }
  };
  
  const updateStoreEmails = async (emails: string[]) => {
      if (!storeId || !user) return;
      if (storeData?.ownerId !== user.uid) {
         alert("只有工作區擁有人可以新增家人！");
         return;
      }
      try {
         await updateDoc(doc(db, 'stores', storeId), {
            allowedEmails: emails
         });
      } catch(err) {
         console.error("Update emails error:", err);
      }
  };

  return {
    user,
    storeId,
    storeData,
    orders,
    loading,
    saveOrder,
    deleteOrder,
    updateStoreEmails
  };
}
