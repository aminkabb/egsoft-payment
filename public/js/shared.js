// js/shared.js
import { auth } from "./firebase-config.js";

// إظهار رسالة للمستخدم (الإشعارات الملونة)
export function showMessage(message, type = "success") {
  // التأكد من عدم تكرار الرسائل
  if (document.querySelector('.app-notification')) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `app-notification fixed top-20 right-4 z-[9999] p-4 rounded-xl font-bold shadow-2xl transition-all duration-300 transform translate-x-full ${
    type === 'success' 
      ? 'bg-gradient-to-l from-emerald-600 to-green-500 text-white' 
      : 'bg-gradient-to-l from-red-600 to-pink-500 text-white'
  }`;
  
  messageDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(messageDiv);
  
  // أنيميشن الدخول
  setTimeout(() => {
      messageDiv.classList.remove('translate-x-full');
  }, 10);

  // الاختفاء التلقائي
  setTimeout(() => {
    messageDiv.classList.add('translate-x-full');
    setTimeout(() => {
      if (messageDiv.parentNode) {
        document.body.removeChild(messageDiv);
      }
    }, 300);
  }, 3000);
}

// تنسيق التاريخ
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// توليد رقم طلب فريد
export function generateOrderId() {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}