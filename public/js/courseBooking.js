import { auth, db } from "./firebase-config.js";
import { showMessage } from "./shared.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export async function openBookingForm() {
  // لا يشترط تسجيل دخول للحجز (حسب رغبتك، أو ممكن تفعله)
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl max-w-md w-full glass-card p-6">
      <div class="flex justify-between mb-6">
        <h3 class="text-xl font-bold gradient-text">حجز كورس جديد</h3>
        <button class="close-booking text-slate-400"><i class="fas fa-times"></i></button>
      </div>

      <form id="booking-form" class="space-y-4">
        <div>
          <label class="block text-slate-300 text-sm mb-1">اسم الطالب</label>
          <input type="text" id="b-name" required class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500">
        </div>
        <div>
          <label class="block text-slate-300 text-sm mb-1">رقم الهاتف (واتساب)</label>
          <input type="tel" id="b-phone" required class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-purple-500">
        </div>
        <div>
          <label class="block text-slate-300 text-sm mb-1">الكورس المطلوب</label>
          <select id="b-course" class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white">
            <option value="web">تطوير المواقع (Web Development)</option>
            <option value="mobile">تطبيقات الموبايل (Mobile Apps)</option>
            <option value="cyber">أمن المعلومات (Cyber Security)</option>
            <option value="python">بايثون للمبتدئين (Python)</option>
            <option value="robotics">روبوتكس (Robotics)</option>
          </select>
        </div>
        
        <button type="submit" class="w-full bg-gradient-to-l from-purple-600 to-emerald-500 py-3 rounded-xl font-bold hover:opacity-90 transition mt-4">
          تأكيد الحجز
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.close-booking').addEventListener('click', () => document.body.removeChild(modal));

  modal.querySelector('#booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "جاري الإرسال...";
    btn.disabled = true;

    try {
      await addDoc(collection(db, "bookings"), {
        studentName: document.getElementById('b-name').value,
        phone: document.getElementById('b-phone').value,
        courseName: document.getElementById('b-course').options[document.getElementById('b-course').selectedIndex].text,
        status: "pending", // جديد
        timestamp: serverTimestamp(),
        userId: auth.currentUser ? auth.currentUser.uid : "visitor"
      });

      showMessage("✅ تم إرسال طلب الحجز! سنتواصل معك قريباً.", "success");
      document.body.removeChild(modal);
    } catch (err) {
      console.error(err);
      showMessage("خطأ في الحجز، حاول مرة أخرى", "error");
      btn.innerText = "تأكيد الحجز";
      btn.disabled = false;
    }
  });
}

window.openBookingForm = openBookingForm;