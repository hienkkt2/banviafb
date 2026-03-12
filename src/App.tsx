import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  ShieldCheck, 
  HelpCircle, 
  BookOpen, 
  Lock, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Menu,
  Phone,
  CreditCard,
  Info,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, WarrantyPolicy, AppSettings, Category } from './types';

// --- Components ---

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-[100] ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70 text-white/80 hover:text-white">
      <X size={16} />
    </button>
  </motion.div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ zaloPhone: '', bankAccount: '', bankName: '' });
  const [policies, setPolicies] = useState<WarrantyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' }[]>([]);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'guide' | 'warranty' | 'faq' | 'purchase' | 'admin' | 'zalo' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');

  // Admin editing state
  const [editingProducts, setEditingProducts] = useState<Product[]>([]);
  const [editingPolicies, setEditingPolicies] = useState<WarrantyPolicy[]>([]);
  const [editingSettings, setEditingSettings] = useState<AppSettings>({ zaloPhone: '', bankAccount: '', bankName: '' });
  const [editingCategories, setEditingCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [prodRes, setRes, polRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings'),
        fetch('/api/policies'),
        fetch('/api/categories')
      ]);
      const prods = await prodRes.json();
      const sets = await setRes.json();
      const pols = await polRes.json();
      const cats = await catRes.json();
      
      setProducts(prods);
      setSettings(sets);
      setPolicies(pols);
      setCategories(cats);
      
      setEditingProducts(prods);
      setEditingSettings(sets);
      setEditingPolicies(pols);
      setEditingCategories(cats);
    } catch (error) {
      addToast('Không thể tải dữ liệu từ máy chủ', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseQty(1);
    setActiveModal('purchase');
  };

  const confirmPayment = () => {
    setActiveModal('zalo');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Đã sao chép vào bộ nhớ tạm!');
  };

  const openZalo = () => {
    if (!selectedProduct) return;
    const message = `Chào shop, tôi muốn mua tài khoản:
- Sản phẩm: ${selectedProduct.name}
- Số lượng: ${purchaseQty}
- Tổng tiền: ${(selectedProduct.price * purchaseQty).toLocaleString('vi-VN')}đ
Vui lòng gửi tài khoản cho tôi.`;
    
    copyToClipboard(message);
    window.open(`https://zalo.me/${settings.zaloPhone}`, '_blank');
  };

  // Admin Actions
  const handleAdminLogin = () => {
    if (adminPassInput === settings.adminPassword) {
      setAdminAuth(true);
      addToast('Đăng nhập quản trị thành công');
    } else {
      addToast('Mật khẩu không chính xác', 'error');
    }
  };

  const updateAll = async () => {
    try {
      setSaving(true);
      // Update settings
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSettings)
      });

      // Update products
      for (const p of editingProducts) {
        if (p.id < 0) { // New product
          const { id, ...rest } = p;
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rest)
          });
        } else {
          await fetch(`/api/products/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
        }
      }

      // Update policies
      for (const p of editingPolicies) {
        if (p.id < 0) {
          const { id, ...rest } = p;
          await fetch('/api/policies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rest)
          });
        } else {
          await fetch(`/api/policies/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
        }
      }

      await fetchData(true);
      addToast('Đã cập nhật tất cả thay đổi thành công!');
    } catch (error) {
      addToast('Lỗi khi cập nhật dữ liệu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (id < 0) {
      setEditingProducts(prev => prev.filter(p => p.id !== id));
      return;
    }
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await fetchData(true);
      addToast('Đã xóa sản phẩm');
    } catch (error) {
      addToast('Lỗi khi xóa sản phẩm', 'error');
    }
  };

  const addEmptyProduct = () => {
    const newProd: Product = {
      id: -Date.now(),
      name: 'Sản phẩm mới',
      description: 'Mô tả sản phẩm',
      price: 0,
      quantity: 0,
      warranty: 'Bao login',
      category: categories[0]?.name || 'Via'
    };
    setEditingProducts(prev => [...prev, newProd]);
  };

  const addEmptyPolicy = () => {
    const newPol: WarrantyPolicy = {
      id: -Date.now(),
      title: 'Chính sách mới',
      content: 'Nội dung chính sách'
    };
    setEditingPolicies(prev => [...prev, newPol]);
  };

  const deletePolicy = async (id: number) => {
    if (id < 0) {
      setEditingPolicies(prev => prev.filter(p => p.id !== id));
      return;
    }
    try {
      await fetch(`/api/policies/${id}`, { method: 'DELETE' });
      await fetchData(true);
      addToast('Đã xóa chính sách');
    } catch (error) {
      addToast('Lỗi khi xóa chính sách', 'error');
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        await fetchData(true);
        setNewCategoryName('');
        addToast('Đã thêm danh mục mới');
      } else {
        const err = await res.json();
        addToast(err.error || 'Lỗi khi thêm danh mục', 'error');
      }
    } catch (error) {
      addToast('Lỗi khi kết nối máy chủ', 'error');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      await fetchData(true);
      addToast('Đã xóa danh mục');
    } catch (error) {
      addToast('Lỗi khi xóa danh mục', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <RefreshCw size={40} className="text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-indigo-900 uppercase">FB ADS STORE</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveModal('guide')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-2">
              <BookOpen size={18} /> Hướng dẫn
            </button>
            <button onClick={() => setActiveModal('warranty')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-2">
              <ShieldCheck size={18} /> Bảo hành
            </button>
            <button onClick={() => setActiveModal('faq')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-2">
              <HelpCircle size={18} /> FAQ
            </button>
            <a href={`https://zalo.me/${settings.zaloPhone}`} target="_blank" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
              <Phone size={18} /> Hỗ trợ Zalo
            </a>
          </nav>
          <button className="md:hidden p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Warning Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-10 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-amber-600 shrink-0" size={28} />
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-1">THÔNG BÁO QUAN TRỌNG</h3>
              <ul className="text-amber-800 text-sm space-y-1 font-medium">
                <li>• Hệ thống sẽ tự động xoá dữ liệu đơn hàng sau 7 ngày, vui lòng tự backup dữ liệu.</li>
                <li>• KHÁCH HÀNG VUI LÒNG ĐỌC KĨ THÔNG TIN SẢN PHẨM VÀ CHÍNH SÁCH BẢO HÀNH TRƯỚC KHI MUA HÀNG.</li>
                <li>• Site không bảo hành via login die 282 180 ngày (bảo hành die từ trước &lt;180 ngày).</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Product Sections */}
        {categories.map((cat) => (
          <section key={cat.id} className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{cat.name} FACEBOOK</h2>
              <div className="h-px bg-slate-200 flex-grow"></div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Sản phẩm</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Số lượng</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Bảo hành</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Đơn giá</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.filter(p => p.category === cat.name).map((product) => (
                      <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-6 font-bold text-slate-900">{product.name}</td>
                        <td className="px-6 py-6 text-sm text-slate-600 max-w-xs">{product.description}</td>
                        <td className="px-6 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            product.quantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {product.quantity > 0 ? `Còn ${product.quantity}` : 'Hết hàng'}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-sm italic text-slate-500">{product.warranty}</td>
                        <td className="px-6 py-6 font-black text-indigo-600">{product.price.toLocaleString('vi-VN')}đ</td>
                        <td className="px-6 py-6 text-right">
                          <button
                            disabled={product.quantity <= 0}
                            onClick={() => handlePurchase(product)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ml-auto ${
                              product.quantity > 0 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart size={16} /> Mua ngay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-600 p-2 rounded-xl">
                  <ShoppingCart className="text-white" size={24} />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-white uppercase">FB ADS STORE</h1>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                Hệ thống cung cấp tài khoản Facebook Ads, BM, Via chất lượng cao. 
                Tự động, uy tín, bảo hành nhanh chóng. Chúng tôi cam kết mang lại 
                giá trị tốt nhất cho chiến dịch quảng cáo của bạn.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Thông tin</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => setActiveModal('guide')} className="hover:text-white transition-colors">Hướng dẫn mua hàng</button></li>
                <li><button onClick={() => setActiveModal('warranty')} className="hover:text-white transition-colors">Chính sách bảo hành</button></li>
                <li><button onClick={() => setActiveModal('faq')} className="hover:text-white transition-colors">Câu hỏi thường gặp</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Liên hệ</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3"><Phone size={16} /> Zalo: {settings.zaloPhone}</li>
                <li className="flex items-center gap-3"><CreditCard size={16} /> STK: {settings.bankAccount}</li>
                <li className="flex items-center gap-3"><Info size={16} /> {settings.bankName}</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2024 FB Ads Store. All rights reserved.</p>
            <button 
              onClick={() => setActiveModal('admin')}
              className="text-xs hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <Lock size={12} /> Quản trị viên
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      
      {/* Purchase Modal */}
      <Modal isOpen={activeModal === 'purchase'} onClose={() => setActiveModal(null)} title="Thanh toán đơn hàng">
        {selectedProduct && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500 text-sm">Sản phẩm:</span>
                <span className="font-bold text-slate-900">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Đơn giá:</span>
                <span className="font-bold text-indigo-600">{selectedProduct.price.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng cần mua:</label>
              <input 
                type="number" 
                min="1" 
                max={selectedProduct.quantity}
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(Math.min(selectedProduct.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg"
              />
              <p className="text-xs text-slate-400 mt-2 italic">* Tối đa có thể mua: {selectedProduct.quantity}</p>
            </div>

            <div className="bg-indigo-900 text-white p-6 rounded-2xl text-center">
              <p className="text-indigo-300 text-sm uppercase font-bold tracking-widest mb-1">Tổng tiền thanh toán</p>
              <h4 className="text-4xl font-black">{(selectedProduct.price * purchaseQty).toLocaleString('vi-VN')}đ</h4>
            </div>

            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-bold text-slate-600">Quét mã QR để thanh toán nhanh</p>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STK:${settings.bankAccount}|Bank:${settings.bankName}|Amount:${selectedProduct.price * purchaseQty}|Desc:Mua ${selectedProduct.name}`}
                alt="QR Payment"
                className="w-48 h-48 shadow-lg rounded-lg"
              />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-500">Ngân hàng: <span className="text-slate-900 font-bold uppercase">{settings.bankName}</span></p>
                <p className="text-sm font-medium text-slate-500">Số tài khoản: <span className="text-slate-900 font-bold">{settings.bankAccount}</span></p>
                <p className="text-sm font-medium text-slate-500">Chủ TK: <span className="text-slate-900 font-bold uppercase">Hệ thống FB Ads</span></p>
              </div>
            </div>

            <button 
              onClick={confirmPayment}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              Tôi đã thanh toán
            </button>
          </div>
        )}
      </Modal>

      {/* Zalo Confirmation Modal */}
      <Modal isOpen={activeModal === 'zalo'} onClose={() => setActiveModal(null)} title="Xác nhận & Nhận tài khoản">
        <div className="text-center space-y-6">
          <div className="bg-emerald-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-600" size={40} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Cảm ơn bạn đã mua hàng!</h4>
            <p className="text-slate-600">Vui lòng nhấn nút bên dưới để gửi thông tin đơn hàng qua Zalo cho chúng tôi. Chúng tôi sẽ gửi tài khoản cho bạn ngay lập tức.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Nội dung tin nhắn sẽ gửi:</p>
            <p className="text-sm text-slate-700 font-medium italic">
              "Chào shop, tôi muốn mua tài khoản: {selectedProduct?.name} - Số lượng: {purchaseQty} - Tổng tiền: {(selectedProduct?.price || 0) * purchaseQty}đ..."
            </p>
          </div>

          <button 
            onClick={openZalo}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
          >
            <ExternalLink size={20} /> Copy & Nhận tài khoản qua Zalo
          </button>
          <p className="text-xs text-slate-400 italic">* Hệ thống sẽ tự động copy nội dung và mở Zalo của shop.</p>
        </div>
      </Modal>

      {/* Admin Login Modal */}
      <Modal isOpen={activeModal === 'admin' && !adminAuth} onClose={() => setActiveModal(null)} title="Đăng nhập quản trị">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu:</label>
            <input 
              type="password" 
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Nhập mật khẩu admin..."
            />
          </div>
          <button 
            onClick={handleAdminLogin}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Đăng nhập
          </button>
        </div>
      </Modal>

      {/* Admin Panel Modal */}
      <Modal isOpen={activeModal === 'admin' && adminAuth} onClose={() => setActiveModal(null)} title="Bảng điều khiển Admin">
        <div className="space-y-10 pb-10">
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10 border-b border-slate-100">
            <h4 className="text-lg font-black uppercase text-indigo-900">Quản lý hệ thống</h4>
            <div className="flex gap-2">
              <button 
                onClick={fetchData}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={20} />
              </button>
              <button 
                onClick={updateAll}
                disabled={saving}
                className={`bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Đang lưu...' : 'Cập nhật tất cả'}
              </button>
            </div>
          </div>

          {/* Zalo & Security Config */}
          <section>
            <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Phone size={18} className="text-indigo-600" /> Cấu hình Zalo & Bảo mật
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Số điện thoại Zalo nhận đơn</label>
                <input 
                  type="text" 
                  placeholder="Số điện thoại Zalo"
                  value={editingSettings.zaloPhone}
                  onChange={(e) => setEditingSettings({...editingSettings, zaloPhone: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mật khẩu đăng nhập Admin</label>
                <input 
                  type="password" 
                  placeholder="Mật khẩu Admin mới"
                  value={editingSettings.adminPassword}
                  onChange={(e) => setEditingSettings({...editingSettings, adminPassword: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </section>

          {/* Categories Management */}
          <section>
            <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" /> Quản lý danh mục sản phẩm
            </h5>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Tên danh mục mới..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-grow px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={addCategory}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all"
              >
                Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat.id} className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200">
                  <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                  <button onClick={() => deleteCategory(cat.id)} className="text-rose-500 hover:text-rose-700">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Bank Config */}
          <section>
            <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-600" /> Thông tin thanh toán
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Số tài khoản"
                value={editingSettings.bankAccount}
                onChange={(e) => setEditingSettings({...editingSettings, bankAccount: e.target.value})}
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input 
                type="text" 
                placeholder="Tên ngân hàng"
                value={editingSettings.bankName}
                onChange={(e) => setEditingSettings({...editingSettings, bankName: e.target.value})}
                className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </section>

          {/* Products Management */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-600" /> Danh sách sản phẩm
              </h5>
              <button 
                onClick={addEmptyProduct}
                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors"
              >
                <Plus size={14} /> Thêm sản phẩm
              </button>
            </div>
            <div className="space-y-4">
              {editingProducts.map((p, idx) => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={(e) => {
                        const newProds = [...editingProducts];
                        newProds[idx].name = e.target.value;
                        setEditingProducts(newProds);
                      }}
                      className="px-3 py-1.5 rounded border border-slate-200 text-sm font-bold"
                      placeholder="Tên sản phẩm"
                    />
                    <select 
                      value={p.category}
                      onChange={(e) => {
                        const newProds = [...editingProducts];
                        newProds[idx].category = e.target.value as any;
                        setEditingProducts(newProds);
                      }}
                      className="px-3 py-1.5 rounded border border-slate-200 text-sm"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={p.price}
                        onChange={(e) => {
                          const newProds = [...editingProducts];
                          newProds[idx].price = parseInt(e.target.value) || 0;
                          setEditingProducts(newProds);
                        }}
                        className="w-full px-3 py-1.5 rounded border border-slate-200 text-sm font-bold text-indigo-600"
                        placeholder="Giá"
                      />
                      <input 
                        type="number" 
                        value={p.quantity}
                        onChange={(e) => {
                          const newProds = [...editingProducts];
                          newProds[idx].quantity = parseInt(e.target.value) || 0;
                          setEditingProducts(newProds);
                        }}
                        className="w-full px-3 py-1.5 rounded border border-slate-200 text-sm font-bold"
                        placeholder="SL"
                      />
                    </div>
                  </div>
                  <textarea 
                    value={p.description}
                    onChange={(e) => {
                      const newProds = [...editingProducts];
                      newProds[idx].description = e.target.value;
                      setEditingProducts(newProds);
                    }}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 text-sm h-16"
                    placeholder="Mô tả"
                  />
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={p.warranty}
                      onChange={(e) => {
                        const newProds = [...editingProducts];
                        newProds[idx].warranty = e.target.value;
                        setEditingProducts(newProds);
                      }}
                      className="flex-grow px-3 py-1.5 rounded border border-slate-200 text-sm italic"
                      placeholder="Chế độ bảo hành"
                    />
                    <button 
                      onClick={() => deleteProduct(p.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Policies Management */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" /> Chính sách bảo hành
              </h5>
              <button 
                onClick={addEmptyPolicy}
                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors"
              >
                <Plus size={14} /> Thêm chính sách
              </button>
            </div>
            <div className="space-y-4">
              {editingPolicies.map((pol, idx) => (
                <div key={pol.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <input 
                    type="text" 
                    value={pol.title}
                    onChange={(e) => {
                      const newPols = [...editingPolicies];
                      newPols[idx].title = e.target.value;
                      setEditingPolicies(newPols);
                    }}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 text-sm font-bold"
                    placeholder="Tiêu đề chính sách"
                  />
                  <textarea 
                    value={pol.content}
                    onChange={(e) => {
                      const newPols = [...editingPolicies];
                      newPols[idx].content = e.target.value;
                      setEditingPolicies(newPols);
                    }}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 text-sm h-20"
                    placeholder="Nội dung chính sách"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => deletePolicy(pol.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Modal>

      {/* Info Modals */}
      <Modal isOpen={activeModal === 'guide'} onClose={() => setActiveModal(null)} title="Hướng dẫn mua hàng">
        <div className="space-y-6">
          {[
            { step: 1, title: 'Chọn sản phẩm', content: 'Xem danh sách và chọn loại tài khoản phù hợp với nhu cầu của bạn.' },
            { step: 2, title: 'Nhập số lượng', content: 'Nhấn "Mua ngay", nhập số lượng cần mua. Hệ thống sẽ tự động tính tổng tiền.' },
            { step: 3, title: 'Thanh toán', content: 'Quét mã QR hoặc chuyển khoản theo thông tin hiển thị. Nội dung chuyển khoản nên ghi rõ tên sản phẩm.' },
            { step: 4, title: 'Nhận tài khoản', content: 'Sau khi chuyển khoản, nhấn "Tôi đã thanh toán" và gửi tin nhắn qua Zalo cho shop để nhận file tài khoản.' }
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold">{item.step}</div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">{item.title}</h5>
                <p className="text-sm text-slate-600">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'warranty'} onClose={() => setActiveModal(null)} title="Chính sách bảo hành">
        <div className="space-y-6">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h5 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <ShieldCheck size={18} /> {policy.title}
              </h5>
              <p className="text-sm text-slate-600 leading-relaxed">{policy.content}</p>
            </div>
          ))}
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <h5 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} /> Lưu ý quan trọng
            </h5>
            <p className="text-sm text-rose-800">
              Site không bảo hành via login die 282 180 ngày (bảo hành die từ trước &lt;180 ngày). 
              Vui lòng kiểm tra kỹ ngay sau khi nhận tài khoản.
            </p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'faq'} onClose={() => setActiveModal(null)} title="Câu hỏi thường gặp">
        <div className="space-y-4">
          {[
            { q: 'Bao lâu thì nhận được tài khoản?', a: 'Sau khi bạn gửi tin nhắn xác nhận qua Zalo, chúng tôi sẽ kiểm tra và gửi tài khoản cho bạn trong vòng 5-15 phút.' },
            { q: 'Định dạng tài khoản là gì?', a: 'Tài khoản thường được gửi dưới dạng: UID|Pass|2FA|Email|PassEmail hoặc file backup tùy loại.' },
            { q: 'Có hỗ trợ nạp tiền tự động không?', a: 'Hiện tại chúng tôi hỗ trợ thanh toán trực tiếp qua QR/Chuyển khoản để đảm bảo an toàn và hỗ trợ tốt nhất.' },
            { q: 'Tôi có thể đổi mật khẩu không?', a: 'Có, bạn nên đổi mật khẩu sau khi đăng nhập thành công để bảo mật tài khoản.' }
          ].map((item, i) => (
            <div key={i} className="border-b border-slate-100 pb-4 last:border-0">
              <h5 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <HelpCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" /> {item.q}
              </h5>
              <p className="text-sm text-slate-600 ml-7">{item.a}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Toasts */}
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
