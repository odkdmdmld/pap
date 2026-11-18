// ضع بيانات مشروع Supabase هنا بعد إنشائه. اتركها فارغة للمعاينة المحلية فقط.
const SUPABASE_URL = "ضع_رابط_المشروع_هنا";
const SUPABASE_ANON_KEY = "ضع_مفتاح_anon_public_هنا";
const hasCloud = SUPABASE_URL.startsWith("https://") && !SUPABASE_ANON_KEY.includes("ضع_");
const db = hasCloud && window.supabase ? window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY) : null;
const form=document.getElementById('bookingForm'), service=document.getElementById('service'), dateInput=document.getElementById('date'), timeSelect=document.getElementById('time'), haircut=document.getElementById('haircut'), price=document.getElementById('price'), statusBox=document.getElementById('status'), submit=document.getElementById('submit');
const prices={'قص شعر':5000,'حلاقة ذقن':3000,'قص شعر + ذقن':7000,'تنظيف بشرة':10000};
document.getElementById('year').textContent=new Date().getFullYear();
dateInput.min=new Date().toISOString().slice(0,10);
service.addEventListener('change',()=>price.textContent=prices[service.value]?prices[service.value].toLocaleString('en-US')+' د.ع':'—');
document.querySelectorAll('.cut').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.cut').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');haircut.value=btn.dataset.cut;document.getElementById('booking').scrollIntoView({behavior:'smooth'});}));
function slots(){timeSelect.innerHTML='<option value="">اختر الوقت</option>';for(let h=10;h<=21;h++){for(const m of [0,30]){if(h===21&&m===30)continue;let t=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');let opt=document.createElement('option');opt.value=t;opt.textContent=t;timeSelect.appendChild(opt)}}}
slots();
form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const d=new FormData(form);const booking={customer_name:d.get('customer_name').trim(),phone:d.get('phone').trim(),service:d.get('service'),haircut:d.get('haircut'),booking_date:d.get('booking_date'),booking_time:d.get('booking_time'),notes:d.get('notes'),price_iqd:prices[d.get('service')]};
if(!db){statusBox.textContent='الموقع حالياً في وضع المعاينة. اربط قاعدة Supabase حتى تُحفظ الحجوزات فعلياً.';statusBox.style.color='#e6b86d';return;}
submit.disabled=true;submit.textContent='جارٍ إرسال الحجز...';
const {error}=await db.from('bookings').insert([booking]);
submit.disabled=false;submit.textContent='تأكيد الحجز';
if(error){statusBox.textContent=error.code==='23505'?'هذا الموعد محجوز مسبقاً. اختر وقتاً آخر.':'تعذر إرسال الحجز. تحقق من الاتصال أو حاول لاحقاً.';statusBox.style.color='#f19a86';}
else{statusBox.textContent='تم استلام طلب الحجز بنجاح. احتفظ برقم هاتفك للتواصل بشأن الموعد.';statusBox.style.color='#9fc49d';form.reset();price.textContent='—';slots();}
});
