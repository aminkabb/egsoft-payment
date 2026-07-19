import { db } from "./firebase-config.js";
import { showMessage } from "./shared.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ===== الإعدادات =====
const ORANGE_CASH_NUMBER = "01289686163"; // ← غيّر لرقمك
const BOOKING_AMOUNT = 100; // ← غيّر للمبلغ المطلوب بالجنيه

const GRADES = [
  { value: "prep1",    label: "أولى إعدادي",    stage: "prep" },
  { value: "prep2",    label: "ثانية إعدادي",   stage: "prep" },
  { value: "prep3",    label: "ثالثة إعدادي",   stage: "prep" },
  { value: "sec1",     label: "أولى ثانوي",     stage: "sec"  },
  { value: "sec2",     label: "ثانية ثانوي",    stage: "sec"  },
  { value: "sec3",     label: "ثالثة ثانوي",    stage: "sec"  },
];

const SUBJECTS = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "اللغة الفرنسية",
  "اللغة الألمانية",
  "اللغة الإسبانية",
  "اللغة الإيطالية",
  "اللغة الصينية",

  "الرياضيات",
  "الجبر",
  "الهندسة",
  "الجبر والهندسة الفراغية",
  "التفاضل",
  "التكامل",
  "التفاضل والتكامل",
  "تطبيقات الرياضيات - الديناميكا",
  "الإحصاء والاقتصاد",

  "العلوم",
  "الأحياء",
  "الكيمياء",
  "الفيزياء",
  "الجيولوجيا وعلوم البيئة",

  "التاريخ",
  "الجغرافيا",
  "الفلسفة",
  "فلسفة ومنطق",
  "علم النفس والاجتماع",
  "الدراسات الاجتماعية",

  "الحاسب الآلي وتكنولوجيا المعلومات",
  "البرمجة وتطوير المواقع",
  "تطبيقات الموبايل",
  "الذكاء الاصطناعي",
  "أمن المعلومات (Cyber Security)",
  "الروبوتكس",
  "Python للمبتدئين",

  "التربية الدينية",
  "التربية الوطنية",
  "التربية الرياضية",
  "التربية الفنية",
  "التربية الموسيقية",

  "مهارات إدارة الأسرة وريادة الأعمال",
  "مهارات الزراعة وريادة الأعمال",
  "مهارات الصناعة وريادة الأعمال",

  "اقتصاد منزلي",

  "أخرى"
];

// ===== توليد رقم حجز فريد =====
function generateBookingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "BK-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ===== الدالة الرئيسية =====
export function openCenterBooking() {
  const bookingId = generateBookingId();

  const modal = document.createElement("div");
  modal.id = "center-booking-modal";
  modal.className = "fixed inset-0 bg-black/95 z-50 overflow-y-auto flex items-start justify-center p-4 py-8";

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl w-full max-w-2xl glass-card overflow-hidden animate__animated animate__fadeInUp">

      <!-- Header -->
      <div class="relative bg-gradient-to-l from-blue-700 to-purple-700 p-6 text-center">
        <button id="cb-close" class="absolute top-4 left-4 text-white/70 hover:text-white transition">
          <i class="fas fa-times text-xl"></i>
        </button>
        <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="fas fa-graduation-cap text-white text-3xl"></i>
        </div>
        <h2 class="text-2xl font-black text-white">استمارة حجز مادة</h2>
        <p class="text-white/70 text-sm mt-1">برجاء إدخال جميع البيانات بدقة — سيتم التواصل لتأكيد الحجز</p>
        <div class="inline-block bg-white/10 text-white text-xs font-mono px-3 py-1 rounded-full mt-3 border border-white/20">
          رقم حجزك: <span class="font-black text-yellow-300">${bookingId}</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="flex bg-slate-900">
        <div id="step-tab-1" class="flex-1 py-2 text-center text-xs font-bold text-purple-400 border-b-2 border-purple-500 transition">بيانات الطالب</div>
        <div id="step-tab-2" class="flex-1 py-2 text-center text-xs font-bold text-slate-500 border-b-2 border-slate-700 transition">بيانات الحجز</div>
        <div id="step-tab-3" class="flex-1 py-2 text-center text-xs font-bold text-slate-500 border-b-2 border-slate-700 transition">الدفع</div>
      </div>

      <!-- ===== Step 1: بيانات الطالب ===== -->
      <div id="cb-step-1" class="p-6 space-y-4">
        <p class="text-purple-400 font-bold text-sm mb-2"><i class="fas fa-user ml-2"></i>بيانات الطالب</p>

        <div class="grid grid-cols-1 gap-4">

          <div>
            <label class="cb-label">الاسم الثلاثي <span class="text-red-400">*</span></label>
            <input id="cb-name" type="text" placeholder="مثال: أحمد محمد علي" class="cb-input">
          </div>

          <div>
            <label class="cb-label">تاريخ الميلاد <span class="text-red-400">*</span></label>
            <input id="cb-dob" type="date" class="cb-input">
          </div>

          <div>
            <label class="cb-label">الصف الدراسي <span class="text-red-400">*</span></label>
            <select id="cb-grade" class="cb-input">
              <option value="">— اختر الصف —</option>
              ${GRADES.map(g => `<option value="${g.value}" data-stage="${g.stage}">${g.label}</option>`).join("")}
            </select>
          </div>

          <!-- الشعبة: تظهر فقط للثانوي -->
          <div id="cb-division-wrap" class="hidden">
            <label class="cb-label">الشعبة <span class="text-red-400">*</span></label>
            <select id="cb-division" class="cb-input">
              <option value="">— اختر الشعبة —</option>
              <option value="علمي علوم">علمي علوم</option>
              <option value="علمي رياضة">علمي رياضة</option>
              <option value="أدبي">أدبي</option>
            </select>
          </div>

          <div>
            <label class="cb-label">اسم المدرسة <span class="text-red-400">*</span></label>
            <input id="cb-school" type="text" placeholder="مثال: مدرسة الأمل الثانوية" class="cb-input">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="cb-label">موبايل الطالب <span class="text-red-400">*</span></label>
              <input id="cb-phone" type="tel" placeholder="01xxxxxxxxxx" class="cb-input">
            </div>
            <div>
              <label class="cb-label">موبايل ولي الأمر <span class="text-red-400">*</span></label>
              <input id="cb-parent-phone" type="tel" placeholder="01xxxxxxxxxx" class="cb-input">
            </div>
          </div>

          <div>
            <label class="cb-label">العنوان <span class="text-red-400">*</span></label>
            <input id="cb-address" type="text" placeholder="مثال: الإسكندرية — سيدي بشر" class="cb-input">
          </div>
        </div>

        <button id="cb-next-1" class="cb-btn-primary w-full mt-4">
          التالي: بيانات الحجز <i class="fas fa-arrow-left mr-2"></i>
        </button>
      </div>

      <!-- ===== Step 2: بيانات الحجز ===== -->
      <div id="cb-step-2" class="p-6 space-y-4 hidden">
        <p class="text-blue-400 font-bold text-sm mb-2"><i class="fas fa-calendar-check ml-2"></i>بيانات الحجز</p>

        <div>
          <label class="cb-label">المادة المطلوبة <span class="text-red-400">*</span></label>
          <select id="cb-subject" class="cb-input">
            <option value="">— اختر المادة —</option>
            ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>

        <div>
          <label class="cb-label">الأيام أو الميعاد المناسب</label>
          <input id="cb-schedule" type="text" placeholder="مثال: السبت والاثنين 4 مساءً" class="cb-input">
        </div>

        <div>
          <label class="cb-label">الطالب جديد أم قديم؟ <span class="text-red-400">*</span></label>
          <div class="flex gap-3">
            <label class="flex-1 flex items-center gap-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-purple-500 rounded-xl p-3 cursor-pointer transition">
              <input type="radio" name="cb-student-type" value="جديد" class="accent-purple-500"> جديد
            </label>
            <label class="flex-1 flex items-center gap-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-purple-500 rounded-xl p-3 cursor-pointer transition">
              <input type="radio" name="cb-student-type" value="قديم" class="accent-purple-500"> قديم
            </label>
          </div>
        </div>

        <div>
          <label class="cb-label">سبق له الحجز مع المدرس؟ <span class="text-red-400">*</span></label>
          <div class="flex gap-3">
            <label class="flex-1 flex items-center gap-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-purple-500 rounded-xl p-3 cursor-pointer transition">
              <input type="radio" name="cb-prev-booking" value="نعم" class="accent-purple-500"> نعم
            </label>
            <label class="flex-1 flex items-center gap-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-purple-500 rounded-xl p-3 cursor-pointer transition">
              <input type="radio" name="cb-prev-booking" value="لا" class="accent-purple-500"> لا
            </label>
          </div>
        </div>

        <div>
          <label class="cb-label">ملاحظات إضافية</label>
          <textarea id="cb-notes" rows="3" placeholder="أي ملاحظة تريد إضافتها..." class="cb-input resize-none"></textarea>
        </div>

        <div class="flex gap-3 mt-4">
          <button id="cb-back-1" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition">
            <i class="fas fa-arrow-right ml-2"></i> رجوع
          </button>
          <button id="cb-next-2" class="flex-1 cb-btn-primary">
            التالي: الدفع <i class="fas fa-arrow-left mr-2"></i>
          </button>
        </div>
      </div>

      <!-- ===== Step 3: الدفع بأورنج كاش ===== -->
      <div id="cb-step-3" class="p-6 hidden">

        <!-- تعليمات الدفع -->
        <div class="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
              <i class="fas fa-mobile-alt text-white text-xl"></i>
            </div>
            <div>
              <p class="font-black text-white text-lg">أورنج كاش</p>
              <p class="text-orange-400 text-sm">حوّل مبلغ الحجز على الرقم التالي</p>
            </div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-4 text-center mb-4">
            <p class="text-slate-400 text-xs mb-1">رقم أورنج كاش</p>
            <p class="text-3xl font-black text-orange-400 tracking-widest" id="oc-display-number">${ORANGE_CASH_NUMBER}</p>
            <p class="text-slate-400 text-xs mt-2">المبلغ المطلوب: <span class="text-white font-bold">${BOOKING_AMOUNT} جنيه</span></p>
          </div>
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
            <p class="text-yellow-400 text-sm font-bold">
              <i class="fas fa-tag ml-2"></i>اكتب رقم حجزك في ملاحظات التحويل:
              <span class="text-white font-black"> ${bookingId}</span>
            </p>
          </div>
        </div>

        <!-- خطوات الدفع -->
        <p class="text-slate-400 text-sm font-bold mb-3"><i class="fas fa-list-ol ml-2"></i>خطوات الدفع:</p>
        <div class="space-y-2 mb-6">
          ${["افتح تطبيق أورنج أو كلم *100*6#", `حوّل ${BOOKING_AMOUNT} ج على ${ORANGE_CASH_NUMBER}`, `اكتب رقم الحجز (${bookingId}) في خانة الملاحظات`, "صوّر إيصال التحويل ثم أكمل البيانات أدناه"].map((s, i) => `
          <div class="flex items-start gap-3 text-sm text-slate-300">
            <span class="w-6 h-6 bg-purple-600/30 text-purple-400 rounded-full flex items-center justify-center text-xs font-black shrink-0">${i + 1}</span>
            <span>${s}</span>
          </div>`).join("")}
        </div>

        <!-- بيانات التحويل -->
        <p class="text-slate-300 font-bold text-sm mb-3"><i class="fas fa-fill-drip ml-2 text-orange-400"></i>بعد التحويل، أدخل البيانات:</p>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="cb-label">رقم موبايل المُحوِّل <span class="text-red-400">*</span></label>
              <input id="cb-pay-phone" type="tel" placeholder="01xxxxxxxx" class="cb-input">
            </div>
            <div>
              <label class="cb-label">وقت التحويل <span class="text-red-400">*</span></label>
              <input id="cb-pay-time" type="time" class="cb-input">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="cb-label">المبلغ المُحوَّل <span class="text-red-400">*</span></label>
              <input id="cb-pay-amount" type="number" placeholder="${BOOKING_AMOUNT}" class="cb-input">
            </div>
            <div>
              <label class="cb-label">آخر 4 أرقام من رقم العملية</label>
              <input id="cb-pay-ref" type="text" placeholder="مثال: 4571" maxlength="4" class="cb-input">
            </div>
          </div>
          <div>
            <label class="cb-label">صورة إيصال التحويل <span class="text-red-400">*</span></label>
            <label class="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-orange-500 rounded-xl p-5 cursor-pointer transition bg-slate-900/30 hover:bg-orange-500/5" id="receipt-drop-zone">
              <i class="fas fa-cloud-upload-alt text-3xl text-slate-500 mb-2" id="receipt-icon"></i>
              <span class="text-slate-400 text-sm" id="receipt-label">اضغط لرفع صورة الإيصال</span>
              <span class="text-slate-600 text-xs mt-1">PNG, JPG, JPEG</span>
              <input type="file" id="cb-receipt" accept="image/*" class="hidden">
            </label>
            <img id="receipt-preview" class="hidden w-full rounded-xl mt-3 max-h-48 object-contain border border-slate-600" alt="إيصال">
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button id="cb-back-2" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition">
            <i class="fas fa-arrow-right ml-2"></i> رجوع
          </button>
          <button id="cb-submit" class="flex-2 cb-btn-primary px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2">
            <i class="fas fa-paper-plane"></i> إرسال الحجز
          </button>
        </div>

        <p class="text-slate-500 text-xs text-center mt-4">
          بعد إرسال الطلب سيتم مراجعة البيانات والتواصل مع الطالب أو ولي الأمر لتأكيد الحجز وتحديد المجموعة المناسبة.
        </p>
      </div>

      <!-- ===== Step 4: نجاح ===== -->
      <div id="cb-step-success" class="p-10 text-center hidden">
        <div class="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate__animated animate__bounceIn">
          <i class="fas fa-check-circle text-emerald-400 text-5xl"></i>
        </div>
        <h3 class="text-2xl font-black text-white mb-2">تم إرسال حجزك! 🎉</h3>
        <div class="bg-slate-700/50 rounded-xl p-4 my-5 inline-block">
          <p class="text-slate-400 text-sm mb-1">رقم حجزك</p>
          <p class="text-3xl font-black text-yellow-400 tracking-widest">${bookingId}</p>
        </div>
        <p class="text-slate-400 mb-6">احتفظ برقم الحجز، سيتم التواصل معك على واتساب لتأكيد الحجز وتحديد المجموعة.</p>
        <button id="cb-close-success" class="bg-gradient-to-l from-purple-600 to-emerald-500 text-white px-10 py-3 rounded-xl font-bold transition hover:opacity-90">
          إغلاق
        </button>
      </div>

    </div>

    <style>
      .cb-label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.3rem; }
      .cb-input {
        width: 100%; padding: 0.7rem 1rem; border-radius: 0.75rem;
        background: #1e293b; border: 1px solid #334155; color: #fff;
        outline: none; transition: border 0.2s;
        font-family: 'Cairo', sans-serif;
      }
      .cb-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.2); }
      .cb-btn-primary {
        background: linear-gradient(to left, #7c3aed, #10b981);
        color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem;
        font-weight: 900; transition: opacity 0.2s;
        box-shadow: 0 4px 15px rgba(124,58,237,0.3);
      }
      .cb-btn-primary:hover { opacity: 0.9; }
      .cb-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>
  `;

  document.body.appendChild(modal);

  // ===== State =====
  let receiptBase64 = null;
  const steps = {
    1: modal.querySelector("#cb-step-1"),
    2: modal.querySelector("#cb-step-2"),
    3: modal.querySelector("#cb-step-3"),
    success: modal.querySelector("#cb-step-success"),
  };
  const tabs = [
    modal.querySelector("#step-tab-1"),
    modal.querySelector("#step-tab-2"),
    modal.querySelector("#step-tab-3"),
  ];

  function setStep(n) {
    Object.values(steps).forEach(el => el.classList.add("hidden"));
    if (n === "success") {
      steps.success.classList.remove("hidden");
    } else {
      steps[n].classList.remove("hidden");
    }
    tabs.forEach((t, i) => {
      const active = i < n;
      const current = i === n - 1;
      t.classList.toggle("text-purple-400", current);
      t.classList.toggle("border-purple-500", current);
      t.classList.toggle("text-emerald-400", active && !current);
      t.classList.toggle("border-emerald-500", active && !current);
      t.classList.toggle("text-slate-500", !current && !active);
      t.classList.toggle("border-slate-700", !current && !active);
    });
  }

  // Close
  modal.querySelector("#cb-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

  // Escape
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { modal.remove(); document.removeEventListener("keydown", esc); }
  });

  // Grade → show division for ثانوي
  modal.querySelector("#cb-grade").addEventListener("change", function () {
    const opt = this.options[this.selectedIndex];
    const isSecondary = opt.dataset.stage === "sec";
    modal.querySelector("#cb-division-wrap").classList.toggle("hidden", !isSecondary);
  });

  // Receipt upload
  const receiptInput = modal.querySelector("#cb-receipt");
  const receiptPreview = modal.querySelector("#receipt-preview");
  const receiptLabel = modal.querySelector("#receipt-label");
  const receiptIcon = modal.querySelector("#receipt-icon");

  modal.querySelector("#receipt-drop-zone").addEventListener("click", () => receiptInput.click());
  receiptInput.addEventListener("change", () => {
    const file = receiptInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      receiptBase64 = e.target.result;
      receiptPreview.src = receiptBase64;
      receiptPreview.classList.remove("hidden");
      receiptLabel.textContent = file.name;
      receiptIcon.className = "fas fa-check-circle text-3xl text-emerald-400 mb-2";
    };
    reader.readAsDataURL(file);
  });

  // ---- Next 1 (بيانات الطالب validation) ----
  modal.querySelector("#cb-next-1").addEventListener("click", () => {
    const name        = modal.querySelector("#cb-name").value.trim();
    const dob         = modal.querySelector("#cb-dob").value;
    const grade       = modal.querySelector("#cb-grade").value;
    const school      = modal.querySelector("#cb-school").value.trim();
    const phone       = modal.querySelector("#cb-phone").value.trim();
    const parentPhone = modal.querySelector("#cb-parent-phone").value.trim();
    const address     = modal.querySelector("#cb-address").value.trim();
    const gradeOpt    = modal.querySelector("#cb-grade").options[modal.querySelector("#cb-grade").selectedIndex];
    const isSecondary = gradeOpt.dataset?.stage === "sec";
    const division    = modal.querySelector("#cb-division").value;

    if (!name || !dob || !grade || !school || !phone || !parentPhone || !address) {
      showMessage("⚠️ من فضلك أكمل جميع الحقول المطلوبة", "error"); return;
    }
    if (isSecondary && !division) {
      showMessage("⚠️ من فضلك اختر الشعبة", "error"); return;
    }
    setStep(2);
  });

  // ---- Back 1 ----
  modal.querySelector("#cb-back-1").addEventListener("click", () => setStep(1));

  // ---- Next 2 (بيانات الحجز validation) ----
  modal.querySelector("#cb-next-2").addEventListener("click", () => {
    const subject     = modal.querySelector("#cb-subject").value;
    const studentType = modal.querySelector("input[name='cb-student-type']:checked")?.value;
    const prevBooking = modal.querySelector("input[name='cb-prev-booking']:checked")?.value;

    if (!subject) { showMessage("⚠️ اختر المادة المطلوبة", "error"); return; }
    if (!studentType) { showMessage("⚠️ حدد هل الطالب جديد أم قديم", "error"); return; }
    if (!prevBooking) { showMessage("⚠️ حدد هل سبق له الحجز مع المدرس", "error"); return; }
    setStep(3);
  });

  // ---- Back 2 ----
  modal.querySelector("#cb-back-2").addEventListener("click", () => setStep(2));

  // ---- Submit ----
  modal.querySelector("#cb-submit").addEventListener("click", async () => {
    const payPhone  = modal.querySelector("#cb-pay-phone").value.trim();
    const payTime   = modal.querySelector("#cb-pay-time").value;
    const payAmount = modal.querySelector("#cb-pay-amount").value;

    if (!payPhone || !payTime || !payAmount) {
      showMessage("⚠️ أدخل بيانات التحويل كاملة", "error"); return;
    }
    if (!receiptBase64) {
      showMessage("⚠️ من فضلك ارفع صورة إيصال التحويل", "error"); return;
    }

    const btn = modal.querySelector("#cb-submit");
    btn.innerHTML = `<i class="fas fa-spinner fa-spin ml-2"></i> جاري الإرسال...`;
    btn.disabled = true;

    // جمع كل البيانات
    const gradeEl     = modal.querySelector("#cb-grade");
    const gradeOpt    = gradeEl.options[gradeEl.selectedIndex];
    const isSecondary = gradeOpt.dataset?.stage === "sec";

    const payload = {
      bookingId,
      // بيانات الطالب
      name:           modal.querySelector("#cb-name").value.trim(),
      dateOfBirth:    modal.querySelector("#cb-dob").value,
      grade:          gradeEl.value,
      gradeLabel:     gradeOpt.text,
      division:       isSecondary ? modal.querySelector("#cb-division").value : null,
      school:         modal.querySelector("#cb-school").value.trim(),
      studentPhone:   modal.querySelector("#cb-phone").value.trim(),
      parentPhone:    modal.querySelector("#cb-parent-phone").value.trim(),
      address:        modal.querySelector("#cb-address").value.trim(),
      // بيانات الحجز
      subject:        modal.querySelector("#cb-subject").value,
      schedule:       modal.querySelector("#cb-schedule").value.trim() || null,
      studentType:    modal.querySelector("input[name='cb-student-type']:checked")?.value,
      prevBooking:    modal.querySelector("input[name='cb-prev-booking']:checked")?.value,
      notes:          modal.querySelector("#cb-notes").value.trim() || null,
      // بيانات الدفع
      payment: {
        phone:        payPhone,
        time:         payTime,
        amount:       payAmount,
        refLast4:     modal.querySelector("#cb-pay-ref").value.trim() || null,
        receiptImage: receiptBase64,   // Base64
      },
      // metadata
      status:         "pending",       // ⏳ في انتظار التأكيد
      createdAt:      serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "center_bookings"), payload);
      setStep("success");
    } catch (err) {
      console.error(err);
      showMessage("❌ حدث خطأ أثناء الإرسال، حاول مرة أخرى", "error");
      btn.innerHTML = `<i class="fas fa-paper-plane ml-2"></i> إرسال الحجز`;
      btn.disabled = false;
    }
  });

  // Close success
  modal.querySelector("#cb-close-success").addEventListener("click", () => modal.remove());
}

window.openCenterBooking = openCenterBooking;
