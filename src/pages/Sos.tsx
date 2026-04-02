import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ChevronLeft, Send, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { supabase, Host } from "../lib/supabase";
import { cn } from "../lib/utils";

export default function Sos() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();

  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");
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

  if (!host || host.show_sos === false) return <Navigate to={`/app/${apartmentId}`} replace />;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim() || !host) return;

    setIsSubmitting(true);
    try {
      // Прямая запись в таблицу checkouts с типом SOS
      const { error } = await supabase
        .from("checkouts")
        .insert([
          {
            host_id: host.id,
            type: "SOS",
            guest_name: "GUEST_SOS",
            // Записываем текст проблемы в объект checklist
            checklist: { problem: issue.trim() },
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      // Если ошибок нет — переключаем на экран успеха
      setIsSuccess(true);
    } catch (error: any) {
      console.error("SOS Submit Error:", error);
      alert("Ошибка при отправке: " + (error.message || "Попробуйте позже"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 sm:p-10 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Сообщить о проблеме</h1>
            <p className="text-sm text-slate-500 font-medium">Мы поможем вам как можно быстрее</p>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-rose-100/20 border border-slate-100"
        >
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-rose-50 rounded-3xl text-rose-600">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Что случилось?</label>
                  <textarea 
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Опишите проблему (например, нет горячей воды, сломан замок...)"
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all outline-none min-h-[160px] resize-none text-slate-700"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !issue.trim()}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2",
                    isSubmitting || !issue.trim()
                      ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                      : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100 active:scale-[0.98]"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      Отправить SOS
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-6"
              >
                <div className="inline-flex p-5 bg-green-50 rounded-full text-green-600">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900">Сообщение доставлено</h2>
                  <p className="text-slate-500 text-lg leading-relaxed">
                    Арендодатель получил ваше уведомление. Мы свяжемся с вами в течение 15 минут.
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/app/${apartmentId}`)}
                  className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Вернуться в меню
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
