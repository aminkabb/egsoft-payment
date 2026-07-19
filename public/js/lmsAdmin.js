import { auth, db } from "./firebase-config.js";
import { showMessage, formatDate } from "./shared.js";
import {
    collection, getDocs, query, orderBy, where,
    updateDoc, doc, serverTimestamp, setDoc, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const ADMIN_EMAIL = "aminkabbary11@gmail.com";

const GRADES_LIST = [
    { code: 'prep1', name: 'الأول الإعدادي' },
    { code: 'prep2', name: 'الثاني الإعدادي' },
    { code: 'prep3', name: 'الثالث الإعدادي' },
    { code: 'sec1', name: 'الأول الثانوي' },
    { code: 'sec2_sci', name: '2 ثانوي (علمي)' },
    { code: 'sec2_lit', name: '2 ثانوي (أدبي)' },
    { code: 'sec3_sci', name: '3 ثانوي (علوم)' },
    { code: 'sec3_math', name: '3 ثانوي (رياضة)' },
    { code: 'sec3_lit', name: '3 ثانوي (أدبي)' },
    { code: 'programming', name: 'كورسات البرمجة' }
];

// متغير لتخزين الواجبات مؤقتاً (عشان نحل مشكلة Base64)
window.currentGradeAssignments = {};

// ======= وظيفة توليد كود التفعيل (مشتركة مع البكالوريا) =======
function generateActivationCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += "-";
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ======= عرض لوحة التحكم =======
export async function showAdminPanel() {
    if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) {
        showMessage("⛔ دخول للأدمن فقط", "error");
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl w-full max-w-7xl overflow-hidden glass-card h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
                <div>
                    <h3 class="text-2xl font-bold gradient-text">لوحة التحكم + التصحيح</h3>
                    <p class="text-slate-400 text-sm">مرحباً مهندس أمين</p>
                </div>
                <button class="close-admin text-slate-400 hover:text-white"><i class="fas fa-times text-2xl"></i></button>
            </div>

            <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div class="w-full md:w-64 bg-slate-900/80 border-l border-slate-700 p-4 overflow-y-auto">
                    <h4 class="text-slate-400 font-bold mb-4 text-sm">التصفح:</h4>
                    <div class="space-y-2">
                        <button class="grade-btn w-full text-right p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 hover:text-white transition border border-purple-500/30 mb-2" onclick="loadBookings()">
                            <i class="fas fa-calendar-check ml-2"></i> طلبات الحجز
                        </button>
                        <button class="grade-btn w-full text-right p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600 hover:text-white transition border border-blue-500/30 mb-2" onclick="loadCenterBookings()">
                            <i class="fas fa-graduation-cap ml-2"></i> حجوزات السنتر
                        </button>
                        <button class="grade-btn w-full text-right p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 hover:text-white transition border border-emerald-500/30 mb-2" onclick="loadJobApplications()">
                            <i class="fas fa-briefcase ml-2"></i> طلبات التوظيف
                        </button>
                        <button class="grade-btn w-full text-right p-3 rounded-xl bg-yellow-600/20 hover:bg-yellow-600 hover:text-white transition border border-yellow-500/30 mb-4" onclick="loadBaccalaureateRequests()">
                            <i class="fas fa-graduation-cap ml-2"></i> طلبات البكالوريا
                        </button>
                        <div class="h-px bg-slate-700 my-4"></div>
                        ${GRADES_LIST.map(g => `
                            <button class="grade-btn w-full text-right p-3 rounded-lg hover:bg-slate-700 transition text-slate-300" onclick="loadSubjects('${g.code}', '${g.name}')">
                                <i class="fas fa-folder ml-2 text-yellow-500"></i> ${g.name}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="flex-1 p-6 overflow-y-auto bg-slate-800" id="admin-main-view">
                    <div class="text-center mt-20">
                        <i class="fas fa-chart-pie text-6xl text-slate-600 mb-4"></i>
                        <p class="text-slate-400 text-xl">اختر صفاً لعرض محتوياته</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.close-admin').addEventListener('click', () => modal.remove());
}

// ======= عرض المواد (الصفوف) =======
window.loadSubjects = async (gradeCode, gradeName) => {
    const view = document.getElementById('admin-main-view');
    view.innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-purple-500"></i></div>`;

    const q = query(collection(db, "assignments"), where("gradeCode", "==", gradeCode));
    const snapshot = await getDocs(q);

    window.currentGradeAssignments = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        if (!window.currentGradeAssignments[data.subject]) {
            window.currentGradeAssignments[data.subject] = [];
        }
        window.currentGradeAssignments[data.subject].push({ id: doc.id, ...data });
    });

    const subjects = Object.keys(window.currentGradeAssignments);

    if (subjects.length === 0) {
        view.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-white">${gradeName}</h2>
            <div class="text-center mt-10 text-slate-400">لا توجد واجبات مرفوعة.</div>
        `;
        return;
    }

    let html = `
        <h2 class="text-2xl font-bold mb-6 text-white border-b border-slate-700 pb-4">${gradeName}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    `;

    subjects.forEach(sub => {
        const count = window.currentGradeAssignments[sub].length;
        html += `
            <div class="glass-card p-6 rounded-xl cursor-pointer hover:bg-slate-700/50 transition border border-slate-600 group"
                 onclick="showAssignments('${sub}')">
                <div class="flex justify-between mb-2">
                    <span class="text-purple-400 font-bold text-lg group-hover:text-white">${sub}</span>
                    <span class="bg-slate-900 text-xs px-2 py-1 rounded text-slate-300">${count} واجب</span>
                </div>
                <p class="text-slate-500 text-sm group-hover:text-purple-300">عرض وتصحيح</p>
            </div>
        `;
    });
    html += `</div>`;
    view.innerHTML = html;
};

// ======= عرض الواجبات لمادة معينة =======
window.showAssignments = (subject) => {
    const assignments = window.currentGradeAssignments[subject];
    const view = document.getElementById('admin-main-view');

    let html = `
        <button onclick="document.querySelector('.grade-btn.active')?.click() || showAdminPanel()" class="mb-4 text-purple-400 hover:text-white flex items-center gap-2">
            <i class="fas fa-arrow-right"></i> عودة للمواد
        </button>
        <h2 class="text-2xl font-bold mb-6 text-white">تصحيح واجبات: <span class="gradient-text">${subject}</span></h2>
        <div class="grid gap-4">
    `;

    assignments.forEach(task => {
        const isGraded = task.status === 'graded';
        const borderColor = isGraded ? 'border-green-500/50' : 'border-slate-600';

        html += `
            <div class="bg-slate-700/40 p-5 rounded-xl border ${borderColor} flex flex-col gap-4 transition hover:bg-slate-700/60">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="flex items-center gap-4 w-full">
                        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg shrink-0">
                            ${task.studentName ? task.studentName.charAt(0) : '?'}
                        </div>
                        <div>
                            <h4 class="font-bold text-lg text-white mb-1">${task.studentName || 'غير معروف'}</h4>
                            <div class="flex flex-wrap gap-2 text-sm">
                                <span class="bg-slate-900 text-purple-300 px-2 py-1 rounded border border-slate-600 font-mono">
                                    ID: ${task.studentCode || '---'}
                                </span>
                                <span class="text-slate-400 self-center">
                                    📅 ${formatDate(task.uploadedAt?.toDate())}
                                </span>
                            </div>
                            ${task.notes ? `<p class="text-xs text-yellow-500/80 mt-1"><i class="fas fa-comment"></i> ${task.notes}</p>` : ''}
                        </div>
                    </div>

                    <div class="w-full md:w-auto shrink-0">
                        <a href="${task.fileUrl}" download="${task.fileName}" 
                           class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition font-bold shadow-lg shadow-emerald-500/20">
                            <i class="fas fa-download"></i> تحميل الواجب
                        </a>
                    </div>
                </div>

                <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-600 grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                    <div class="md:col-span-2">
                        <label class="text-xs text-slate-400 block mb-1">الدرجة (مثلاً 10/10)</label>
                        <input type="text" id="grade-${task.id}" value="${task.grade || ''}" class="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 text-sm focus:border-purple-500 outline-none">
                    </div>
                    <div class="md:col-span-4">
                        <label class="text-xs text-slate-400 block mb-1">ملاحظة للطالب</label>
                        <input type="text" id="note-${task.id}" value="${task.teacherNote || ''}" placeholder="أحسنت / راجع السؤال الثاني..." class="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 text-sm focus:border-purple-500 outline-none">
                    </div>
                    <div class="md:col-span-1">
                        <button onclick="saveGrade('${task.id}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-bold transition shadow-lg shadow-blue-600/20">
                            حفظ
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    view.innerHTML = html;
};

// ======= حفظ الدرجة =======
window.saveGrade = async (docId) => {
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = "...";

    const grade = document.getElementById(`grade-${docId}`).value;
    const note = document.getElementById(`note-${docId}`).value;

    try {
        await updateDoc(doc(db, "assignments", docId), {
            grade: grade,
            teacherNote: note,
            status: "graded"
        });

        for (let subject in window.currentGradeAssignments) {
            let task = window.currentGradeAssignments[subject].find(t => t.id === docId);
            if (task) {
                task.grade = grade;
                task.teacherNote = note;
                task.status = "graded";
                break;
            }
        }

        showMessage("✅ تم حفظ النتيجة وإرسالها للطالب", "success");
        btn.innerText = "تم الحفظ";
        setTimeout(() => btn.innerText = "حفظ", 2000);

        const card = btn.closest('.bg-slate-700\\/40');
        if (card) {
            card.classList.remove('border-slate-600');
            card.classList.add('border-green-500/50');
        }

    } catch (err) {
        console.error(err);
        showMessage("خطأ في الحفظ", "error");
        btn.innerText = oldText;
    }
};

// ======= طلبات الحجز (الكورسات العامة) =======
window.loadBookings = async () => {
    const view = document.getElementById('admin-main-view');
    view.innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-purple-500"></i></div>`;
    const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    let html = `<h2 class="text-2xl font-bold mb-6 text-white">طلبات الحجز</h2><div class="grid gap-4">`;
    if (snapshot.empty) html += '<p class="text-slate-400">فارغ</p>';
    snapshot.forEach(doc => {
        const d = doc.data();
        html += `<div class="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
            <h4 class="font-bold">${d.studentName}</h4>
            <p class="text-purple-400">${d.courseName}</p>
            <p class="text-slate-400 text-sm">📞 ${d.phone}</p>
        </div>`;
    });
    html += `</div>`;
    view.innerHTML = html;
};

// ======= طلبات التوظيف =======
window.loadJobApplications = async () => {
    const view = document.getElementById('admin-main-view');
    view.innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-emerald-500"></i></div>`;

    const EXP_MAP = {
        no_exp: 'بدون خبرة', less_1: 'أقل من سنة',
        '1_2': '1-2 سنة', '2_5': '2-5 سنوات', '5_plus': '+5 سنوات'
    };

    try {
        const q = query(collection(db, "job_applications"), orderBy("appliedAt", "desc"));
        const snapshot = await getDocs(q);

        let html = `
            <h2 class="text-2xl font-bold mb-6 text-white border-b border-slate-700 pb-4">
                طلبات التوظيف
                <span class="text-sm font-normal text-slate-400 mr-3">${snapshot.size} طلب</span>
            </h2>
        `;

        if (snapshot.empty) {
            html += '<p class="text-slate-400 text-center mt-10">لا توجد طلبات توظيف حتى الآن.</p>';
        } else {
            html += '<div class="grid gap-4">';
            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                const isNew = d.status === 'new';
                html += `
                    <div class="bg-slate-700/40 p-5 rounded-xl border ${isNew ? 'border-emerald-500/40' : 'border-slate-600'} flex flex-col md:flex-row justify-between gap-4">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl shrink-0">
                                ${d.name ? d.name.charAt(0) : '?'}
                            </div>
                            <div>
                                <h4 class="font-bold text-white text-lg">${d.name || '—'}</h4>
                                <span class="inline-block bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30 mb-2">${d.positionLabel || d.position}</span>
                                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                                    <span><i class="fas fa-phone text-xs ml-1"></i>${d.phone || '—'}</span>
                                    ${d.email ? `<span><i class="fas fa-envelope text-xs ml-1"></i>${d.email}</span>` : ''}
                                    <span><i class="fas fa-briefcase text-xs ml-1"></i>${EXP_MAP[d.experience] || d.experience}</span>
                                </div>
                                ${d.bio ? `<p class="text-slate-400 text-xs mt-2 italic">"${d.bio}"</p>` : ''}
                                ${d.portfolio ? `<a href="${d.portfolio}" target="_blank" class="text-xs text-cyan-400 hover:underline mt-1 block"><i class="fas fa-link ml-1"></i>${d.portfolio}</a>` : ''}
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 shrink-0">
                            <button onclick="markJobSeen('${docSnap.id}', this)"
                              class="text-xs ${isNew ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-600 hover:bg-slate-500'} text-white px-4 py-2 rounded-lg transition font-bold">
                                ${isNew ? '✅ تم الاطلاع' : '👁 تم'}
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        view.innerHTML = html;
    } catch (err) {
        console.error(err);
        view.innerHTML = '<p class="text-red-400">خطأ في تحميل البيانات</p>';
    }
};

window.markJobSeen = async (docId, btn) => {
    try {
        await updateDoc(doc(db, "job_applications", docId), { status: "seen" });
        btn.innerText = '👁 تم';
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
        btn.classList.add('bg-slate-600', 'hover:bg-slate-500');
    } catch (err) {
        console.error(err);
    }
};

// ======= حجوزات السنتر =======
window.loadCenterBookings = async () => {
    const view = document.getElementById('admin-main-view');
    view.innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-blue-400"></i></div>`;

    const STATUS = {
        pending: { label: '⏳ في انتظار التأكيد', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        paid: { label: '✅ تم الدفع', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        rejected: { label: '❌ لم يتم الدفع', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };

    try {
        const q = query(collection(db, "center_bookings"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        let pending = 0, paid = 0, rejected = 0;
        snapshot.forEach(d => {
            const s = d.data().status;
            if (s === 'paid') paid++;
            else if (s === 'rejected') rejected++;
            else pending++;
        });

        let html = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-4">
                    حجوزات السنتر
                    <span class="text-sm font-normal text-slate-400 mr-3">${snapshot.size} حجز</span>
                </h2>
                <div class="grid grid-cols-3 gap-3 mb-6">
                    <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-black text-yellow-400">${pending}</p>
                        <p class="text-xs text-slate-400">في الانتظار</p>
                    </div>
                    <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-black text-emerald-400">${paid}</p>
                        <p class="text-xs text-slate-400">تم الدفع</p>
                    </div>
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-black text-red-400">${rejected}</p>
                        <p class="text-xs text-slate-400">لم يتم الدفع</p>
                    </div>
                </div>
            </div>
        `;

        if (snapshot.empty) {
            html += '<p class="text-slate-400 text-center mt-10">لا توجد حجوزات حتى الآن.</p>';
        } else {
            html += '<div class="grid gap-4">';
            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                const st = STATUS[d.status] || STATUS.pending;
                const pay = d.payment || {};

                html += `
                <div class="bg-slate-700/40 rounded-2xl border border-slate-600 overflow-hidden hover:border-slate-500 transition" id="cb-card-${docSnap.id}">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 bg-slate-800/50 border-b border-slate-700">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shrink-0">
                                ${d.name ? d.name.charAt(0) : '?'}
                            </div>
                            <div>
                                <h4 class="font-black text-white text-lg leading-tight">${d.name || '—'}</h4>
                                <div class="flex flex-wrap gap-2 mt-1">
                                    <span class="bg-purple-600/20 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-500/30">${d.gradeLabel || d.grade}</span>
                                    ${d.division ? `<span class="bg-slate-600/50 text-slate-300 text-xs px-2 py-0.5 rounded">${d.division}</span>` : ''}
                                    <span class="bg-blue-600/20 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-500/30">${d.subject}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-xs font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded">${d.bookingId}</span>
                            <span class="text-xs font-bold px-3 py-1 rounded-full border ${st.color}">${st.label}</span>
                        </div>
                    </div>

                    <div class="p-4 grid md:grid-cols-2 gap-4">
                        <div class="space-y-1 text-sm text-slate-300">
                            <p class="text-slate-500 font-bold text-xs mb-2">بيانات الطالب</p>
                            <p><i class="fas fa-phone text-xs ml-2 text-blue-400"></i>${d.studentPhone}</p>
                            <p><i class="fas fa-phone text-xs ml-2 text-purple-400"></i>ولي الأمر: ${d.parentPhone}</p>
                            <p><i class="fas fa-school text-xs ml-2 text-emerald-400"></i>${d.school}</p>
                            <p><i class="fas fa-map-marker-alt text-xs ml-2 text-red-400"></i>${d.address}</p>
                            <p><i class="fas fa-calendar text-xs ml-2 text-slate-400"></i>ميلاد: ${d.dateOfBirth || '—'}</p>
                            ${d.schedule ? `<p><i class="fas fa-clock text-xs ml-2 text-yellow-400"></i>${d.schedule}</p>` : ''}
                            <p><i class="fas fa-tag text-xs ml-2"></i>${d.studentType} | سبق: ${d.prevBooking}</p>
                            ${d.notes ? `<p class="text-yellow-400/80 text-xs"><i class="fas fa-comment ml-1"></i>${d.notes}</p>` : ''}
                        </div>

                        <div class="space-y-1 text-sm text-slate-300">
                            <p class="text-slate-500 font-bold text-xs mb-2">بيانات الدفع</p>
                            <p><i class="fas fa-mobile-alt text-xs ml-2 text-orange-400"></i>محوّل من: ${pay.phone || '—'}</p>
                            <p><i class="fas fa-clock text-xs ml-2 text-slate-400"></i>وقت: ${pay.time || '—'}</p>
                            <p><i class="fas fa-money-bill text-xs ml-2 text-emerald-400"></i>المبلغ: ${pay.amount || '—'} ج</p>
                            ${pay.refLast4 ? `<p><i class="fas fa-hashtag text-xs ml-2"></i>آخر 4: ${pay.refLast4}</p>` : ''}
                            ${pay.receiptImage ? `
                            <button onclick="document.getElementById('receipt-img-${docSnap.id}').classList.toggle('hidden')"
                              class="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1">
                              <i class="fas fa-image"></i> عرض الإيصال
                            </button>
                            <img id="receipt-img-${docSnap.id}" src="${pay.receiptImage}" class="hidden w-full rounded-xl mt-2 max-h-40 object-contain border border-slate-600" alt="إيصال">
                            ` : '<p class="text-red-400 text-xs">⚠️ لا يوجد إيصال</p>'}
                        </div>
                    </div>

                    <div class="flex gap-2 p-4 pt-0">
                        <button onclick="updateCenterBookingStatus('${docSnap.id}', 'paid')"
                          class="flex-1 ${d.status === 'paid' ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-emerald-600'} text-white text-sm py-2 rounded-xl font-bold transition">
                          ✅ تم الدفع
                        </button>
                        <button onclick="updateCenterBookingStatus('${docSnap.id}', 'pending')"
                          class="flex-1 ${d.status === 'pending' ? 'bg-yellow-600' : 'bg-slate-700 hover:bg-yellow-600'} text-white text-sm py-2 rounded-xl font-bold transition">
                          ⏳ انتظار
                        </button>
                        <button onclick="updateCenterBookingStatus('${docSnap.id}', 'rejected')"
                          class="flex-1 ${d.status === 'rejected' ? 'bg-red-600' : 'bg-slate-700 hover:bg-red-600'} text-white text-sm py-2 rounded-xl font-bold transition">
                          ❌ رفض
                        </button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        view.innerHTML = html;
    } catch (err) {
        console.error(err);
        view.innerHTML = '<p class="text-red-400 text-center mt-10">خطأ في تحميل البيانات</p>';
    }
};

window.updateCenterBookingStatus = async (docId, status) => {
    try {
        await updateDoc(doc(db, "center_bookings", docId), { status });
        showMessage(
            status === 'paid' ? '✅ تم تأكيد الدفع' :
            status === 'rejected' ? '❌ تم رفض الحجز' : '⏳ تم تحديث الحالة',
            status === 'rejected' ? 'error' : 'success'
        );
        loadCenterBookings();
    } catch (err) {
        console.error(err);
        showMessage('خطأ في التحديث', 'error');
    }
};

// ======= طلبات البكالوريا =======
window.loadBaccalaureateRequests = async () => {
    const view = document.getElementById('admin-main-view');
    view.innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-yellow-500"></i></div>`;

    const STATUS = {
        pending: { label: '⏳ قيد المراجعة', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        paid: { label: '✅ تم الدفع', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        rejected: { label: '❌ مرفوض', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };

    try {
        const q = query(collection(db, "free_course_regs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        let pending = 0, paid = 0, rejected = 0;
        snapshot.forEach(d => {
            const s = d.data().status || 'pending';
            if (s === 'paid') paid++;
            else if (s === 'rejected') rejected++;
            else pending++;
        });

        let html = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-4">
                    طلبات كورس البكالوريا
                    <span class="text-sm font-normal text-slate-400 mr-3">${snapshot.size} طلب</span>
                </h2>
                <div class="grid grid-cols-3 gap-3 mb-6">
                    <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-black text-yellow-400">${pending}</p>
                        <p class="text-xs text-slate-400">قيد المراجعة</p>
                    </div>
                    <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-black text-emerald-400">${paid}</p>
                        <p class="text-xs text-slate-400">تم الدفع</p>
                    </div>
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                        <p class="text-2xl font-black text-red-400">${rejected}</p>
                        <p class="text-xs text-slate-400">مرفوض</p>
                    </div>
                </div>
            </div>
        `;

        if (snapshot.empty) {
            html += '<p class="text-slate-400 text-center mt-10">لا توجد طلبات حتى الآن.</p>';
        } else {
            html += '<div class="grid gap-4">';
            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                const st = STATUS[d.status] || STATUS.pending;
                const pay = d.payment || {};

                html += `
                <div class="bg-slate-700/40 rounded-2xl border border-slate-600 overflow-hidden hover:border-yellow-500/50 transition" id="bac-card-${docSnap.id}">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 bg-slate-800/50 border-b border-slate-700">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center font-black text-white text-xl shrink-0">
                                ${d.name ? d.name.charAt(0) : '?'}
                            </div>
                            <div>
                                <h4 class="font-black text-white text-lg leading-tight">${d.name || '—'}</h4>
                                <div class="flex flex-wrap gap-2 mt-1">
                                    <span class="bg-orange-600/20 text-orange-300 text-xs px-2 py-0.5 rounded border border-orange-500/30">${d.bookingId || '—'}</span>
                                    <span class="bg-purple-600/20 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-500/30">${d.school || '—'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-xs font-bold px-3 py-1 rounded-full border ${st.color}">${st.label}</span>
                            ${d.activationCode ? `<span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 font-mono">🔑 ${d.activationCode}</span>` : ''}
                        </div>
                    </div>

                    <div class="p-4 grid md:grid-cols-2 gap-4">
                        <div class="space-y-1 text-sm text-slate-300">
                            <p class="text-slate-500 font-bold text-xs mb-2">بيانات الطالب</p>
                            <p><i class="fas fa-phone text-xs ml-2 text-blue-400"></i>${d.phone || '—'}</p>
                            <p><i class="fas fa-phone text-xs ml-2 text-purple-400"></i>ولي الأمر: ${d.parentPhone || '—'}</p>
                            <p><i class="fas fa-school text-xs ml-2 text-emerald-400"></i>${d.school || '—'}</p>
                            <p><i class="fas fa-map-marker-alt text-xs ml-2 text-red-400"></i>${d.address || '—'}</p>
                            <p><i class="fas fa-calendar text-xs ml-2 text-slate-400"></i>ميلاد: ${d.dateOfBirth || '—'}</p>
                            <p><i class="fas fa-tag text-xs ml-2"></i>رقم الحجز: ${d.bookingId || '—'}</p>
                        </div>

                        <div class="space-y-1 text-sm text-slate-300">
                            <p class="text-slate-500 font-bold text-xs mb-2">بيانات الدفع</p>
                            <p><i class="fas fa-mobile-alt text-xs ml-2 text-orange-400"></i>محوّل من: ${pay.phone || '—'}</p>
                            <p><i class="fas fa-clock text-xs ml-2 text-slate-400"></i>وقت: ${pay.time || '—'}</p>
                            <p><i class="fas fa-money-bill text-xs ml-2 text-emerald-400"></i>المبلغ: ${pay.amount || '—'} ج</p>
                            ${pay.refLast4 ? `<p><i class="fas fa-hashtag text-xs ml-2"></i>آخر 4: ${pay.refLast4}</p>` : ''}
                            ${pay.receiptImage ? `
                            <button onclick="document.getElementById('bac-receipt-${docSnap.id}').classList.toggle('hidden')"
                              class="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1">
                              <i class="fas fa-image"></i> عرض الإيصال
                            </button>
                            <img id="bac-receipt-${docSnap.id}" src="${pay.receiptImage}" class="hidden w-full rounded-xl mt-2 max-h-40 object-contain border border-slate-600" alt="إيصال">
                            ` : '<p class="text-red-400 text-xs">⚠️ لا يوجد إيصال</p>'}
                        </div>
                    </div>

                    <div class="flex gap-2 p-4 pt-0 flex-wrap">
                        <button onclick="updateBacRequestStatus('${docSnap.id}', 'paid')"
                          class="flex-1 ${d.status === 'paid' ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-emerald-600'} text-white text-sm py-2 rounded-xl font-bold transition">
                          ✅ تأكيد الدفع
                        </button>
                        <button onclick="updateBacRequestStatus('${docSnap.id}', 'pending')"
                          class="flex-1 ${d.status === 'pending' ? 'bg-yellow-600' : 'bg-slate-700 hover:bg-yellow-600'} text-white text-sm py-2 rounded-xl font-bold transition">
                          ⏳ إعادة للمراجعة
                        </button>
                        <button onclick="updateBacRequestStatus('${docSnap.id}', 'rejected')"
                          class="flex-1 ${d.status === 'rejected' ? 'bg-red-600' : 'bg-slate-700 hover:bg-red-600'} text-white text-sm py-2 rounded-xl font-bold transition">
                          ❌ رفض
                        </button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        view.innerHTML = html;
    } catch (err) {
        console.error(err);
        view.innerHTML = '<p class="text-red-400 text-center mt-10">خطأ في تحميل البيانات</p>';
    }
};

// ======= دالة تحديث حالة طلب البكالوريا (معدلة) =======
window.updateBacRequestStatus = async (docId, status) => {
    try {
        const updateData = { status };
        const requestRef = doc(db, "free_course_regs", docId);

        if (status === 'paid') {
            // توليد كود جديد
            const code = generateActivationCode();

            // 1. حفظ الكود في مجموعة "coupons" مع courseId
            const couponRef = doc(db, "coupons", code);
            await setDoc(couponRef, {
                isUsed: false,
                courseId: "baccalaureate",   // مهم للتطابق مع الكورس
                createdAt: serverTimestamp(),
                generatedFor: docId
            });

            // 2. تحديث طلب البكالوريا بحفظ الكود أيضاً
            updateData.activationCode = code;
            updateData.codeRevealedAt = serverTimestamp();

            showMessage(`✅ تم إنشاء كود التفعيل: ${code}`, "success");
        }
        else if (status === 'pending' || status === 'rejected') {
            // نقرأ الطلب أولاً لمعرفة الكود القديم
            const requestSnap = await getDoc(requestRef);
            if (requestSnap.exists()) {
                const oldCode = requestSnap.data().activationCode;
                if (oldCode) {
                    try {
                        await deleteDoc(doc(db, "coupons", oldCode));
                    } catch (e) { /* قد يكون الكود غير موجود */ }
                }
            }
            // نمسح الكود من الطلب
            updateData.activationCode = null;
            updateData.codeRevealedAt = null;
        }

        // تنفيذ التحديث
        await updateDoc(requestRef, updateData);

        showMessage(
            status === 'paid' ? '✅ تم تأكيد الدفع وفتح الكورس' :
            status === 'rejected' ? '❌ تم رفض الطلب' : '⏳ تم إعادة الطلب للمراجعة',
            status === 'rejected' ? 'error' : 'success'
        );
        loadBaccalaureateRequests(); // إعادة تحميل القائمة
    } catch (err) {
        console.error(err);
        showMessage('خطأ في التحديث', 'error');
    }
};

window.showAdminPanel = showAdminPanel;