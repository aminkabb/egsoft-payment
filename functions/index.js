const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const PAYMOB_API_KEY = functions.config().paymob.apikey;
const INTEGRATION_ID = "5783108"; // رقم المحافظ الإلكترونية الخاص بك

exports.createPayment = onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

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

            // تم إزالة الـ iframe تماماً، سنكتفي بإرسال الـ Token للواجهة الأمامية
            res.status(200).json({
                success: true,
                orderId: orderId,
                paymentToken: paymentToken,
                message: "تم إنشاء مفتاح الدفع بنجاح للمحفظة الإلكترونية!"
            });

        } catch (error) {
            logger.error("Paymob Error: ", error.response ? error.response.data : error.message);
            res.status(500).json({ 
                success: false, 
                error: "حدث خطأ أثناء معالجة الدفع",
                details: error.response ? error.response.data : error.message
            });
        }
    });
});