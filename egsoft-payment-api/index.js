const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// السماح لموقعك (الفرونت إند) بالاتصال بالسيرفر بدون أخطاء
app.use(cors({ origin: "*" })); 
app.use(express.json());

// ⚠️ ضع الـ API Key الخاص بك هنا (بين علامتي التنصيص)
const PAYMOB_API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRJd01EVXpNQ3dpYm1GdFpTSTZJakUzT0RRek9UTTBPVEl1TlRBeE1ERTFJbjAuWE5IWW9qWkZrMDdEbkNEZS1RbHcxSzFnN0lFdmYxZnlwVW9ZcmZ0WVpUTVZ3QW1JbGJ1M1pHcm93bG11SkZwUFdBRHBXa0RuMTZlekFMSjNPWVFEMEE=";
const INTEGRATION_ID = "5783108"; // رقم المحافظ الإلكترونية الخاص بك

// دالة إنشاء الدفع (API Endpoint)
app.post("/create-payment", async (req, res) => {
    try {
        const amountCents = req.body.amountCents || "10000"; 
        const billingData = req.body.billingData || {
            "apartment": "NA",
            "email": "test@egsoft.com",
            "floor": "NA",
            "first_name": "Client",
            "street": "NA",
            "building": "NA",
            "phone_number": "+201000000000",
            "shipping_method": "NA",
            "postal_code": "NA",
            "city": "NA",
            "country": "EG",
            "last_name": "Name",
            "state": "NA"
        };

        // الخطوة 1: توكن الدخول
        const authResponse = await axios.post("https://accept.paymob.com/api/auth/tokens", {
            api_key: PAYMOB_API_KEY
        });
        const authToken = authResponse.data.token;

        // الخطوة 2: تسجيل الطلب
        const orderResponse = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amountCents,
            currency: "EGP",
            items: []
        });
        const orderId = orderResponse.data.id;

        // الخطوة 3: مفتاح الدفع النهائي
        const paymentKeyResponse = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: "EGP",
            integration_id: INTEGRATION_ID
        });
        const paymentToken = paymentKeyResponse.data.token;

        // إرجاع النتيجة لموقعك
        res.status(200).json({
            success: true,
            orderId: orderId,
            paymentToken: paymentToken,
            message: "تم إنشاء مفتاح الدفع بنجاح للمحفظة الإلكترونية!"
        });

    } catch (error) {
        console.error("Paymob Error: ", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            error: "حدث خطأ أثناء معالجة الدفع",
            details: error.response ? error.response.data : error.message
        });
    }
});

// تشغيل السيرفر على المنصة
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// السطر ده مهم جداً عشان Vercel يقدر يشغل الـ API بنجاح
module.exports = app;