import { db } from "./firebase-config.js";
import { showMessage } from "./shared.js";
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ===== الإعدادات =====
const ORANGE_CASH_NUMBER = "01289686163";
const COURSE_PRICE       = 1000;   // السعر بعد الخصم
const COURSE_OLD_PRICE   = 1500;   // السعر قبل الخصم
const SUPPORT_NUMBER     = "01026487324";
const SUPPORT_WA         = "201026487324"; // للرابط

// ===============================================

function generateBookingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "BAC-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ===================================================
//  1. فورم التسجيل الرئيسي
// ===================================================
export function openFreeCourseModal() {
  const bookingId = generateBookingId();

  const modal = document.createElement("div");
  modal.id = "fc-modal";
  modal.className = "fixed inset-0 bg-black/95 z-50 overflow-y-auto flex items-start justify-center p-4 py-8";

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl w-full max-w-xl glass-card overflow-hidden">

      <!-- Header -->
      <div class="relative bg-gradient-to-l from-violet-700 via-purple-700 to-fuchsia-700 p-6 text-center">
        <button id="fc-close" class="absolute top-4 left-4 text-white/60 hover:text-white">
          <i class="fas fa-times text-xl"></i>
        </button>
        <div class="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full mb-3">
          <i class="fas fa-tag"></i> خصم خاص — وفّر ${COURSE_OLD_PRICE - COURSE_PRICE} جنيه
        </div>
        <h2 class="text-2xl font-black text-white">كورس البرمجة والذكاء الاصطناعي</h2>
        <p class="text-white/70 text-sm mt-1">نظام البكالوريا — حصريًا لطلاب الصف الأول الثانوي</p>
        <div class="mt-3 bg-white/10 rounded-xl px-4 py-2 inline-block text-sm">
          <span class="line-through text-white/40 ml-1">${COURSE_OLD_PRICE} ج</span>
          <span class="text-yellow-300 font-black">${COURSE_PRICE} جنيه</span>
          <span class="text-white/50 mr-2">| رقم حجزك:</span>
          <span class="text-yellow-300 font-black font-mono">${bookingId}</span>
        </div>
      </div>

      <!-- Progress Tabs -->
      <div class="flex bg-slate-900 text-xs font-bold">
        <div id="fct-1" class="flex-1 py-2 text-center text-purple-400 border-b-2 border-purple-500">بياناتك</div>
        <div id="fct-2" class="flex-1 py-2 text-center text-slate-500 border-b-2 border-slate-700">الدفع</div>
        <div id="fct-3" class="flex-1 py-2 text-center text-slate-500 border-b-2 border-slate-700">تأكيد</div>
      </div>

      <!-- ===== Step 1: بيانات الطالب ===== -->
      <div id="fc-s1" class="p-6 space-y-4">
        <p class="text-purple-400 font-bold text-sm"><i class="fas fa-user-graduate ml-2"></i>بيانات الطالب</p>

        <div>
          <label class="fc-lbl">الاسم الثلاثي <span class="text-red-400">*</span></label>
          <input id="fc-name" type="text" placeholder="مثال: أحمد محمد علي" class="fc-inp">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="fc-lbl">تاريخ الميلاد <span class="text-red-400">*</span></label>
            <input id="fc-dob" type="date" class="fc-inp">
          </div>
          <div>
            <label class="fc-lbl">اسم المدرسة <span class="text-red-400">*</span></label>
            <input id="fc-school" type="text" placeholder="مدرسة..." class="fc-inp">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="fc-lbl">موبايل الطالب <span class="text-red-400">*</span></label>
            <input id="fc-phone" type="tel" placeholder="01XXXXXXXXX" class="fc-inp">
          </div>
          <div>
            <label class="fc-lbl">موبايل ولي الأمر <span class="text-red-400">*</span></label>
            <input id="fc-pphone" type="tel" placeholder="01XXXXXXXXX" class="fc-inp">
          </div>
        </div>
        <div>
          <label class="fc-lbl">العنوان <span class="text-red-400">*</span></label>
          <input id="fc-addr" type="text" placeholder="مثال: الإسكندرية — المنتزه" class="fc-inp">
        </div>

        <button id="fc-next1" class="fc-btn-primary w-full mt-2">
          التالي: الدفع <i class="fas fa-arrow-left mr-2"></i>
        </button>
      </div>

      <!-- ===== Step 2: الدفع ===== -->
      <div id="fc-s2" class="p-6 hidden">

        <!-- بطاقة تعليمات الدفع -->
        <div class="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 mb-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
              <i class="fas fa-mobile-alt text-white text-lg"></i>
            </div>
            <div>
              <p class="font-black text-white">أورنج كاش</p>
              <p class="text-orange-400 text-xs">حوّل قيمة الكورس على الرقم التالي</p>
            </div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-4 text-center mb-3">
            <p class="text-slate-400 text-xs mb-1">رقم أورنج كاش</p>
            <p class="text-2xl font-black text-orange-400 tracking-widest">${ORANGE_CASH_NUMBER}</p>
            <p class="text-slate-400 text-xs mt-2">
              المبلغ: <span class="line-through text-slate-500">${COURSE_OLD_PRICE} ج</span>
              <span class="text-white font-black"> ${COURSE_PRICE} جنيه</span>
            </p>
          </div>
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
            <p class="text-yellow-400 text-sm font-bold">
              <i class="fas fa-tag ml-2"></i>اكتب رقم حجزك في ملاحظات التحويل:
              <span class="text-white font-black"> ${bookingId}</span>
            </p>
          </div>
        </div>

        <!-- الخطوات -->
        <div class="space-y-2 mb-5">
          ${[
            `افتح تطبيق أورنج أو اتصل *100*6#`,
            `حوّل ${COURSE_PRICE} جنيه على ${ORANGE_CASH_NUMBER}`,
            `اكتب رقم حجزك <b class="text-yellow-400">${bookingId}</b> في ملاحظات التحويل`,
            `صوّر الإيصال ثم أكمل البيانات أدناه`
          ].map((s,i) => `
          <div class="flex items-start gap-3 text-sm text-slate-300">
            <span class="w-6 h-6 bg-purple-600/30 text-purple-400 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">${i+1}</span>
            <span>${s}</span>
          </div>`).join("")}
        </div>

        <!-- بيانات التحويل -->
        <p class="text-slate-300 font-bold text-sm mb-3"><i class="fas fa-fill-drip ml-2 text-orange-400"></i>بيانات التحويل:</p>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="fc-lbl">رقم المُحوِّل <span class="text-red-400">*</span></label>
              <input id="fc-pp" type="tel" placeholder="01XXXXXXXXX" class="fc-inp">
            </div>
            <div>
              <label class="fc-lbl">وقت التحويل <span class="text-red-400">*</span></label>
              <input id="fc-pt" type="time" class="fc-inp">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="fc-lbl">المبلغ المُحوَّل <span class="text-red-400">*</span></label>
              <input id="fc-pa" type="number" placeholder="${COURSE_PRICE}" class="fc-inp">
            </div>
            <div>
              <label class="fc-lbl">آخر 4 أرقام العملية</label>
              <input id="fc-pr" type="text" placeholder="مثال: 4571" maxlength="4" class="fc-inp">
            </div>
          </div>
          <div>
            <label class="fc-lbl">صورة إيصال التحويل <span class="text-red-400">*</span></label>
            <label id="fc-drop" class="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-xl p-5 cursor-pointer transition bg-slate-900/30">
              <i id="fc-icon" class="fas fa-cloud-upload-alt text-3xl text-slate-500 mb-2"></i>
              <span id="fc-rlabel" class="text-slate-400 text-sm">اضغط لرفع صورة الإيصال</span>
              <span class="text-slate-600 text-xs mt-1">PNG, JPG, JPEG</span>
              <input type="file" id="fc-receipt" accept="image/*" class="hidden">
            </label>
            <img id="fc-preview" class="hidden w-full rounded-xl mt-3 max-h-44 object-contain border border-slate-600">
          </div>
        </div>

        <div class="flex gap-3 mt-5">
          <button id="fc-back1" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition">
            <i class="fas fa-arrow-right ml-2"></i> رجوع
          </button>
          <button id="fc-submit" class="flex-1 fc-btn-primary flex items-center justify-center gap-2">
            <i class="fas fa-paper-plane"></i> إرسال الطلب
          </button>
        </div>
      </div>

      <!-- ===== Step 3: انتظار الموافقة ===== -->
      <div id="fc-s3" class="p-8 text-center hidden">
        <div class="w-20 h-20 bg-yellow-500/20 border-2 border-yellow-500/40 rounded-full flex items-center justify-center mx-auto mb-5">
          <i class="fas fa-hourglass-half text-yellow-400 text-3xl"></i>
        </div>
        <h3 class="text-xl font-black text-white mb-2">في انتظار موافقة المنصة</h3>
        <p class="text-slate-400 text-sm mb-5">خلال <span class="text-yellow-400 font-bold">24 ساعة</span> هيتم التأكيد وفتح الكورس الخاص بك بكود التفعيل</p>

        <!-- رقم الحجز -->
        <div class="bg-slate-700/50 border border-slate-600 rounded-2xl p-5 mb-5">
          <p class="text-slate-400 text-xs mb-2">رقم حجزك — احتفظ بيه</p>
          <p class="text-3xl font-black text-yellow-400 font-mono tracking-widest" id="fc-display-id">${bookingId}</p>
          <button id="fc-copy-id" class="mt-3 text-xs text-slate-400 hover:text-white flex items-center gap-2 mx-auto transition">
            <i class="fas fa-copy"></i> نسخ رقم الحجز
          </button>
        </div>

        <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-400 text-right space-y-2 mb-5">
          <p><i class="fas fa-check-circle text-emerald-400 ml-2"></i>تم استلام طلب تسجيلك</p>
          <p><i class="fas fa-clock text-yellow-400 ml-2"></i>جاري مراجعة بيانات الدفع</p>
          <p><i class="fas fa-lock text-slate-500 ml-2"></i>سيُرسَل كود التفعيل بعد التأكيد</p>
        </div>

        <!-- ===== زر جديد: دخول إلى الكورس ===== -->
        <a href="course.html" target="_blank"
           class="inline-block w-full bg-gradient-to-l from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white py-3 rounded-2xl font-black text-lg transition-all duration-300 shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 mb-4">
          <i class="fas fa-play-circle ml-2"></i> دخول إلى الكورس
        </a>

        <p class="text-slate-500 text-xs mb-5">
          في حالة وجود أي مشكلة تواصل مع الدعم الفني:<br>
          <a href="https://wa.me/2${SUPPORT_WA}" target="_blank"
             class="text-emerald-400 font-bold hover:underline">
            <i class="fab fa-whatsapp ml-1"></i>${SUPPORT_NUMBER}
          </a>
        </p>

        <div class="flex gap-3">
          <button id="fc-check-btn" class="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition">
            <i class="fas fa-key ml-2"></i> عندي رقم حجز — أريد كود التفعيل
          </button>
          <button id="fc-close2" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition">إغلاق</button>
        </div>
      </div>

    </div>

    <style>
      .fc-lbl { display:block; font-size:0.78rem; color:#94a3b8; margin-bottom:0.3rem; }
      .fc-inp {
        width:100%; padding:0.65rem 1rem; border-radius:0.75rem;
        background:#1e293b; border:1px solid #334155; color:#fff;
        outline:none; transition:border 0.2s; font-family:'Cairo',sans-serif;
      }
      .fc-inp:focus { border-color:#a855f7; box-shadow:0 0 0 2px rgba(168,85,247,0.2); }
      .fc-btn-primary {
        background: linear-gradient(to left, #7c3aed, #a855f7);
        color:white; padding:0.75rem 1.5rem; border-radius:0.75rem;
        font-weight:900; transition:opacity 0.2s;
        box-shadow:0 4px 15px rgba(124,58,237,0.3);
      }
      .fc-btn-primary:hover { opacity:0.9; }
      .fc-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    </style>
  `;

  document.body.appendChild(modal);

  // ===== Tabs =====
  const tabs = [modal.querySelector("#fct-1"), modal.querySelector("#fct-2"), modal.querySelector("#fct-3")];
  const steps = [modal.querySelector("#fc-s1"), modal.querySelector("#fc-s2"), modal.querySelector("#fc-s3")];

  function goStep(n) {
    steps.forEach((s,i) => s.classList.toggle("hidden", i !== n));
    tabs.forEach((t,i) => {
      const done    = i < n;
      const current = i === n;
      t.className = `flex-1 py-2 text-center text-xs font-bold border-b-2 transition ${
        current ? "text-purple-400 border-purple-500" :
        done    ? "text-emerald-400 border-emerald-500" :
                  "text-slate-500 border-slate-700"
      }`;
    });
  }

  // Close
  modal.querySelector("#fc-close").addEventListener("click",  () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

  // ---- Step 1 → 2 ----
  modal.querySelector("#fc-next1").addEventListener("click", () => {
    const name   = modal.querySelector("#fc-name").value.trim();
    const dob    = modal.querySelector("#fc-dob").value;
    const school = modal.querySelector("#fc-school").value.trim();
    const phone  = modal.querySelector("#fc-phone").value.trim();
    const pphone = modal.querySelector("#fc-pphone").value.trim();
    const addr   = modal.querySelector("#fc-addr").value.trim();
    if (!name || !dob || !school || !phone || !pphone || !addr) {
      showMessage("⚠️ من فضلك أكمل جميع الحقول المطلوبة", "error"); return;
    }
    goStep(1);
  });

  modal.querySelector("#fc-back1").addEventListener("click", () => goStep(0));

  // Receipt upload
  let receiptBase64 = null;
  modal.querySelector("#fc-drop").addEventListener("click", () => modal.querySelector("#fc-receipt").click());
  modal.querySelector("#fc-receipt").addEventListener("change", () => {
    const file = modal.querySelector("#fc-receipt").files[0];
    if (!file) return;
    new Promise(res => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.readAsDataURL(file);
    }).then(b64 => {
      receiptBase64 = b64;
      const prev = modal.querySelector("#fc-preview");
      prev.src = b64; prev.classList.remove("hidden");
      modal.querySelector("#fc-rlabel").textContent = file.name;
      modal.querySelector("#fc-icon").className = "fas fa-check-circle text-3xl text-emerald-400 mb-2";
    });
  });

  // ---- Submit ----
  modal.querySelector("#fc-submit").addEventListener("click", async () => {
    const pp = modal.querySelector("#fc-pp").value.trim();
    const pt = modal.querySelector("#fc-pt").value;
    const pa = modal.querySelector("#fc-pa").value;
    if (!pp || !pt || !pa) { showMessage("⚠️ أدخل بيانات التحويل", "error"); return; }
    if (!receiptBase64)    { showMessage("⚠️ ارفع صورة الإيصال", "error"); return; }

    const btn = modal.querySelector("#fc-submit");
    btn.innerHTML = `<i class="fas fa-spinner fa-spin ml-2"></i> جاري الإرسال...`;
    btn.disabled = true;

    try {
      await addDoc(collection(db, "free_course_regs"), {
        bookingId,
        courseName:  "كورس البرمجة والذكاء الاصطناعي — نظام البكالوريا",
        coursePrice: COURSE_PRICE,
        name:        modal.querySelector("#fc-name").value.trim(),
        dateOfBirth: modal.querySelector("#fc-dob").value,
        school:      modal.querySelector("#fc-school").value.trim(),
        phone:       modal.querySelector("#fc-phone").value.trim(),
        parentPhone: modal.querySelector("#fc-pphone").value.trim(),
        address:     modal.querySelector("#fc-addr").value.trim(),
        payment: {
          phone:        pp,
          time:         pt,
          amount:       pa,
          refLast4:     modal.querySelector("#fc-pr").value.trim() || null,
          receiptImage: receiptBase64,
        },
        status:          "pending",       // ⏳ ينتظر موافقة الأدمن
        activationCode:  null,            // الأدمن هو اللي بيملأه
        codeRevealedAt:  null,
        createdAt:       serverTimestamp(),
      });

      goStep(2);
    } catch (err) {
      console.error(err);
      showMessage("❌ خطأ في الإرسال، حاول مرة أخرى", "error");
      btn.innerHTML = `<i class="fas fa-paper-plane ml-2"></i> إرسال الطلب`;
      btn.disabled = false;
    }
  });

  // Copy booking ID
  modal.querySelector("#fc-copy-id").addEventListener("click", () => {
    navigator.clipboard.writeText(bookingId).then(() => {
      showMessage("✅ تم نسخ رقم الحجز!", "success");
    });
  });

  // Close step 3
  modal.querySelector("#fc-close2").addEventListener("click", () => modal.remove());

  // ---- Check activation code button ----
  modal.querySelector("#fc-check-btn").addEventListener("click", () => {
    modal.remove();
    openActivationCheck();
  });
}


// ===================================================
//  2. شاشة استرجاع كود التفعيل (بعد موافقة الأدمن)
// ===================================================
export function openActivationCheck() {
  const modal = document.createElement("div");
  modal.id = "fc-check-modal";
  modal.className = "fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4";

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl w-full max-w-sm glass-card overflow-hidden">
      <div class="bg-gradient-to-l from-violet-700 to-purple-700 p-5 text-center relative">
        <button id="fcc-close" class="absolute top-4 left-4 text-white/60 hover:text-white"><i class="fas fa-times"></i></button>
        <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <i class="fas fa-key text-white text-xl"></i>
        </div>
        <h3 class="text-lg font-black text-white">كود التفعيل</h3>
        <p class="text-white/60 text-xs mt-1">ادخل رقم حجزك لعرض الكود</p>
      </div>

      <div id="fcc-form" class="p-6 space-y-4">
        <div>
          <label class="fc-lbl">رقم الحجز <span class="text-red-400">*</span></label>
          <input id="fcc-bid" type="text" placeholder="BAC-XXXXXX" maxlength="10"
            class="fc-inp text-center text-lg font-mono tracking-widest uppercase">
        </div>
        <div>
          <label class="fc-lbl">رقم موبايلك (للتحقق) <span class="text-red-400">*</span></label>
          <input id="fcc-phone" type="tel" placeholder="01XXXXXXXXX" class="fc-inp">
        </div>
        <button id="fcc-check" class="fc-btn-primary w-full flex items-center justify-center gap-2">
          <i class="fas fa-search"></i> عرض الكود
        </button>
        <p class="text-slate-500 text-xs text-center">
          مشكلة؟ تواصل مع الدعم:
          <a href="https://wa.me/2${SUPPORT_WA}" target="_blank" class="text-emerald-400 hover:underline">${SUPPORT_NUMBER}</a>
        </p>
      </div>

      <!-- نتيجة: انتظار -->
      <div id="fcc-pending" class="p-6 text-center hidden">
        <div class="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-hourglass-half text-yellow-400 text-2xl"></i>
        </div>
        <h4 class="font-black text-white text-lg mb-2">في انتظار موافقة المنصة</h4>
        <p class="text-slate-400 text-sm mb-4">طلبك قيد المراجعة، خلال 24 ساعة سيُفعَّل الكورس.</p>
        <p class="text-slate-500 text-xs">
          للاستفسار: <a href="https://wa.me/2${SUPPORT_WA}" target="_blank" class="text-emerald-400 hover:underline">${SUPPORT_NUMBER}</a>
        </p>
        <button id="fcc-back-pending" class="mt-4 text-slate-400 hover:text-white text-sm transition">← رجوع</button>
      </div>

      <!-- نتيجة: مرفوض -->
      <div id="fcc-rejected" class="p-6 text-center hidden">
        <div class="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-400 text-2xl"></i>
        </div>
        <h4 class="font-black text-white text-lg mb-2">تعذّر تأكيد الدفع</h4>
        <p class="text-slate-400 text-sm mb-4">تواصل مع الدعم الفني لحل المشكلة.</p>
        <a href="https://wa.me/2${SUPPORT_WA}" target="_blank"
           class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-sm transition">
          <i class="fab fa-whatsapp"></i> تواصل مع الدعم
        </a>
        <button id="fcc-back-rejected" class="block mx-auto mt-3 text-slate-400 hover:text-white text-sm transition">← رجوع</button>
      </div>

      <!-- نتيجة: تم التفعيل ✅ -->
      <div id="fcc-success" class="p-6 text-center hidden">
        <div class="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-check-circle text-emerald-400 text-3xl"></i>
        </div>
        <h4 class="font-black text-white text-xl mb-1">تم تأكيد دفعك! 🎉</h4>
        <p class="text-slate-400 text-sm mb-5">استخدم كود التفعيل أدناه لفتح الكورس</p>

        <!-- الكود -->
        <div class="bg-gradient-to-l from-purple-900/60 to-violet-900/60 border-2 border-purple-500/50 rounded-2xl p-5 mb-4">
          <p class="text-slate-400 text-xs mb-2">كود التفعيل الخاص بك</p>
          <p id="fcc-code-display" class="text-3xl font-black text-white font-mono tracking-[0.25em] mb-3"></p>
          <button id="fcc-copy-code" class="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 mx-auto">
            <i class="fas fa-copy"></i> نسخ الكود
          </button>
        </div>

        <div class="bg-slate-900/50 rounded-xl p-3 text-xs text-slate-400 text-right space-y-1 mb-4">
          <p><i class="fas fa-info-circle text-blue-400 ml-2"></i>هذا الكود خاص بك، لا تشاركه مع أحد</p>
          <p><i class="fas fa-video text-purple-400 ml-2"></i>سيفتح كامل محتوى الكورس فور إدخاله</p>
        </div>

        <!-- ===== زر جديد: دخول إلى الكورس ===== -->
        <a href="course.html" target="_blank"
           class="inline-block w-full bg-gradient-to-l from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white py-3 rounded-2xl font-black text-lg transition-all duration-300 shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 mb-4">
          <i class="fas fa-play-circle ml-2"></i> دخول إلى الكورس
        </a>

        <p class="text-slate-500 text-xs">
          مشكلة في الكود؟
          <a href="https://wa.me/2${SUPPORT_WA}" target="_blank" class="text-emerald-400 hover:underline">${SUPPORT_NUMBER}</a>
        </p>

        <button id="fcc-done" class="mt-4 bg-slate-700 hover:bg-slate-600 text-white px-8 py-2 rounded-xl font-bold text-sm transition">إغلاق</button>
      </div>

    </div>

    <style>
      .fc-lbl { display:block; font-size:0.78rem; color:#94a3b8; margin-bottom:0.3rem; }
      .fc-inp {
        width:100%; padding:0.65rem 1rem; border-radius:0.75rem;
        background:#1e293b; border:1px solid #334155; color:#fff;
        outline:none; transition:border 0.2s; font-family:'Cairo',sans-serif;
      }
      .fc-inp:focus { border-color:#a855f7; box-shadow:0 0 0 2px rgba(168,85,247,0.2); }
      .fc-btn-primary {
        background:linear-gradient(to left,#7c3aed,#a855f7);
        color:white; padding:0.75rem 1.5rem; border-radius:0.75rem;
        font-weight:900; transition:opacity 0.2s;
      }
      .fc-btn-primary:hover { opacity:0.9; }
      .fc-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    </style>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#fcc-close").addEventListener("click",  () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

  // Panels
  const formPanel     = modal.querySelector("#fcc-form");
  const pendingPanel  = modal.querySelector("#fcc-pending");
  const rejectedPanel = modal.querySelector("#fcc-rejected");
  const successPanel  = modal.querySelector("#fcc-success");

  function showPanel(name) {
    [formPanel, pendingPanel, rejectedPanel, successPanel].forEach(p => p.classList.add("hidden"));
    modal.querySelector(`#fcc-${name}`).classList.remove("hidden");
  }

  modal.querySelector("#fcc-back-pending").addEventListener("click",  () => showPanel("form"));
  modal.querySelector("#fcc-back-rejected").addEventListener("click", () => showPanel("form"));
  modal.querySelector("#fcc-done").addEventListener("click",          () => modal.remove());

  // ---- Check activation ----
  modal.querySelector("#fcc-check").addEventListener("click", async () => {
    const bidRaw  = modal.querySelector("#fcc-bid").value.trim().toUpperCase();
    const phone   = modal.querySelector("#fcc-phone").value.trim();
    const btn     = modal.querySelector("#fcc-check");

    if (!bidRaw || !phone) { showMessage("⚠️ أدخل رقم الحجز والموبايل", "error"); return; }

    btn.innerHTML = `<i class="fas fa-spinner fa-spin ml-2"></i> جاري البحث...`;
    btn.disabled  = true;

    try {
      const q = query(
        collection(db, "free_course_regs"),
        where("bookingId", "==", bidRaw)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        showMessage("❌ رقم الحجز غير موجود، تحقق منه", "error");
        btn.innerHTML = `<i class="fas fa-search ml-2"></i> عرض الكود`;
        btn.disabled  = false;
        return;
      }

      const data = snap.docs[0].data();

      if (data.phone !== phone && data.parentPhone !== phone) {
        showMessage("❌ رقم الموبايل غير مطابق", "error");
        btn.innerHTML = `<i class="fas fa-search ml-2"></i> عرض الكود`;
        btn.disabled  = false;
        return;
      }

      if (data.status === "pending") {
        showPanel("pending");
      } else if (data.status === "rejected") {
        showPanel("rejected");
      } else if (data.status === "paid" && data.activationCode) {
        modal.querySelector("#fcc-code-display").textContent = data.activationCode;
        showPanel("success");

        modal.querySelector("#fcc-copy-code").addEventListener("click", () => {
          navigator.clipboard.writeText(data.activationCode).then(() => {
            showMessage("✅ تم نسخ كود التفعيل!", "success");
          });
        });
      } else {
        showPanel("pending");
      }
    } catch (err) {
      console.error(err);
      showMessage("❌ خطأ في الاتصال، حاول مرة أخرى", "error");
    }

    btn.innerHTML = `<i class="fas fa-search ml-2"></i> عرض الكود`;
    btn.disabled  = false;
  });
}

window.openFreeCourseModal  = openFreeCourseModal;
window.openActivationCheck  = openActivationCheck;