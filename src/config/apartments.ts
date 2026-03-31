import { LucideIcon, Clock, Volume2, ShieldCheck, Map, Wifi, Star, ShoppingBag, Info, AlertTriangle } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  price: number;
  icon: LucideIcon;
  description: string;
}

export interface CheckoutItem {
  id: string;
  label: string;
}

export interface ApartmentConfig {
  id: string;
  name: string;
  airbnbUrl: string;
  bookingUrl: string;
  wifiName: string;
  wifiPass: string;
  paymentDetails: string;
  instructions: { title: string; content: string }[];
  services: Service[];
  checkoutChecklist: CheckoutItem[];
  features: {
    showReview: boolean;
    showServices: boolean;
    showInstructions: boolean;
    showSos: boolean;
    showCheckout: boolean;
  };
}

export const APARTMENTS: Record<string, ApartmentConfig> = {
  "loft-77": {
    id: "loft-77",
    name: "Loft 77 - Индустриальный дизайн",
    airbnbUrl: "https://airbnb.com/rooms/loft77",
    bookingUrl: "https://booking.com/hotel/loft77",
    wifiName: "Loft77_Guest",
    wifiPass: "industrial2024",
    paymentDetails: "Перевод по номеру телефона +7 (999) 123-45-67 (Тинькофф/Сбер). Пожалуйста, укажите номер квартиры в комментарии.",
    instructions: [
      { title: "🔑 Как попасть внутрь", content: "Код от входной двери: 1234#. Ключ от квартиры находится в сейфе (код 0000) справа от двери." },
      { title: "🌡️ Отопление и кондиционер", content: "Панель управления находится на стене в гостиной. Оптимальная температура 22°C." },
      { title: "🗑️ Мусор", content: "Контейнеры расположены во дворе, за черными воротами. Пожалуйста, сортируйте пластик." },
      { title: "☕ Кофемашина", content: "Используйте только фильтрованную воду. Капсулы Nespresso находятся в верхнем ящике." },
      { title: "🚪 Выезд", content: "Когда будете уезжать, пожалуйста, воспользуйтесь кнопкой 'Оформить выезд' на главной панели и следуйте чек-листу. Это поможет нам подготовиться к следующему гостю!" }
    ],
    services: [
      { id: "late-checkout", name: "Поздний выезд", price: 20, icon: Clock, description: "До 15:00 вместо 12:00" },
      { id: "white-noise", name: "Генератор белого шума", price: 10, icon: Volume2, description: "Аренда качественного генератора белого шума" },
      { id: "vpn", name: "Доступ к VPN", price: 15, icon: ShieldCheck, description: "Безопасный доступ во время вашего пребывания" },
      { id: "ai-guide", name: "AI Гид", price: 10, icon: Map, description: "Персональный локальный гид на базе ИИ" },
    ],
    checkoutChecklist: [
      { id: "lights", label: "Свет и кондиционер выключены" },
      { id: "windows", label: "Окна закрыты" },
      { id: "trash", label: "Мусор вынесен" },
      { id: "keys", label: "Ключи оставлены в сейфе/на столе" }
    ],
    features: {
      showReview: true,
      showServices: true,
      showInstructions: true,
      showSos: true,
      showCheckout: true
    }
  },
  "ocean-view": {
    id: "ocean-view",
    name: "Ocean View Residence",
    airbnbUrl: "https://airbnb.com/rooms/oceanview",
    bookingUrl: "https://booking.com/hotel/oceanview",
    wifiName: "Ocean_Resort",
    wifiPass: "sunset2024",
    paymentDetails: "Перевод на +7 (900) 000-00-00. Пожалуйста, укажите 'Ocean View' в примечании.",
    instructions: [
      { title: "🔑 Доступ", content: "Код от смарт-замка отправлен на вашу электронную почту. Карта-ключ лежит на кухонном столе." },
      { title: "🏊 Бассейн и спортзал", content: "Расположены на 2-м этаже. Открыты с 7:00 до 22:00. Используйте вашу карту-ключ." },
      { title: "🚪 Выезд", content: "Пожалуйста, не забудьте нажать кнопку 'Оформить выезд' на панели перед уходом. Спасибо!" }
    ],
    services: [
      { id: "late-checkout", name: "Поздний выезд", price: 25, icon: Clock, description: "До 16:00" },
      { id: "ai-guide", name: "AI Локальный гид", price: 12, icon: Map, description: "Лучшие скрытые места поблизости" },
    ],
    checkoutChecklist: [
      { id: "lights", label: "Свет выключен" },
      { id: "ac", label: "Кондиционер выключен" },
      { id: "dishes", label: "Посуда вымыта" },
      { id: "trash", label: "Мусор в баке" },
      { id: "door", label: "Дверь заперта" }
    ],
    features: {
      showReview: true,
      showServices: true,
      showInstructions: true,
      showSos: true,
      showCheckout: true
    }
  }
};

export const getApartment = (id: string | undefined) => {
  return id ? APARTMENTS[id] : undefined;
};
