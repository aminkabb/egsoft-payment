import { db } from "./firebase-config.js";
import { showMessage } from "./shared.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const JOBS = [
  { value: "hr",              label: "Human Resources (HR)",       icon: "fa-users-gear",       color: "from-pink-600 to-rose-500" },
  { value: "backend",         label: "Back-End Developer",          icon: "fa-server",           color: "from-blue-600 to-cyan-500" },
  { value: "frontend",        label: "Front-End Developer",         icon: "fa-laptop-code",      color: "from-purple-600 to-violet-500" },
  { value: "project_manager", label: "Project Manager",             icon: "fa-diagram-project",  color: "from-amber-500 to-yellow-400" },
  { value: "marketing",       label: "Marketing",                   icon: "fa-bullhorn",         color: "from-orange-500 to-red-400" },
  { value: "oc",              label: "Operation & Coordination",    icon: "fa-gears",            color: "from-teal-500 to-emerald-400" },
  { value: "flutter",         label: "Junior Flutter Developer",    icon: "fa-mobile-screen",    color: "from-sky-500 to-blue-400" },
  { value: "part_time",       label: "Part-Time (أي تخصص)",        icon: "fa-clock",            color: "from-slate-500 to-slate-400" },
];

export function openJobsModal() {
  // ---- Modal Wrapper ----
  const modal = document.createElement('div');
  modal.id = 'jobs-modal';
  modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto';

  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl w-full max-w-2xl glass-card overflow-hidden animate__animated animate__fadeInUp">

      <!-- Header -->
      <div class="relative bg-gradient-to-l from-purple-700 to-emerald-600 p-6">
        <button id="close-jobs-modal" class="absolute top-4 left-4 text-white/70 hover:text-white transition">
          <i class="fas fa-times text-xl"></i>
        </button>
        <div class="text-center">
          <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-briefcase text-white text-3xl"></i>
          </div>
          <h2 class="text-2xl font-black text-white">انضم لفريق Amin Tech</h2>
          <p class="text-white/70 text-sm mt-1">اختار تخصصك وابعت طلبك</p>
        </div>
      </div>

      <!-- Steps -->
      <div id="jobs-step-1" class="p-6">
        <p class="text-slate-400 text-sm mb-5 text-center">اختار الوظيفة اللي تناسبك 👇</p>
        <div class="grid grid-cols-2 gap-3">
          ${JOBS.map(j => `
            <button class="job-card bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-500 rounded-xl p-4 text-right transition group"
                    data-value="${j.value}" data-label="${j.label}">
              <div class="w-10 h-10 bg-gradient-to-br ${j.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <i class="fas ${j.icon} text-white text-lg"></i>
              </div>
              <span class="text-slate-200 font-bold text-sm leading-snug">${j.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Application Form (hidden initially) -->
      <div id="jobs-step-2" class="p-6 hidden">
        <button id="back-to-jobs" class="flex items-center gap-2 text-purple-400 hover:text-white text-sm mb-5 transition">
          <i class="fas fa-arrow-right"></i> اختار وظيفة تانية
        </button>

        <div id="selected-job-badge" class="flex items-center gap-3 bg-purple-600/20 border border-purple-500/30 rounded-xl p-3 mb-5">
          <i class="fas fa-briefcase text-purple-400"></i>
          <span id="selected-job-name" class="font-bold text-purple-300"></span>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-slate-300 text-sm mb-1">الاسم بالكامل <span class="text-red-400">*</span></label>
            <input type="text" id="j-name" required placeholder="مثال: أحمد محمد"
              class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-1">رقم الواتساب <span class="text-red-400">*</span></label>
            <input type="tel" id="j-phone" required placeholder="01XXXXXXXXX"
              class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-1">البريد الإلكتروني</label>
            <input type="email" id="j-email" placeholder="example@email.com"
              class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-1">سنوات الخبرة <span class="text-red-400">*</span></label>
            <select id="j-exp"
              class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
              <option value="no_exp">بدون خبرة (Fresher)</option>
              <option value="less_1">أقل من سنة</option>
              <option value="1_2">من 1 إلى 2 سنة</option>
              <option value="2_5">من 2 إلى 5 سنوات</option>
              <option value="5_plus">أكتر من 5 سنوات</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-1">لينك البورتفوليو / LinkedIn / GitHub</label>
            <input type="url" id="j-portfolio" placeholder="https://..."
              class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 outline-none transition">
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-1">كلمة عن نفسك (اختياري)</label>
            <textarea id="j-bio" rows="3" placeholder="قدم نفسك باختصار..."
              class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"></textarea>
          </div>

          <button id="submit-job-btn"
            class="w-full bg-gradient-to-l from-purple-600 to-emerald-500 py-3 rounded-xl font-black hover:opacity-90 transition text-white shadow-lg shadow-purple-600/30 mt-2">
            <i class="fas fa-paper-plane ml-2"></i> إرسال الطلب
          </button>
        </div>
      </div>

      <!-- Success State (hidden initially) -->
      <div id="jobs-step-3" class="p-10 text-center hidden">
        <div class="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-check-circle text-emerald-400 text-4xl"></i>
        </div>
        <h3 class="text-2xl font-black text-white mb-2">تم إرسال طلبك! 🎉</h3>
        <p class="text-slate-400 mb-6">شكراً على اهتمامك بالانضمام لفريق Amin Tech.<br>هنتواصل معاك على الواتساب قريباً.</p>
        <button id="close-success-btn" class="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-bold transition">
          إغلاق
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // ---- State ----
  let selectedJob = null;

  const step1 = modal.querySelector('#jobs-step-1');
  const step2 = modal.querySelector('#jobs-step-2');
  const step3 = modal.querySelector('#jobs-step-3');

  // Close
  modal.querySelector('#close-jobs-modal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Job card selection
  modal.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedJob = { value: card.dataset.value, label: card.dataset.label };
      modal.querySelector('#selected-job-name').textContent = selectedJob.label;
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
    });
  });

  // Back button
  modal.querySelector('#back-to-jobs').addEventListener('click', () => {
    step2.classList.add('hidden');
    step1.classList.remove('hidden');
    selectedJob = null;
  });

  // Close success
  modal.querySelector('#close-success-btn').addEventListener('click', () => modal.remove());

  // Submit
  modal.querySelector('#submit-job-btn').addEventListener('click', async () => {
    const name     = document.getElementById('j-name').value.trim();
    const phone    = document.getElementById('j-phone').value.trim();
    const email    = document.getElementById('j-email').value.trim();
    const exp      = document.getElementById('j-exp').value;
    const portfolio= document.getElementById('j-portfolio').value.trim();
    const bio      = document.getElementById('j-bio').value.trim();
    const btn      = document.getElementById('submit-job-btn');

    if (!name || !phone) {
      showMessage("⚠️ من فضلك ادخل الاسم ورقم الواتساب", "error");
      return;
    }

    btn.innerHTML = `<i class="fas fa-spinner fa-spin ml-2"></i> جاري الإرسال...`;
    btn.disabled = true;

    try {
      await addDoc(collection(db, "job_applications"), {
        position:    selectedJob.value,
        positionLabel: selectedJob.label,
        name,
        phone,
        email:       email || null,
        experience:  exp,
        portfolio:   portfolio || null,
        bio:         bio || null,
        status:      "new",
        appliedAt:   serverTimestamp(),
      });

      step2.classList.add('hidden');
      step3.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      showMessage("❌ حدث خطأ، حاول مرة أخرى", "error");
      btn.innerHTML = `<i class="fas fa-paper-plane ml-2"></i> إرسال الطلب`;
      btn.disabled = false;
    }
  });
}

window.openJobsModal = openJobsModal;
