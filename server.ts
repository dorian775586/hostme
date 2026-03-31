import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

// Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || "623203896";
const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });
  } catch (err) {
    console.error("Error sending TG message:", err);
  }
}

async function handleBotUpdates() {
  if (!BOT_TOKEN) return;
  let offset = 0;

  setInterval(async () => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`);
      const data: any = await response.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const message = update.message;
          const callbackQuery = update.callback_query;

          if (message) {
            const chatId = message.chat.id;
            const text = message.text || "";

            // ADMIN LOGIC
            if (chatId.toString() === ADMIN_ID) {
              if (text === "/start" || text === "/admin") {
                const { data: hosts } = await supabase.from("hosts").select("*");
                if (!hosts || hosts.length === 0) {
                  await sendTelegramMessage(chatId, "📭 Список хостов пуст.");
                } else {
                  let list = "👥 *Список хостов:*\n\n";
                  for (const host of hosts) {
                    const status = host.is_active ? "✅ Активен" : "❌ Выключен";
                    const until = new Date(host.subscription_until).toLocaleDateString();
                    list += `🏠 *${host.object_id}*\nStatus: ${status}\nUntil: ${until}\n\n`;
                    
                    await sendTelegramMessage(chatId, `Управление: *${host.object_id}*`, {
                      inline_keyboard: [
                        [
                          { text: host.is_active ? "🔴 Выключить" : "🟢 Включить", callback_data: `toggle_${host.id}` },
                          { text: "📅 +30 дней", callback_data: `extend_${host.id}` }
                        ],
                        [{ text: "🗑 Удалить", callback_data: `delete_${host.id}` }]
                      ]
                    });
                  }
                }
              }
            } else {
              // HOST LOGIC
              const { data: host } = await supabase.from("hosts").select("*").eq("telegram_id", chatId).single();

              if (!host) {
                if (text.startsWith("/start ")) {
                  const objectId = text.split(" ")[1];
                  // Check if objectId exists in DB but has no telegram_id
                  const { data: existing } = await supabase.from("hosts").select("*").eq("object_id", objectId).single();
                  if (existing && !existing.telegram_id) {
                    await supabase.from("hosts").update({ telegram_id: chatId }).eq("id", existing.id);
                    await sendTelegramMessage(chatId, `✅ Привет! Вы привязаны к объекту: *${objectId}*`);
                    await sendTelegramMessage(ADMIN_ID, `🔔 Новый хост подключился к объекту: *${objectId}*`);
                  } else {
                    await sendTelegramMessage(chatId, "❌ Объект не найден или уже привязан.");
                  }
                } else {
                  await sendTelegramMessage(chatId, "👋 Добро пожаловать! Пожалуйста, используйте ссылку от администратора для входа.");
                }
              } else {
                // Host Menu
                if (text === "/start" || text === "Меню") {
                  await sendTelegramMessage(chatId, "🛠 *Меню управления:*", {
                    keyboard: [
                      [{ text: "📡 Изменить Wi-Fi" }, { text: "📖 Мои инструкции" }],
                      [{ text: "🚫 Черный список" }, { text: "⚙️ Настройки" }]
                    ],
                    resize_keyboard: true
                  });
                } else if (text === "📡 Изменить Wi-Fi") {
                  await sendTelegramMessage(chatId, "Чтобы изменить Wi-Fi, отправьте сообщение в формате:\n`wifi: Имя_Сети | Пароль` (без кавычек)");
                } else if (text === "📖 Мои инструкции") {
                  const instructions = host.instructions_json || [];
                  if (instructions.length === 0) {
                    await sendTelegramMessage(chatId, "📭 У вас пока нет инструкций. Вы можете добавить их через панель управления (скоро).");
                  } else {
                    let msg = "📖 *Ваши инструкции:*\n\n";
                    instructions.forEach((inst: any, i: number) => {
                      msg += `${i + 1}. *${inst.title}*\n${inst.content}\n\n`;
                    });
                    await sendTelegramMessage(chatId, msg);
                  }
                } else if (text === "🚫 Черный список") {
                  const blacklist = host.blacklist || [];
                  if (blacklist.length === 0) {
                    await sendTelegramMessage(chatId, "✅ Ваш черный список пуст.");
                  } else {
                    let msg = "🚫 *Черный список (номера):*\n\n";
                    blacklist.forEach((phone: string) => {
                      msg += `• \`${phone}\`\n`;
                    });
                    await sendTelegramMessage(chatId, msg);
                  }
                  await sendTelegramMessage(chatId, "Чтобы добавить номер, отправьте:\n`block: +375XXXXXXXXX`\nЧтобы удалить:\n`unblock: +375XXXXXXXXX`", {
                    reply_markup: { remove_keyboard: false }
                  });
                } else if (text === "⚙️ Настройки") {
                  const { data: h } = await supabase.from("hosts").select("show_review, show_services, show_instructions, show_sos").eq("id", host.id).single();
                  const msg = "⚙️ *Настройки функций:*\n\n" +
                    `1. Отзывы: ${h.show_review !== false ? "✅ Вкл" : "❌ Выкл"}\n` +
                    `2. Услуги: ${h.show_services !== false ? "✅ Вкл" : "❌ Выкл"}\n` +
                    `3. Инструкции: ${h.show_instructions !== false ? "✅ Вкл" : "❌ Выкл"}\n` +
                    `4. SOS: ${h.show_sos !== false ? "✅ Вкл" : "❌ Выкл"}\n\n` +
                    "Чтобы изменить, отправьте номер функции (напр. `toggle: 1`)";
                  await sendTelegramMessage(chatId, msg);
                } else if (text.startsWith("toggle: ")) {
                  const num = parseInt(text.replace("toggle: ", "").trim());
                  const fields = ["show_review", "show_services", "show_instructions", "show_sos"];
                  if (num >= 1 && num <= 4) {
                    const field = fields[num - 1];
                    const { data: h } = await supabase.from("hosts").select(field).eq("id", host.id).single();
                    const currentVal = h[field] !== false;
                    await supabase.from("hosts").update({ [field]: !currentVal }).eq("id", host.id);
                    await sendTelegramMessage(chatId, `✅ Настройка "${field}" изменена на ${!currentVal ? "Вкл" : "Выкл"}`);
                  }
                } else if (text.startsWith("wifi: ")) {
                  const parts = text.replace("wifi: ", "").split("|").map((s: string) => s.trim());
                  if (parts.length === 2) {
                    await supabase.from("hosts").update({ wifi_name: parts[0], wifi_password: parts[1] }).eq("id", host.id);
                    await sendTelegramMessage(chatId, "✅ Данные Wi-Fi обновлены!");
                  }
                } else if (text.startsWith("block: ")) {
                  const phone = text.replace("block: ", "").trim();
                  const blacklist = host.blacklist || [];
                  if (!blacklist.includes(phone)) {
                    const newBlacklist = [...blacklist, phone];
                    await supabase.from("hosts").update({ blacklist: newBlacklist }).eq("id", host.id);
                    await sendTelegramMessage(chatId, `🚫 Номер ${phone} добавлен в черный список.`);
                  } else {
                    await sendTelegramMessage(chatId, "ℹ️ Этот номер уже в списке.");
                  }
                } else if (text.startsWith("unblock: ")) {
                  const phone = text.replace("unblock: ", "").trim();
                  const blacklist = host.blacklist || [];
                  if (blacklist.includes(phone)) {
                    const newBlacklist = blacklist.filter((p: string) => p !== phone);
                    await supabase.from("hosts").update({ blacklist: newBlacklist }).eq("id", host.id);
                    await sendTelegramMessage(chatId, `✅ Номер ${phone} удален из черного списка.`);
                  } else {
                    await sendTelegramMessage(chatId, "ℹ️ Этого номера нет в списке.");
                  }
                }
              }
            }
          }

          if (callbackQuery) {
            const adminChatId = callbackQuery.message.chat.id;
            const data = callbackQuery.data;
            const [action, hostId] = data.split("_");

            if (adminChatId.toString() === ADMIN_ID) {
              if (action === "toggle") {
                const { data: h } = await supabase.from("hosts").select("is_active").eq("id", hostId).single();
                await supabase.from("hosts").update({ is_active: !h.is_active }).eq("id", hostId);
                await sendTelegramMessage(adminChatId, "✅ Статус изменен.");
              } else if (action === "extend") {
                const { data: h } = await supabase.from("hosts").select("subscription_until").eq("id", hostId).single();
                const current = new Date(h.subscription_until);
                const next = new Date(current.getTime() + 30 * 24 * 60 * 60 * 1000);
                await supabase.from("hosts").update({ subscription_until: next.toISOString() }).eq("id", hostId);
                await sendTelegramMessage(adminChatId, `✅ Подписка продлена до ${next.toLocaleDateString()}`);
              } else if (action === "delete") {
                await supabase.from("hosts").delete().eq("id", hostId);
                await sendTelegramMessage(adminChatId, "🗑 Хост удален.");
              }
            }
          }
        }
      }
    } catch (err) {
      // Silent error
    }
  }, 3000);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  handleBotUpdates();

  // API Route for Telegram Notifications
  app.post("/api/feedback", async (req, res) => {
    const { type, apartmentId, rating, detailedRatings, liked, disliked, guestName, promoCode, serviceName, price, issue } = req.body;
    
    // apartmentId here is the object_id slug
    const { data: host } = await supabase.from("hosts").select("*").eq("object_id", apartmentId).single();

    if (!host || !host.telegram_id) {
      return res.status(404).json({ error: "Host not found or not connected to Telegram" });
    }

    const targetChatId = host.telegram_id;
    let message = "";

    if (type === "FEEDBACK") {
      const ratingsText = detailedRatings ? Object.entries(detailedRatings)
        .map(([key, val]) => {
          const labels: Record<string, string> = {
            cleanliness: "🧼 Чистота",
            comfort: "🛏️ Комфорт",
            location: "📍 Расположение",
            communication: "💬 Коммуникация",
            value: "💰 Цена/Качество"
          };
          return `${labels[key] || key}: ${val}/5`;
        }).join("\n") : `Общий рейтинг: ${rating}/5`;

      message = `
🌟 *Новый отзыв!*
--------------------------
🏢 *Объект:* ${host.name || apartmentId}
👤 *Гость:* ${guestName || "Анонимно"}
⭐ *Средний балл:* ${rating} / 5

📊 *Детальные оценки:*
${ratingsText}

✅ *Что понравилось:*
${liked || "Не указано"}

❌ *Что улучшить:*
${disliked || "Не указано"}

🎁 *Выдан промокод:* \`${promoCode}\`
      `.trim();
    } else if (type === "SERVICE_PURCHASE") {
      message = `
🛒 *Заказ услуги!*
--------------------------
🏢 *Объект:* ${host.name || apartmentId}
🛠️ *Услуга:* ${serviceName}
💵 *Цена:* $${price}

⚠️ *Ожидание подтверждения оплаты.*
      `.trim();
    } else if (type === "SOS") {
      message = `
🚨 *СРОЧНО: SOS!*
--------------------------
🏢 *Объект:* ${host.name || apartmentId}
🆘 *Проблема:* 
${issue}

🔥 *Свяжитесь с гостем немедленно!*
      `.trim();
    } else if (type === "CHECKOUT") {
      message = `
⚡️ *Гость выехал!*
--------------------------
🏢 *Объект:* ${host.name || apartmentId}

🧹 *Квартира готова к осмотру и уборке. Чек-лист выполнен.*
      `.trim();
    }

    await sendTelegramMessage(targetChatId, message);
    res.json({ success: true });
  });

  // API Route for Photo Uploads to Telegram
  app.post("/api/upload-photo", upload.single("photo"), async (req, res) => {
    const { apartmentId } = req.body;
    const file = req.file;

    if (!BOT_TOKEN) return res.status(500).json({ error: "Bot token missing" });
    if (!file) return res.status(400).json({ error: "No photo provided" });

    const { data: host } = await supabase.from("hosts").select("*").eq("object_id", apartmentId).single();
    if (!host || !host.telegram_id) return res.status(404).json({ error: "Host not found" });

    try {
      const formData = new FormData();
      formData.append("chat_id", host.telegram_id.toString());
      formData.append("caption", `📸 Фото состояния комнат: ${host.name || apartmentId}`);
      
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append("photo", blob, file.originalname);

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to send TG photo");

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
