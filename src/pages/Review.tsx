import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Star, Send, CheckCircle2, MessageSquare, ThumbsUp, ThumbsDown, ExternalLink, Gift, Sparkles, ChevronLeft, Lock, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase, Host } from "../lib/supabase";

type FeedbackState = "form" | "submitting" | "success";

interface DetailedRatings {
  cleanliness: number;
  comfort: number;
  location: number;
  communication: number;
  value: number;
}

const RATING_CATEGORIES = [
  { id: "cleanliness", label: "Чистота", icon: Sparkles },
  { id: "comfort", label: "Комфорт", icon: Gift },
  { id: "location", label: "Расположение", icon: ExternalLink },
  { id: "communication", label: "Коммуникация", icon: MessageSquare },
  { id: "value", label: "Цена/Качество", icon: ThumbsUp },
] as const;

export default function Review() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();

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

  const [ratings, setRatings] = useState<DetailedRatings>({
    cleanliness: 0,
    comfort: 0,
    location: 0,
    communication: 0,
    value: 0,
  });
  
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [guestName, setGuestName] = useState("");
  const [state, setState] = useState<FeedbackState>("form");
  const [promoCode, setPromoCode] = useState("");

  const overallRating = useMemo(() => {
    const values = Object.values(ratings) as number[];
    const filled = values.filter(v => v > 0);
    if (filled.length === 0) return 0;
    return Math.round(filled.reduce((a, b) => a + b, 0) / filled.length);
  }, [ratings]);

  const isFormValid = (Object.values(ratings) as number[]).every(v => v > 0);

  const generatePromoCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "HOST-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setState("submitting");
    const newPromo = generatePromoCode();
    setPromoCode(newPromo);

    try {
      // Отправляем данные напрямую в Supabase, минуя несуществующий API
      const { error } = await supabase
        .from("checkouts")
        .insert([{ 
          host_id: host?.id,         // ID квартиры/хоста
          type: "REVIEW",            // Тип события для бота
          rating: overallRating,     // Общая оценка
          guest_name: guestName || "Аноним", // Имя гостя или заглушка
          liked: liked,              // Что понравилось
          disliked: disliked,        // Что не понравилось
          promo_code: newPromo       // Сгенерированный промокод
        }]);

      if (error) {
        console.error("Ошибка Supabase:", error);
        throw new Error("Failed to submit to database");
      }

      setState("success");
    } catch (error) {
      console.error(error);
      alert("Что-то пошло не так при сохранении в базу. Пожалуйста, попробуйте еще раз.");
      setState("form");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!host || host.show_review === false) return <Navigate to={`/app/${apartmentId}`} replace />;

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

  const getSuccessMessage = () => {
    const PromoSection = (
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 mt-6">
        <div className="flex items-center justify-center gap-2 text-indigo-700 font-semibold">
          <Gift className="w-5 h-5" />
          Ваш персональный подарок
        </div>
        <p className="text-sm text-indigo-600">
          Скидка 10% на следующий заезд по промокоду:
        </p>
        <div className="text-xl font-mono font-bold text-indigo-800 tracking-wider bg-white py-2 px-4 rounded-lg inline-block border border-indigo-200">
          {promoCode}
        </div>
      </div>
    );

    if (overallRating <= 3) {
      return (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Нам очень жаль</h2>
          <p className="text-slate-600 leading-relaxed">
            Мы немедленно передадим ваши замечания менеджеру, чтобы все исправить. 
            Ваш комфорт — наш главный приоритет.
          </p>
          {PromoSection}
        </div>
      );
    }

    if (overallRating === 4) {
      return (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Спасибо за ваш отзыв!</h2>
          <p className="text-slate-600 leading-relaxed">
            Мы рады, что вам понравилось. Будем рады видеть вас снова!
          </p>
          {PromoSection}
        </div>
      );
    }

    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-green-100 rounded-full">
            <ThumbsUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Отлично! Спасибо!</h2>
          <p className="text-slate-600 leading-relaxed">
            Мы очень ценим вашу высокую оценку. Не могли бы вы оставить такой же отзыв на Airbnb и Booking? 
            Это очень важно для нас!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {host.airbnb_url && (
            <a 
              href={host.airbnb_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#FF4449] transition-colors font-medium"
            >
              Airbnb <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {host.booking_url && (
            <a 
              href={host.booking_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#003580] text-white rounded-lg hover:bg-[#002255] transition-colors font-medium"
            >
              Booking <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        {PromoSection}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
      >
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-indigo-200 hover:text-white transition-colors text-sm font-medium">
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <h1 className="text-3xl font-bold tracking-tight">Ваш отзыв</h1>
            <p className="mt-2 text-indigo-100 opacity-90">Помогите нам стать лучше и получите скидку 10%!</p>
          </div>
          <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-white/10 rotate-12" />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {state === "form" && (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Detailed Ratings */}
                <div className="space-y-6">
                  {RATING_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <cat.icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-700">{cat.label}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatings(prev => ({ ...prev, [cat.id]: star }))}
                            className="transition-transform active:scale-90"
                          >
                            <Star 
                              className={cn(
                                "w-7 h-7 transition-colors duration-200",
                                ratings[cat.id as keyof DetailedRatings] >= star 
                                  ? "fill-amber-400 text-amber-400" 
                                  : "text-slate-200"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <ThumbsUp className="w-4 h-4 text-green-500" /> Что вам понравилось?
                    </label>
                    <textarea 
                      value={liked}
                      onChange={(e) => setLiked(e.target.value)}
                      placeholder="Чистота, расположение, сервис..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <ThumbsDown className="w-4 h-4 text-red-500" /> Что можно улучшить?
                    </label>
                    <textarea 
                      value={disliked}
                      onChange={(e) => setDisliked(e.target.value)}
                      placeholder="Чего не хватало?"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Ваше имя (необязательно)</label>
                    <input 
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Иван"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={cn(
                    "w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg",
                    !isFormValid 
                      ? "bg-slate-300 cursor-not-allowed shadow-none" 
                      : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200"
                  )}
                >
                  Отправить и получить скидку
                  <Send className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {state === "submitting" && (
              <motion.div 
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Отправка отзыва...</p>
              </motion.div>
            )}

            {state === "success" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4"
              >
                {getSuccessMessage()}
                
                <button 
                  onClick={() => navigate(`/app/${apartmentId}`)}
                  className="mt-8 w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Вернуться в меню
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
