import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, BookOpen, Info, Lock, Loader2 } from "lucide-react";
import { supabase, Host } from "../lib/supabase";

export default function Instructions() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (!host || host.show_instructions === false) {
    return <Navigate to={`/app/${apartmentId}`} replace />;
  }

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

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 sm:p-10 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link 
            to={`/app/${apartmentId}`}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Инструкции</h1>
            <p className="text-sm text-slate-500 font-medium">{host.name || host.object_id}</p>
          </div>
        </header>

        {/* Instructions List */}
        <div className="space-y-4">
          {(host.instructions_json || []).map((item: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Help Card */}
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg">Нужна помощь?</h4>
            </div>
            <p className="text-indigo-100 leading-relaxed">
              Если вы не нашли ответ на свой вопрос в инструкциях, пожалуйста, свяжитесь с нами через раздел SOS или напишите нам в мессенджер.
            </p>
            <Link 
              to={`/app/${apartmentId}/sos`}
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors"
            >
              Связаться с арендодателем
            </Link>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Footer */}
        <footer className="text-center pt-4">
          <p className="text-slate-400 text-sm font-medium">Желаем вам приятного отдыха!</p>
        </footer>
      </div>
    </div>
  );
}
