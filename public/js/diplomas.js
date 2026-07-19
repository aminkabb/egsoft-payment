// js/diplomas.js - النسخة النهائية المحدثة (بتعرض التفاصيل كاملة) 🚀

import { db } from "./firebase-config.js"; 
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

console.log("✅ ملف الدبلومات يعمل (شامل التفاصيل الديناميكية)...");

let allDiplomas = [];

// ============================================================
// 1. دالة جلب وعرض الدبلومات
// ============================================================
export async function loadDiplomas() {
    const grid = document.getElementById('pro-courses-grid');
    if (!grid) {
        console.warn("⚠️ مش لاقي pro-courses-grid");
        return;
    }

    try {
        grid.innerHTML = '<div class="col-span-3 text-center text-slate-400"><div class="w-12 h-12 border-4 border-t-[#22d3ee] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div><p class="mt-4">جاري تحميل الدبلومات...</p></div>';
        
        const querySnapshot = await getDocs(collection(db, "diplomas"));
        allDiplomas = [];
        
        if (querySnapshot.empty) {
            grid.innerHTML = '<div class="col-span-3 text-center text-slate-500 py-10"><i class="fas fa-graduation-cap text-4xl mb-4 opacity-50"></i><p class="text-xl">لا توجد دبلومات متاحة حالياً</p></div>';
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnap) => {
            const course = { id: docSnap.id, ...docSnap.data() };
            allDiplomas.push(course);
            
            const price = course.price || 0;
            const category = course.category || "Diploma";
            
            html += `
            <div class="bg-white rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full group transform hover:-translate-y-2">
                <div class="bg-gradient-to-br from-[#22d3ee] to-[#0ea5e9] h-48 relative overflow-hidden">
                    <img src="${course.image || 'https://via.placeholder.com/400'}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                         onerror="this.src='https://via.placeholder.com/400x200/22d3ee/ffffff?text=Amin+Tech'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute top-4 left-4 bg-gradient-to-r from-[#ff6b00] to-[#ff9500] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        ${category}
                    </div>
                    <div class="absolute bottom-4 right-4 text-white font-bold text-lg drop-shadow-md">
                        ${course.title}
                    </div>
                </div>
                
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex justify-between items-center text-sm font-bold text-gray-500 mb-4 border-b border-gray-100 pb-4">
                        <div class="flex items-center gap-1"><i class="fas fa-layer-group text-[#22d3ee]"></i><span>${course.lessons || 20} درس</span></div>
                        <div class="flex items-center gap-1"><i class="fas fa-calendar-check text-[#22d3ee]"></i><span>${course.weeks || 12} أسبوع</span></div>
                        <div class="flex items-center gap-1"><i class="fas fa-clock text-[#22d3ee]"></i><span>${course.hours || 40} ساعة</span></div>
                    </div>
                    
                    <p class="text-gray-600 text-sm mb-6 text-right leading-relaxed flex-1">
                        ${course.desc || 'دبلومة متكاملة لتأهيلك لسوق العمل'}
                    </p>
                    
                    <div class="text-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <span class="block text-gray-400 text-xs line-through mb-1">${(price * 1.5).toLocaleString()} ج.م</span>
                        <span class="text-3xl font-black text-blue-900">${price.toLocaleString()} ج.م</span>
                        <span class="block text-green-600 text-sm font-bold mt-1">وفر ${(price * 0.5).toLocaleString()} ج.م</span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-auto">
                        <button onclick="window.openNewBooking('${course.id}', '${course.title}', ${price})" 
                                class="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg flex justify-center items-center gap-2">
                            <i class="fas fa-shopping-cart"></i> اشترك الآن
                        </button>
                        <button onclick="window.openDiplomaDetails('${course.id}')" 
                                class="bg-gradient-to-r from-[#ff6b00] to-[#ff9500] hover:from-[#ff9500] hover:to-[#ff6b00] text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg flex justify-center items-center gap-2">
                            <i class="fas fa-info-circle"></i> التفاصيل
                        </button>
                    </div>
                </div>
            </div>`;
        });
        
        grid.innerHTML = html;
        window.allDiplomas = allDiplomas;

    } catch (error) {
        console.error("❌ خطأ في تحميل الدبلومات:", error);
        grid.innerHTML = '<div class="col-span-3 text-center text-red-500 py-10">حدث خطأ في الاتصال بقاعدة البيانات</div>';
    }
}

// ============================================================
// 2. دوال التحكم في النوافذ (Modal & Details)
// ============================================================
window.openNewBooking = function(courseId, title, price) {
    const modal = document.getElementById('new-booking-modal');
    if (modal) {
        document.getElementById('new-booking-course-title').innerText = title;
        document.getElementById('new-bill-price').innerText = price.toLocaleString() + ' ج.م';
        document.getElementById('new-bill-total').innerText = price.toLocaleString() + ' ج.م';
        
        modal.dataset.courseId = courseId;
        modal.dataset.courseTitle = title;
        modal.dataset.coursePrice = price;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
};

window.closeNewBooking = function() {
    const modal = document.getElementById('new-booking-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
};

// 🔥 دالة فتح التفاصيل (المحدثة لتقرأ المنهج) 🔥
window.openDiplomaDetails = function(courseId) {
    const course = window.allDiplomas?.find(d => d.id === courseId);
    if (!course) {
        alert('بيانات الدبلومة غير متوفرة حالياً');
        return;
    }
    
    // 1. تحويل مصفوفة المنهج (syllabus) إلى HTML
    let syllabusHTML = '';
    if (course.syllabus && Array.isArray(course.syllabus) && course.syllabus.length > 0) {
        syllabusHTML = course.syllabus.map(topic => `
            <li class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700 transition">
                <i class="fas fa-check-circle text-[#22d3ee] text-xl shrink-0"></i>
                <span class="text-slate-200 font-bold">${topic}</span>
            </li>
        `).join('');
    } else {
        // لو مفيش منهج، نعرض رسالة لطيفة
        syllabusHTML = `
            <div class="col-span-2 text-center text-slate-400 py-4">
                <i class="fas fa-tools mb-2"></i>
                <p>تفاصيل المنهج ستتوفر قريباً.</p>
            </div>
        `;
    }

    // 2. إنشاء صفحة التفاصيل
    const detailsWindow = window.open('', '_blank');
    detailsWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <title>${course.title} | تفاصيل الدبلومة</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { font-family: 'Cairo', sans-serif; background: #0f172a; color: white; }
                .grad-text { background: linear-gradient(90deg, #22d3ee, #3b82f6); -webkit-background-clip: text; color: transparent; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #1e293b; }
                ::-webkit-scrollbar-thumb { background: #22d3ee; border-radius: 4px; }
            </style>
        </head>
        <body class="p-4 md:p-8">
            <div class="max-w-5xl mx-auto">
                <button onclick="window.close()" class="mb-6 text-slate-400 hover:text-white flex items-center gap-2 transition bg-slate-800 px-4 py-2 rounded-lg">
                    <i class="fas fa-arrow-right"></i> إغلاق
                </button>
                
                <div class="relative rounded-3xl overflow-hidden shadow-2xl mb-8 h-64 md:h-80 border border-slate-700">
                    <img src="${course.image}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent flex flex-col justify-end p-6 md:p-8">
                        <span class="bg-[#22d3ee] text-slate-900 px-4 py-1 rounded-full font-bold text-sm w-fit mb-3 shadow-lg">${course.category}</span>
                        <h1 class="text-3xl md:text-5xl font-black mb-2 shadow-black drop-shadow-lg text-white">${course.title}</h1>
                        <p class="text-slate-200 text-lg md:text-xl max-w-2xl leading-relaxed">${course.desc}</p>
                    </div>
                </div>

                <div class="grid lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 space-y-8">
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700">
                                <i class="fas fa-calendar-alt text-[#22d3ee] text-2xl mb-2"></i>
                                <div class="font-bold text-lg">${course.weeks} أسبوع</div>
                            </div>
                            <div class="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700">
                                <i class="fas fa-clock text-[#22d3ee] text-2xl mb-2"></i>
                                <div class="font-bold text-lg">${course.hours} ساعة</div>
                            </div>
                            <div class="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700">
                                <i class="fas fa-project-diagram text-[#22d3ee] text-2xl mb-2"></i>
                                <div class="font-bold text-lg">${course.projects || 5} مشاريع</div>
                            </div>
                            <div class="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700">
                                <i class="fas fa-star text-yellow-400 text-2xl mb-2"></i>
                                <div class="font-bold text-lg">4.8 تقييم</div>
                            </div>
                        </div>

                        <div class="bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-slate-700">
                            <h2 class="text-2xl font-black mb-6 flex items-center gap-3 border-b border-slate-700 pb-4 text-white">
                                <i class="fas fa-list-ul text-[#22d3ee]"></i> محتوى الدبلومة
                            </h2>
                            <ul class="grid md:grid-cols-2 gap-4">
                                ${syllabusHTML}
                            </ul>
                        </div>
                    </div>

                    <div class="lg:col-span-1">
                        <div class="bg-slate-800 rounded-3xl p-6 border border-slate-700 sticky top-8 shadow-2xl">
                            <div class="text-center mb-6">
                                <p class="text-slate-400 text-sm mb-2">سعر الدبلومة الشامل</p>
                                <div class="text-4xl font-black text-white mb-2">${course.price.toLocaleString()} <span class="text-lg text-[#22d3ee]">ج.م</span></div>
                                <div class="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full inline-block">خصم خاص لفترة محدودة</div>
                            </div>

                            <div class="space-y-4 mb-8">
                                <div class="flex items-center gap-3 text-slate-300 text-sm">
                                    <i class="fas fa-check text-green-500"></i> <span>شهادة معتمدة موثقة</span>
                                </div>
                                <div class="flex items-center gap-3 text-slate-300 text-sm">
                                    <i class="fas fa-check text-green-500"></i> <span>دعم فني ومتابعة مع المدرب</span>
                                </div>
                                <div class="flex items-center gap-3 text-slate-300 text-sm">
                                    <i class="fas fa-check text-green-500"></i> <span>تطبيقات ومشاريع عملية</span>
                                </div>
                            </div>

                            <button onclick="window.opener.openNewBooking('${course.id}', '${course.title}', ${course.price}); window.close();" 
                                class="w-full bg-gradient-to-r from-[#22d3ee] to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-[#22d3ee]/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                                <i class="fas fa-shopping-cart"></i> احجز مكانك الآن
                            </button>
                            
                            <p class="text-center text-slate-500 text-xs mt-4">ضمان استرجاع الأموال خلال 14 يوم</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    detailsWindow.document.close();
};

// ============================================================
// 3. كود الحجز الفعلي (إرسال للفايربيز)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('new-booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحجز...';
            btn.disabled = true;
            
            const courseId = document.getElementById('new-booking-modal').dataset.courseId;
            const courseTitle = document.getElementById('new-booking-modal').dataset.courseTitle;
            const coursePrice = document.getElementById('new-booking-modal').dataset.coursePrice;
            
            const bookingData = {
                courseId: courseId,
                courseTitle: courseTitle,
                coursePrice: coursePrice,
                studentName: document.getElementById('new-book-name').value,
                studentPhone: document.getElementById('new-book-phone').value,
                studentEmail: document.getElementById('new-book-email').value,
                branch: document.querySelector('select')?.value || 'online',
                createdAt: serverTimestamp(),
                status: 'pending'
            };
            
            try {
                console.log("جاري إرسال البيانات...", bookingData);
                await addDoc(collection(db, "bookings"), bookingData);
                
                alert(`✅ مبروك! تم حجز دبلومة "${courseTitle}" بنجاح.\nسنتواصل معك قريباً لتأكيد التفاصيل.`);
                
                window.closeNewBooking();
                bookingForm.reset();
                
            } catch (error) {
                console.error("❌ خطأ في الحجز:", error);
                alert("حدث خطأ أثناء الحجز، تأكد من اتصال الإنترنت وحاول مرة أخرى.");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});

// تحميل الدبلومات عند فتح الصفحة
loadDiplomas();