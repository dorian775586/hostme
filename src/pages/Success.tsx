import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, Home } from "lucide-react";

export default function Success() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 text-center space-y-8 max-w-md w-full"
      >
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Выезд оформлен!</h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Спасибо, что выбрали нас! Отчет и фотографии успешно отправлены арендодателю!
          </p>
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl space-y-2">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Что дальше?</p>
          <p className="text-slate-600">
            Пожалуйста, оставьте ключи в сейфе или на столе, как указано в инструкции.
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate(`/app/${apartmentId}`)}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            На главную
          </button>

          <button 
            onClick={() => {
              localStorage.removeItem(`checkout_${apartmentId}`);
              navigate(`/app/${apartmentId}`);
            }}
            className="w-full py-3 bg-white text-slate-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100"
          >
            Начать заново (для теста)
          </button>
        </div>

        <p className="text-sm text-slate-400">Желаем вам приятного пути!</p>
      </motion.div>
    </div>
  );
}
