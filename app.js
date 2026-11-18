
// ==========================================
// HILAQAH - Booking System
// Supabase REST API + WhatsApp
// ==========================================

const SUPABASE_URL = "https://qviwuzxlrdkmpqfqkulu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YSxdVYB8BB3e3gfFJly63g_YvIFFuES";

const WHATSAPP_NUMBER = "9647735729779";

// ==========================================
// HTML ELEMENTS
// ==========================================

const form = document.getElementById("bookingForm");
const service = document.getElementById("service");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const haircut = document.getElementById("haircut");
const price = document.getElementById("price");
const statusBox = document.getElementById("status");
const submit = document.getElementById("submit");

// ==========================================
// SERVICE PRICES
// ==========================================

const prices = {
    "قص شعر": 5000,
    "حلاقة ذقن": 3000,
    "قص شعر + ذقن": 7000,
    "تنظيف بشرة": 10000
};

// ==========================================
// INITIAL SETTINGS
// ==========================================

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// استخدام التاريخ المحلي بدلاً من UTC
const today = new Date();
const localToday =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

if (dateInput) {
    dateInput.min = localToday;
}

// ==========================================
// SERVICE CHANGE
// ==========================================

if (service) {
    service.addEventListener("change", () => {
        price.textContent = prices[service.value]
            ? prices[service.value].toLocaleString("en-US") + " د.ع"
            : "—";
    });
}

// ==========================================
// HAIRCUT SELECTION
// ==========================================

document.querySelectorAll(".cut").forEach((btn) => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".cut").forEach((x) => {
            x.classList.remove("selected");
        });

        btn.classList.add("selected");

        if (haircut) {
            haircut.value = btn.dataset.cut;
        }

        const bookingSection = document.getElementById("booking");

        if (bookingSection) {
            bookingSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    });

});

// ==========================================
// AVAILABLE TIME SLOTS
// ==========================================

function fillTimeSlots() {

    if (!timeSelect) return;

    timeSelect.innerHTML =
        '<option value="">اختر الوقت</option>';

    for (let h = 10; h <= 21; h++) {

        for (const m of [0, 30]) {

            if (h === 21 && m === 30) continue;

            const value =
                String(h).padStart(2, "0") +
                ":" +
                String(m).padStart(2, "0");

            const option = document.createElement("option");

            option.value = value;
            option.textContent = value;

            timeSelect.appendChild(option);
        }
    }
}

fillTimeSlots();

// ==========================================
// STATUS MESSAGE
// ==========================================

function showStatus(message, color) {

    if (!statusBox) return;

    statusBox.textContent = message;
    statusBox.style.color = color;
}

// ==========================================
// BOOKING SUBMISSION
// ==========================================

if (form) {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!form.reportValidity()) return;

        const data = new FormData(form);

        const selectedService = String(
            data.get("service") || ""
        ).trim();

        const booking = {

            customer_name: String(
                data.get("customer_name") || ""
            ).trim(),

            phone: String(
                data.get("phone") || ""
            ).trim(),

            service: selectedService,

            haircut: String(
                data.get("haircut") || "لم أحدد"
            ).trim(),

            booking_date: String(
                data.get("booking_date") || ""
            ).trim(),

            booking_time: String(
                data.get("booking_time") || ""
            ).trim(),

            notes: String(
                data.get("notes") || ""
            ).trim(),

            price_iqd: prices[selectedService]

        };

        // التحقق من الخدمة
        if (!booking.price_iqd) {

            showStatus(
                "يرجى اختيار خدمة صحيحة.",
                "#f19a86"
            );

            return;
        }

        // التحقق من البيانات الأساسية
        if (
            booking.customer_name.length < 2 ||
            booking.customer_name.length > 80 ||
            booking.phone.length < 7 ||
            booking.phone.length > 20 ||
            !booking.booking_date ||
            !booking.booking_time
        ) {

            showStatus(
                "يرجى التأكد من إدخال جميع بيانات الحجز بصورة صحيحة.",
                "#f19a86"
            );

            return;
        }

        // منع الضغط المتكرر
        submit.disabled = true;
        submit.textContent = "جارٍ حفظ الحجز...";

        showStatus(
            "جارٍ الاتصال بقاعدة البيانات...",
            "#e6b86d"
        );

        try {

            // ==================================
            // SEND BOOKING TO SUPABASE
            // ==================================

            const response = await fetch(
                SUPABASE_URL + "/rest/v1/bookings",
                {
                    method: "POST",

                    headers: {

                        "apikey": SUPABASE_PUBLISHABLE_KEY,

                        "Content-Type": "application/json",

                        "Prefer": "return=minimal"

                    },

                    body: JSON.stringify(booking)
                }
            );

            // ==================================
            // HANDLE DATABASE ERRORS
            // ==================================

            if (!response.ok) {

                let details = {};

                try {
                    details = await response.json();
                } catch (error) {
                    details = {};
                }

                console.error(
                    "Supabase Error:",
                    response.status,
                    details
                );

                if (
                    response.status === 409 ||
                    details.code === "23505"
                ) {

                    showStatus(
                        "هذا الموعد محجوز مسبقاً. يرجى اختيار وقت آخر.",
                        "#f19a86"
                    );

                } else if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    showStatus(
                        "رفضت قاعدة البيانات الطلب. رمز الخطأ: " +
                        response.status +
                        " | " +
                        (details.message || details.code || "تحقق من المفتاح وصلاحيات INSERT"),
                        "#f19a86"
                    );

                } else if (
                    details.code === "42P01" ||
                    details.code === "PGRST205"
                ) {

                    showStatus(
                        "جدول bookings غير موجود أو غير متاح عبر API.",
                        "#f19a86"
                    );

                } else {

                    showStatus(
                        "فشل حفظ الحجز (" +
                        response.status +
                        "): " +
                        (
                            details.message ||
                            details.details ||
                            details.hint ||
                            details.code ||
                            "خطأ غير معروف"
                        ),
                        "#f19a86"
                    );

                }

                return;
            }

            // ==================================
            // SUCCESS - DATABASE
            // ==================================

            showStatus(
                "تم حفظ الحجز بنجاح. جارٍ فتح واتساب...",
                "#9fc49d"
            );

            // ==================================
            // WHATSAPP MESSAGE
            // ==================================

            const message = [

                "✂️ حجز جديد - حلاقة",

                "الاسم: " + booking.customer_name,

                "رقم الزبون: " + booking.phone,

                "الخدمة: " + booking.service,

                "القصة: " + booking.haircut,

                "التاريخ: " + booking.booking_date,

                "الوقت: " + booking.booking_time,

                "السعر: " +
                booking.price_iqd.toLocaleString("en-US") +
                " د.ع",

                "ملاحظات: " +
                (booking.notes || "لا توجد"),

                "",

                "تم تسجيل الحجز في موقع حلاقة."

            ].join("\n");

            const whatsappURL =
                "https://wa.me/" +
                WHATSAPP_NUMBER +
                "?text=" +
                encodeURIComponent(message);

            // فتح واتساب بعد نجاح الحفظ
            window.location.href = whatsappURL;

        } catch (error) {

            console.error(
                "Connection Error:",
                error
            );

            showStatus(
                "تعذر الاتصال بقاعدة البيانات. تحقق من الإنترنت. التفاصيل: " +
                (error.message || "فشل الاتصال"),
                "#f19a86"
            );

        } finally {

            submit.disabled = false;
            submit.textContent = "تأكيد الحجز";

        }

    });

}
