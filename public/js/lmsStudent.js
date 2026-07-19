import { auth, db } from "./firebase-config.js";
import { showMessage } from "./shared.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. ثوابت النظام (للتنظيم والقوائم)
// ==========================================

// هيكل الصفوف (لعرض الكروت الرئيسية في قسم المحتوى)
const GRADES_STRUCTURE = [
    { code: "prep1", name: "الصف الأول الإعدادي", icon: "fas fa-user-graduate" },
    { code: "prep2", name: "الصف الثاني الإعدادي", icon: "fas fa-user-graduate" },
    { code: "prep3", name: "الصف الثالث الإعدادي", icon: "fas fa-user-graduate" },
    { code: "sec1", name: "الصف الأول الثانوي", icon: "fas fa-school" },
    { code: "sec2_sci", name: "2 ثانوي (علمي)", icon: "fas fa-flask" },
    { code: "sec2_lit", name: "2 ثانوي (أدبي)", icon: "fas fa-book-open" },
    { code: "sec3_sci", name: "3 ثانوي (علوم)", icon: "fas fa-microscope" },
    { code: "sec3_math", name: "3 ثانوي (رياضة)", icon: "fas fa-calculator" },
    { code: "sec3_lit", name: "3 ثانوي (أدبي)", icon: "fas fa-feather" },
    { code: "programming", name: "كورسات البرمجة", icon: "fas fa-laptop-code" }
];

// بيانات المواد (لقوائم الرفع فقط)
const COURSE_DATA = {
    "prep1": { name: "الصف الأول الإعدادي", subjects: ["اللغة العربية", "التربية الدينية", "العلوم", "الرياضيات", "الدراسات الاجتماعية", "اللغة الإنجليزية", "اللغة الأجنبية الثانية", "تكنولوجيا المعلومات"] },
    "prep2": { name: "الصف الثاني الإعدادي", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "دراسات (تاريخ وجغرافيا)", "لغة إنجليزية", "تربية دينية", "تربية فنية", "حاسب آلي", "مهارات حياتية"] },
    "prep3": { name: "الصف الثالث الإعدادي", subjects: ["اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "التربية الدينية", "التربية الفنية", "الحاسب الآلي"] },
    "sec1": { name: "الصف الأول الثانوي", subjects: ["اللغة العربية", "اللغة الأجنبية الأولى", "الرياضيات", "العلوم المتكاملة", "التاريخ", "الفلسفة والمنطق", "التربية الدينية", "اللغة الأجنبية الثانية"] },
    "sec2_sci": { name: "ثانية ثانوي (علمي)", subjects: ["اللغة العربية", "اللغة الأجنبية الأولى", "الرياضيات", "الكيمياء", "الفيزياء", "الأحياء", "التربية الدينية", "اللغة الأجنبية الثانية"] },
    "sec2_lit": { name: "ثانية ثانوي (أدبي)", subjects: ["اللغة العربية", "اللغة الأجنبية الأولى", "التاريخ", "الجغرافيا", "علم النفس", "الرياضيات", "التربية الدينية", "اللغة الأجنبية الثانية"] },
    "sec3_sci": { name: "ثالثة ثانوي (علمي علوم)", subjects: ["اللغة العربية", "اللغة الأجنبية الأولى", "الأحياء", "الكيمياء", "الفيزياء", "التربية الدينية", "التربية الوطنية"] },
    "sec3_math": { name: "ثالثة ثانوي (علمي رياضة)", subjects: ["اللغة العربية", "اللغة الأجنبية الأولى", "الرياضيات البحتة", "الرياضيات التطبيقية", "الكيمياء", "الفيزياء", "التربية الدينية"] },
    "sec3_lit": { name: "ثالثة ثانوي (أدبي)", subjects: ["اللغة العربية", "اللغة الأجنبية الأولى", "التاريخ", "الجغرافيا", "الإحصاء", "علم النفس والاجتماع", "التربية الدينية"] },
    "programming": { name: "كورسات البرمجة", subjects: ["Web Development", "Flutter Mobile App", "Artificial Intelligence (AI)", "Machine Learning", "CCNA Network", "Robotics"] }
};

// ==========================================
// 2. دالة رفع الواجب (شغالة بالنظام القديم Base64)
// ==========================================
export async function openUploadModal() {
    if (!auth.currentUser) {
        showMessage("يجب تسجيل الدخول أولاً", "error");
        document.getElementById('auth-modal').classList.remove('hidden');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
      <div class="bg-slate-800 rounded-2xl max-w-lg w-full glass-card p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between mb-6">
          <h3 class="text-xl font-bold gradient-text">رفع واجب / مشروع</h3>
          <button class="close-upload text-slate-400"><i class="fas fa-times"></i></button>
        </div>
  
        <form id="upload-form" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
              <div>
                  <label class="block text-slate-300 text-xs mb-1">اسم الطالب (ثلاثي)</label>
                  <input type="text" id="st-name" required placeholder="أحمد محمد علي" class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-purple-500">
              </div>
              <div>
                  <label class="block text-slate-300 text-xs mb-1">كود الطالب (ID)</label>
                  <input type="text" id="st-id" required placeholder="مثال: 202501" class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-purple-500">
              </div>
          </div>
  
          <div>
            <label class="block text-slate-300 text-sm mb-1">المرحلة الدراسية</label>
            <select id="grade-select" class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white">
              <option value="">اختر المرحلة...</option>
              ${Object.keys(COURSE_DATA).map(key => `<option value="${key}">${COURSE_DATA[key].name}</option>`).join('')}
            </select>
          </div>
  
          <div>
            <label class="block text-slate-300 text-sm mb-1">المادة</label>
            <select id="subject-select" class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" disabled>
              <option value="">اختر المرحلة أولاً</option>
            </select>
          </div>
  
          <div class="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer" id="drop-zone">
            <i class="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-2"></i>
            <p class="text-slate-400 text-sm">اضغط لاختيار ملف (PDF أو صورة)</p>
            <p class="text-red-400 text-xs mt-1">تنبيه: أقصى حجم 1 ميجا بايت</p>
            <input type="file" id="file-input" class="hidden" accept="image/*,.pdf,.zip,.rar">
            <p id="file-name" class="text-emerald-400 text-sm mt-2 hidden"></p>
          </div>
  
          <div>
            <label class="block text-slate-300 text-sm mb-1">ملاحظات (اختياري)</label>
            <textarea id="notes" class="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" rows="2"></textarea>
          </div>
  
          <button type="submit" class="w-full bg-gradient-to-l from-purple-600 to-emerald-500 py-3 rounded-xl font-bold hover:opacity-90 transition">
            إرسال الواجب
          </button>
        </form>
      </div>
    `;
  
    document.body.appendChild(modal);
  
    const gradeSelect = modal.querySelector('#grade-select');
    const subjectSelect = modal.querySelector('#subject-select');
  
    gradeSelect.addEventListener('change', (e) => {
        const selectedGrade = e.target.value;
        subjectSelect.innerHTML = '<option value="">اختر المادة...</option>';
        if (selectedGrade && COURSE_DATA[selectedGrade]) {
            subjectSelect.disabled = false;
            COURSE_DATA[selectedGrade].subjects.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subjectSelect.appendChild(option);
            });
        } else {
            subjectSelect.disabled = true;
            subjectSelect.innerHTML = '<option value="">اختر المرحلة أولاً</option>';
        }
    });
  
    const dropZone = modal.querySelector('#drop-zone');
    const fileInput = modal.querySelector('#file-input');
    const fileNameDisplay = modal.querySelector('#file-name');
  
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if(fileInput.files.length > 0) {
          if(fileInput.files[0].size > 1024 * 1024) {
              showMessage("الملف كبير جداً! أقصى حجم 1 ميجا", "error");
              fileInput.value = "";
              return;
          }
          fileNameDisplay.textContent = `✅ تم اختيار: ${fileInput.files[0].name}`;
          fileNameDisplay.classList.remove('hidden');
      }
    });
  
    modal.querySelector('.close-upload').addEventListener('click', () => document.body.removeChild(modal));
    
    modal.querySelector('#upload-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const stName = document.getElementById('st-name').value;
      const stId = document.getElementById('st-id').value;
  
      if(fileInput.files.length === 0 || !gradeSelect.value || !subjectSelect.value || !stName || !stId) {
          showMessage("الرجاء استكمال جميع البيانات", "error");
          return;
      }
  
      const btn = e.target.querySelector('button');
      btn.innerText = "جاري التحويل والرفع...";
      btn.disabled = true;
  
      const file = fileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = async function(event) {
          const base64File = event.target.result;
  
          try {
              await addDoc(collection(db, "assignments"), {
                  studentId: auth.currentUser.uid,
                  studentName: stName,
                  studentCode: stId,
                  gradeCode: gradeSelect.value,
                  gradeName: COURSE_DATA[gradeSelect.value].name,
                  subject: subjectSelect.value,
                  notes: document.getElementById('notes').value,
                  fileName: file.name,
                  fileUrl: base64File,
                  uploadedAt: serverTimestamp(),
                  status: "pending"
              });
  
              showMessage("✅ تم رفع الواجب بنجاح", "success");
              document.body.removeChild(modal);
  
          } catch (err) {
              console.error("خطأ:", err);
              showMessage("حدث خطأ! الملف قد يكون أكبر من المسموح", "error");
              btn.innerText = "إرسال الواجب";
              btn.disabled = false;
          }
      };
      reader.readAsDataURL(file);
    });
}

// ==========================================
// 3. دالة "واجباتي" (عرض الدرجات والملاحظات)
// ==========================================
export async function openMyAssignments() {
    if (!auth.currentUser) {
        showMessage("يجب تسجيل الدخول أولاً", "error");
        document.getElementById('auth-modal').classList.remove('hidden');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-800 rounded-2xl max-w-4xl w-full glass-card p-6 h-[80vh] flex flex-col">
        <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <h3 class="text-2xl font-bold gradient-text">سجل واجباتي ودرجاتي 🎓</h3>
            <button class="close-my text-slate-400 hover:text-white"><i class="fas fa-times text-2xl"></i></button>
        </div>
        
        <div class="flex-1 overflow-y-auto pr-2" id="my-assignments-list">
            <p class="text-center mt-10 text-slate-400"><i class="fas fa-spinner fa-spin"></i> جاري تحميل بياناتك...</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-my').addEventListener('click', () => document.body.removeChild(modal));

    // جلب الواجبات الخاصة بالطالب فقط
    const q = query(collection(db, "assignments"), where("studentId", "==", auth.currentUser.uid));
    
    try {
        const snapshot = await getDocs(q);
        const container = modal.querySelector('#my-assignments-list');
        
        if(snapshot.empty) {
            container.innerHTML = `
                <div class="text-center mt-20 text-slate-500">
                    <i class="fas fa-folder-open text-6xl mb-4 opacity-50"></i>
                    <p>لم تقم برفع أي واجبات حتى الآن.</p>
                </div>`;
            return;
        }

        let html = '<div class="grid gap-4">';
        snapshot.forEach(doc => {
            const d = doc.data();
            const date = d.uploadedAt ? new Date(d.uploadedAt.toDate()).toLocaleDateString('ar-EG') : 'غير محدد';
            
            const isGraded = d.status === 'graded';
            const statusColor = isGraded ? 'border-green-500' : 'border-yellow-500';
            const statusText = isGraded ? 'تم التصحيح' : 'قيد المراجعة';
            const statusBadge = isGraded ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';

            html += `
                <div class="bg-slate-700/40 p-4 rounded-xl border-r-4 ${statusColor} relative overflow-hidden">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold text-white text-lg">${d.subject}</h4>
                            <p class="text-xs text-slate-400">بتاريخ: ${date}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold ${statusBadge}">${statusText}</span>
                    </div>
                    
                    ${d.grade ? `
                        <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-600 mt-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-slate-400 text-sm">الدرجة:</span>
                                <span class="text-green-400 font-bold text-xl">${d.grade}</span>
                            </div>
                            ${d.teacherNote ? `
                                <div class="border-t border-slate-700 pt-2 mt-2">
                                    <p class="text-xs text-slate-400 mb-1">ملاحظات المستر:</p>
                                    <p class="text-white text-sm">${d.teacherNote}</p>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <p class="text-sm text-slate-500 mt-2">سيتم إرسال الدرجة والملاحظات هنا بعد التصحيح.</p>
                    `}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        modal.querySelector('#my-assignments-list').innerHTML = '<p class="text-center text-red-400">حدث خطأ في جلب البيانات.</p>';
    }
}

// ==========================================
// 4. المحتوى التعليمي (ديناميكي من الفايربيز) 🔥
// ==========================================
export function openCourseContent() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
      <div class="bg-slate-800 rounded-2xl w-full max-w-6xl glass-card h-[90vh] flex flex-col overflow-hidden">
        <div class="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
            <div>
                <h3 class="text-2xl font-bold gradient-text">المنصة التعليمية</h3>
                <p class="text-slate-400 text-sm" id="content-breadcrumb">اختر الصف الدراسي</p>
            </div>
            <button class="close-content text-slate-400 hover:text-white"><i class="fas fa-times text-2xl"></i></button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6" id="content-area">
            </div>
      </div>`;
    
    document.body.appendChild(modal);
    modal.querySelector('.close-content').onclick = () => modal.remove();

    const contentArea = modal.querySelector('#content-area');
    const breadcrumb = modal.querySelector('#content-breadcrumb');

    // 1. عرض الصفوف (الشاشة الرئيسية)
    function showGrades() {
        breadcrumb.innerText = "اختر الصف الدراسي";
        contentArea.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate__animated animate__fadeIn">
                ${GRADES_STRUCTURE.map(grade => `
                <div class="grade-card glass-card p-6 rounded-2xl cursor-pointer hover:bg-slate-700/50 transition border border-slate-600 group" data-code="${grade.code}" data-name="${grade.name}">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-500/20 flex items-center justify-center text-3xl text-purple-400 group-hover:scale-110 transition">
                            <i class="${grade.icon}"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-xl text-white group-hover:text-purple-400 transition">${grade.name}</h4>
                            <p class="text-sm text-slate-400">اضغط لعرض المواد</p>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        `;

        contentArea.querySelectorAll('.grade-card').forEach(card => {
            card.addEventListener('click', () => {
                const code = card.getAttribute('data-code');
                const name = card.getAttribute('data-name');
                loadSubjectsFromFirebase(code, name);
            });
        });
    }

    // 2. جلب المواد من الفايربيز
    async function loadSubjectsFromFirebase(gradeCode, gradeName) {
        breadcrumb.innerHTML = `<span class="cursor-pointer hover:text-white" id="back-to-grades">الصفوف</span> > <span class="text-purple-400">${gradeName}</span>`;
        contentArea.innerHTML = `<div class="text-center mt-20"><i class="fas fa-spinner fa-spin text-4xl text-purple-500"></i><p class="mt-4 text-slate-400">جاري جلب المواد...</p></div>`;

        document.getElementById('back-to-grades').onclick = showGrades;

        try {
            const q = query(collection(db, "school_subjects"), where("gradeCode", "==", gradeCode));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                contentArea.innerHTML = `
                    <div class="text-center mt-20">
                        <i class="fas fa-box-open text-6xl text-slate-600 mb-4"></i>
                        <p class="text-slate-400">لم يتم إضافة مواد لهذا الصف حتى الآن.</p>
                        <button id="retry-btn" class="mt-4 text-purple-400 hover:underline">حاول مرة أخرى</button>
                    </div>`;
                document.getElementById('retry-btn')?.addEventListener('click', () => loadSubjectsFromFirebase(gradeCode, gradeName));
                return;
            }

            let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate__animated animate__fadeInRight">`;
            
            const subjectsList = [];

            snapshot.forEach(doc => {
                const sub = doc.data();
                subjectsList.push(sub);
                
                // حساب عدد الفيديوهات (لو المصفوفة موجودة)
                const videoCount = sub.videos ? sub.videos.length : 0;

                html += `
                <div class="subject-card bg-slate-700/30 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-2 transition border border-slate-600 group" data-idx="${subjectsList.length - 1}">
                    <div class="h-40 overflow-hidden relative">
                        <img src="${sub.image || 'https://via.placeholder.com/300x200?text=Amin+Tech'}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
                        <div class="absolute bottom-3 right-3">
                            <h4 class="font-bold text-lg text-white">${sub.title}</h4>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-center text-sm text-slate-400 mb-3">
                            <span><i class="fas fa-video mr-1"></i> ${videoCount} حصص</span>
                            ${sub.pdf ? `<span><i class="fas fa-file-pdf mr-1 text-red-400"></i> PDF</span>` : ''}
                        </div>
                        <button class="w-full bg-slate-800 hover:bg-purple-600 text-white py-2 rounded-lg transition font-bold text-sm group-hover:shadow-lg group-hover:shadow-purple-500/20">
                            بدأ المذاكرة
                        </button>
                    </div>
                </div>`;
            });
            html += `</div>`;
            contentArea.innerHTML = html;

            contentArea.querySelectorAll('.subject-card').forEach(card => {
                card.addEventListener('click', () => {
                    const idx = card.getAttribute('data-idx');
                    const subject = subjectsList[idx];
                    
                    if (subject.videos && subject.videos.length > 0) {
                        modal.remove();
                        if (window.openLocalPlayer) {
                            window.openLocalPlayer(subject.title, subject.videos);
                        } else {
                            alert("مشغل الفيديو غير جاهز. تأكد من تحديث index.html");
                        }
                    } else {
                        alert("عذراً، لا توجد حصص مسجلة لهذه المادة حالياً.");
                    }
                });
            });

        } catch (err) {
            console.error(err);
            contentArea.innerHTML = `<p class="text-center text-red-400 mt-20">حدث خطأ في جلب المواد.</p>`;
        }
    }

    showGrades();
}

// تصدير الدوال
window.openUploadModal = openUploadModal;
window.openMyAssignments = openMyAssignments;
window.openCourseContent = openCourseContent;