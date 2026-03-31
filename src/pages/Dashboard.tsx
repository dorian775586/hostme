import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Star, ShoppingBag, Info, AlertTriangle, Wifi, MapPin, ChevronRight, Copy, Check, LogOut, CheckSquare, Square, Camera, X, Loader2, CreditCard } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase, Host } from "../lib/supabase";
import imageCompression from "browser-image-compression";

export default function Dashboard() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchHost() {
      if (!apartmentId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("hosts")
        .select("*")
        .eq("object_id", apartmentId)
        .single();

      if (data) {
        setHost(data);
        // Инициализация чек-листа
        const initial: Record<string, boolean> = {};
        const currentChecklist = data.checklist_json || [
          { id: "lights", label: "Свет и кондиционер выключены" },
          { id: "windows", label: "Окна закрыты" },
          { id: "trash", label: "Мусор вынесен" },
          { id: "keys", label: "Ключи оставлены в сейфе/на столе" }
        ];
        currentChecklist.forEach((item: any) => {
          if (item.id) initial[item.id] = false;
        });
        setChecklist(initial);
      }
      setLoading(false);
    }

    const status = localStorage.getItem(`checkout_${apartmentId}`);
    if (status) setCheckoutStatus(status);
    
    fetchHost();
  }, [apartmentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F1F5F9]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Объект не найден</h1>
          <p className="text-slate-500">Пожалуйста, проверьте ссылку.</p>
        </div>
      </div>
    );
  }

  const isSubscriptionActive = host.is_active && new Date(host.subscription_until) > new Date();

  if (!isSubscriptionActive) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Доступ приостановлен</h1>
            <p className="text-slate-500 leading-relaxed text-lg">
              Пожалуйста, свяжитесь с владельцем для продления подписки.
            </p>
          </div>
          <div className="pt-4">
            <a 
              href="https://t.me/your_admin_username" 
              className="inline-block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              Связаться с поддержкой
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (checkoutStatus === "completed") {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Выезд оформлен</h1>
            <p className="text-slate-500">Спасибо, что выбрали нас! Счастливого пути!</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem(`checkout_${apartmentId}`);
              window.location.reload();
            }}
            className="text-sm text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Начать заново (для теста)
          </button>
        </motion.div>
      </div>
    );
  }

  const copyWifi = () => {
    if (!host.wifi_password) return;
    navigator.clipboard.writeText(host.wifi_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const compressedFiles = await Promise.all(
        newFiles.map(async (file: File) => {
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
          try {
            return await imageCompression(file, options);
          } catch (error) {
            return file;
          }
        })
      );
      setPhotos(prev => [...prev, ...compressedFiles]);
    }
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const photoUrls: string[] = [];

      // 1. Загрузка фото
      if (photos.length > 0) {
        setUploadProgress({ current: 0, total: photos.length });
        for (let i = 0; i < photos.length; i++) {
          setUploadProgress({ current: i + 1, total: photos.length });
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${host.object_id}/${Date.now()}-${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('checkout-photos')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('checkout-photos')
              .getPublicUrl(fileName);
            photoUrls.push(publicUrl);
          }
        }
      }

      // 2. Сохранение в базу (Исправленные названия полей)
      const { error: insertError } = await supabase
        .from("checkouts")
        .insert([
          {
            host_id: host.id, // UUID владельца
            checklist: checklist,
            photo_urls: photoUrls, // Массив ссылок
            type: "CHECKOUT",
            guest_name: "GUEST_CHECKOUT",
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      localStorage.setItem(`checkout_${apartmentId}`, "completed");
      setCheckoutStatus("completed");
      navigate(`/app/${apartmentId}/success`);
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Ошибка при сохранении. Убедитесь, что вы добавили колонки 'checklist' и 'type' в таблицу checkouts.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const currentChecklistItems = host.checklist_json || [
    { id: "lights", label: "Свет и кондиционер выключены" },
    { id: "windows", label: "Окна закрыты" },
    { id: "trash", label: "Мусор вынесен" },
    { id: "keys", label: "Ключи оставлены в сейфе/на столе" }
  ];

  const allChecked = currentChecklistItems.every(item => checklist[item.id]);
  const canCheckout = allChecked && photos.length > 0;

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 sm:p-10 font-sans overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-8 pb-10">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{host.name || host.object_id}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Портал гостя</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </header>

        {/* Wi-Fi */}
        {host.wifi_name && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={copyWifi}
            className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Wifi className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase">Wi-Fi Сеть</p>
                <p className="text-lg font-bold text-slate-900 truncate">{host.wifi_name}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-xs font-semibold text-slate-400 uppercase">Пароль</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-indigo-600">{host.wifi_password}</p>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
              </div>
            </div>
          </motion.div>
        )}

        {/* Кнопки меню */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "review", title: "Отзыв", icon: Star, color: "bg-amber-500", link: `/app/${apartmentId}/review`, show: host.show_review !== false },
            { id: "services", title: "Услуги", icon: ShoppingBag, color: "bg-indigo-600", link: `/app/${apartmentId}/services`, show: host.show_services !== false },
            { id: "info", title: "Инструкции", icon: Info, color: "bg-blue-500", link: `/app/${apartmentId}/instructions`, show: host.show_instructions !== false },
            { id: "sos", title: "SOS", icon: AlertTriangle, color: "bg-rose-500", link: `/app/${apartmentId}/sos`, show: host.show_sos !== false },
          ].filter(t => t.show).map((tile, idx) => (
            <motion.div key={tile.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
              <Link to={tile.link} className="group relative block h-40 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all active:scale-95">
                <div className={cn("inline-flex p-3 rounded-2xl text-white mb-4", tile.color)}>
                  <tile.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{tile.title}</h3>
                <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Кнопка выезда */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCheckout(true)}
          className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-bold text-lg shadow-lg flex items-center justify-center gap-3"
        >
          <LogOut className="w-6 h-6" />
          Оформить выезд
        </motion.button>
      </div>

      {/* Модалка выезда */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setShowCheckout(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl space-y-8 max-h-[95vh] overflow-y-auto">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Чек-лист выезда</h2>
                <p className="text-slate-500">Пожалуйста, выполните эти шаги перед уходом.</p>
              </div>

              <div className="space-y-4">
                {currentChecklistItems.map((item) => (
                  <button
                    key={item.id}
                    disabled={isSubmitting}
                    onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                  >
                    {checklist[item.id] ? <CheckSquare className="w-6 h-6 text-indigo-600" /> : <Square className="w-6 h-6 text-slate-300" />}
                    <span className={cn("font-medium text-slate-700", checklist[item.id] && "line-through text-slate-400")}>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Фото состояния комнат</h3>
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-rose-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 transition-all">
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Добавить</span>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} multiple accept="image/*" className="hidden" />
              </div>

              <button
                disabled={!canCheckout || isSubmitting}
                onClick={handleCheckout}
                className={cn("w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2", canCheckout ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-400 cursor-not-allowed")}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{uploadProgress ? `Загрузка фото ${uploadProgress.current}/${uploadProgress.total}` : "Отправка..."}</span>
                  </div>
                ) : "Оформить выезд"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl z-[60]">
            Пароль скопирован!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}