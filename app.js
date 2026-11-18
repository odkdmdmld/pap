// HILAQAH: direct Supabase REST connection (no external supabase-js library required)
const SUPABASE_URL = "https://qviwuzxlrdkmpqfqkulu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YSxdVYB8BB3e3gfFJly63g_YvIFFuES";
const WHATSAPP_NUMBER = "9647735729779"; // Iraq country code + number without leading zero

const form = document.getElementById("bookingForm");
const service = document.getElementById("service");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const haircut = document.getElementById("haircut");
const price = document.getElementById("price");
const statusBox = document.getElementById("status");
const submit = document.getElementById("submit");

const prices = {
  "قص شعر": 5000,
  "حلاقة ذقن": 3000,
  "قص شعر + ذقن": 7000,
  "تنظيف بشرة": 10000
};

document.getElementById("year").textContent = new Date().getFullYear();
dateInput.min = new Date().toISOString().slice(0, 10);

service.addEventListener("change", () => {
  price.textContent = prices[service.value]
    ? prices[service.value].toLocaleString("en-US") + " د.ع"
    : "—";
});

document.querySelectorAll(".cut").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cut").forEach((x) => x.classList.remove("selected"));
    btn.classList.add("selected");
    if (haircut) haircut.value = btn.dataset.cut;
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
  });
});

function fillTimeSlots() {
  timeSelect.innerHTML = '<option value="">اختر الوقت</option>';
  for (let h = 10; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) continue;
      const value = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      timeSelect.appendChild(option);
    }
  }
}
fillTimeSlots();

function showStatus(message, color) {
  statusBox.textContent = message;
  statusBox.style.color = color;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const selectedService = data.get("service");
  const booking = {
    customer_name: String(data.get("customer_name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    service: selectedService,
    haircut: data.get("haircut") || "لم أحدد",
    booking_date: data.get("booking_date"),
    booking_time: data.get("booking_time"),
    notes: data.get("notes") || "",
    price_iqd: prices[selectedService]
  };

  if (!booking.price_iqd) {
    showStatus("يرجى اختيار خدمة صحيحة.", "#f19a86");
    return;
  }

  submit.disabled = true;
  submit.textContent = "جارٍ حفظ الحجز...";
  showStatus("جارٍ الاتصال بقاعدة البيانات وحفظ الحجز...", "#e6b86d");

  try {
    const response = await fetch(SUPABASE_URL + "/rest/v1/bookings", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(booking)
    });

    if (!response.ok) {
      let details = {};
      try { details = await response.json(); } catch (_) {}
      if (response.status === 409 || details.code === "23505") {
        showStatus("هذا الموعد محجوز مسبقاً. اختر وقتاً آخر.", "#f19a86");
      } else if (response.status === 401 || response.status === 403) {
        showStatus("رفضت قاعدة البيانات الإذن. تحقق من مفتاح Publishable وسياسة INSERT لجدول bookings.", "#f19a86");
      } else if (details.code === "42P01" || details.code === "PGRST205") {
        showStatus("جدول bookings غير موجود أو لم يتم نشره في واجهة API. تحقق من جدول الحجوزات في Supabase.", "#f19a86");
      } else {
        showStatus("فشل حفظ الحجز (" + response.status + "): " +
          (details.message || details.details || details.hint || "خطأ غير معروف"), "#f19a86");
      }
      return;
    }

    showStatus("تم حفظ الحجز في قاعدة البيانات. جارٍ فتح واتساب لإرسال التفاصيل...", "#9fc49d");

    const message = [
      "✂️ حجز جديد - حلاقة",
      "الاسم: " + booking.customer_name,
      "رقم الزبون: " + booking.phone,
      "الخدمة: " + booking.service,
      "القصة: " + (booking.haircut || "لم يحدد"),
      "التاريخ: " + booking.booking_date,
      "الوقت: " + booking.booking_time,
      "السعر: " + booking.price_iqd.toLocaleString("en-US") + " د.ع",
      "ملاحظات: " + (booking.notes || "لا توجد"),
      "",
      "تم تسجيل الطلب في موقع حلاقة."
    ].join("\n");

    window.location.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  } catch (error) {
    showStatus("تعذر الوصول إلى Supabase. تحقق من الإنترنت أو جرّب شبكة أخرى. التفاصيل: " +
      (error && error.message ? error.message : "فشل الاتصال"), "#f19a86");
  } finally {
    submit.disabled = false;
    submit.textContent = "تأكيد الحجز";
  }
});
