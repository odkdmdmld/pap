// ضع بيانات مشروع Supabase هنا بعد إنشائه. اتركها فارغة للمعاينة المحلية فقط.
const SUPABASE_URL = "https://qviwuzxlrdkmpqfqkulu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YSxdVYB8BB3e3gfFJly63g_YvIFFuES";
const hasCloud = SUPABASE_URL.startsWith("https://")
  && SUPABASE_ANON_KEY.startsWith("sb_publishable_");
const supabaseLibrary = window.supabase;
const db = hasCloud && supabaseLibrary
  ? supabaseLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
const form=document.getElementById('bookingForm'), service=document.getElementById('service'), dateInput=document.getElementById('date'), timeSelect=document.getElementById('time'), haircut=document.getElementById('haircut'), price=document.getElementById('price'), statusBox=document.getElementById('status'), submit=document.getElementById('submit');
const prices={'قص شعر':5000,'حلاقة ذقن':3000,'قص شعر + ذقن':7000,'تنظيف بشرة':10000};
// رقم واتساب صاحب المحل بصيغة دولية عراقية بدون الصفر الأول
const WHATSAPP_NUMBER = '9647735729779';
document.getElementById('year').textContent=new Date().getFullYear();
dateInput.min=new Date().toISOString().slice(0,10);
service.addEventListener('change',()=>price.textContent=prices[service.value]?prices[service.value].toLocaleString('en-US')+' د.ع':'—');
document.querySelectorAll('.cut').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.cut').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');haircut.value=btn.dataset.cut;document.getElementById('booking').scrollIntoView({behavior:'smooth'});}));
function slots(){timeSelect.innerHTML='<option value="">اختر الوقت</option>';for(let h=10;h<=21;h++){for(const m of [0,30]){if(h===21&&m===30)continue;let t=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');let opt=document.createElement('option');opt.value=t;opt.textContent=t;timeSelect.appendChild(opt)}}}
slots();
form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const d=new FormData(form);const booking={customer_name:d.get('customer_name').trim(),phone:d.get('phone').trim(),service:d.get('service'),haircut:d.get('haircut'),booking_date:d.get('booking_date'),booking_time:d.get('booking_time'),notes:d.get('notes'),price_iqd:prices[d.get('service')]};
if(!db){statusBox.textContent='تعذر الاتصال بخدمة الحجز. تحقق من تحميل مكتبة الاتصال وإعدادات الموقع.';statusBox.style.color='#e6b86d';return;}
submit.disabled=true;submit.textContent='جارٍ إرسال الحجز...';
const {error}=await db.from('bookings').insert([booking]);
submit.disabled=false;submit.textContent='تأكيد الحجز';
if(error){statusBox.textContent=error.code==='23505'?'هذا الموعد محجوز مسبقاً. اختر وقتاً آخر.':'تعذر إرسال الحجز. تحقق من الاتصال أو حاول لاحقاً.';statusBox.style.color='#f19a86';}
else{
  statusBox.textContent='تم حفظ الحجز بنجاح. جارٍ فتح واتساب لإرسال التفاصيل إلى الحلاق...';
  statusBox.style.color='#9fc49d';
  const message = [
    '✂️ حجز جديد - حلاقة',
    'الاسم: ' + booking.customer_name,
    'رقم الزبون: ' + booking.phone,
    'الخدمة: ' + booking.service,
    'القصة: ' + (booking.haircut || 'لم يحدد'),
    'التاريخ: ' + booking.booking_date,
    'الوقت: ' + booking.booking_time,
    'السعر: ' + booking.price_iqd.toLocaleString('en-US') + ' د.ع',
    'ملاحظات: ' + (booking.notes || 'لا توجد'),
    '',
    'تم تسجيل الطلب في موقع حلاقة.'
  ].join('\n');
  const whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  // استخدام نفس الصفحة لتفادي منع نافذة واتساب المنبثقة على بعض الهواتف.
  window.location.href = whatsappUrl;
}
});
