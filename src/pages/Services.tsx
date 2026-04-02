import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, ChevronLeft, Check, CreditCard, Send, X, Lock, Loader2, Coffee, Utensils, Car, Wifi, Sparkles, Clock } from "lucide-react";
import { supabase, Host } from "../lib/supabase";
import { cn } from "../lib/utils";

const iconMap: Record<string, any> = {
  Coffee,
  Utensils,
  Car,
  Wifi,
  Sparkles,
  Clock,
  ShoppingBag
};

export default function Services() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();

  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHost() {
      if (!apartmentId) return;
      setLoading(true);
      const { data } = await supabase
        .from("hosts")
        .select("*")
        .eq("object_id", apartmentId)
        .single();
      
      if (data) setHost(data);
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

  if (!host || host.show_services === false) return <Navigate to={`/app/${apartmentId}`} replace />;

  if (checkoutStatus === "completed") {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Доступ ограничен</h1>
            <p className="text-slate-500">Вы уже оформили выезд. Доступ к порталу гостя закрыт.</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!selectedService || !host) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("checkouts")
        .insert([
          {
            host_id: host.id,
            type: "SERVICE_PURCHASE",
            service_name: selectedService.name,
            price: selectedService.price,
            guest_name: "Гость"
          },
        ]);

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedService(null);
      }, 3000);
    } catch (error: any) {
      console.error("Ошибка при заказе услуги:", error.message);
      alert("Ошибка при отправке запроса. Пожалуйста, попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = host.services_json || [
    { id: "coffee", name: "Завтрак в номер", description: "Свежий кофе и круассаны", price: 15, icon: "Coffee" },
    { id: "cleaning", name: "Доп. уборка", description: "Полная уборка квартиры", price: 30, icon: "Sparkles" },
    { id: "transfer", name: "Трансфер", description: "Поездка до аэропорта", price: 25, icon: "Car" }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-10 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Дополнительные услуги</h1>
            <p className="text-sm text-slate-500 font-medium">Сделайте ваш отдых еще комфортнее</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service: any) => {
            const Icon = iconMap[service.icon] || ShoppingBag;
            return (
              <motion.div
                key={service.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 inline-block group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
                    <p className="text-sm text-slate-500 leading-snug mt-1">{service.description}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-900">{service.price} BYN</span>
                  <button 
                    onClick={() => setSelectedService(service)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Хочу!
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedService && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setSelectedService(null)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {!isSuccess ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex p-4 bg-indigo-50 rounded-3xl text-indigo-600 mb-2">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Заказ услуги</h2>
                      <p className="text-slate-500">{selectedService.name} — {selectedService.price} BYN</p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Информация об оплате</p>
                      <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                        {host.payment_details || "Арендодатель предоставит реквизиты после подтверждения заказа."}
                      </p>
                    </div>

                    <button 
                      onClick={handlePurchase}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Отправка..." : "Заказать"}
                      {!isSubmitting && <Send className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="inline-flex p-4 bg-green-50 rounded-full text-green-600">
                      <Check className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Заявка принята!</h2>
                    <p className="text-slate-500">Арендодатель получил ваше сообщение и скоро свяжется с вами.</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
