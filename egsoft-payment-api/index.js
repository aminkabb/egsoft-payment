const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== إعدادات Paymob =====
const PAYMOB_API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRJd01EVXpNQ3dpYm1GdFpTSTZJakUzT0RRek9UTTBPVEl1TlRBeE1ERTFJbjAuWE5IWW9qWkZrMDdEbkNEZS1RbHcxSzFnN0lFdmYxZnlwVW9ZcmZ0WVpUTVZ3QW1JbGJ1M1pHcm93bG11SkZwUFdBRHBXa0RuMTZlekFMSjNPWVFEMEE=";
const INTEGRATION_ID = "5783108"; // Wallet Integration

app.post("/create-payment", async (req, res) => {
    try {
        const { amountCents, merchantOrderId, billingData } = req.body;

        // 1. توكن الدخول
        const authResponse = await axios.post("https://accept.paymob.com/api/auth/tokens", {
            api_key: PAYMOB_API_KEY
        });
        const authToken = authResponse.data.token;

        // 2. إنشاء الطلب
        const orderResponse = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amountCents,
            currency: "EGP",
            merchant_order_id: merchantOrderId,
            items: []
        });
        const orderId = orderResponse.data.id;

        // 3. مفتاح الدفع
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

        // ✅ نرجع paymentUrl
        const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/1?payment_token=${paymentToken}`;

        res.json({
            success: true,
            paymentToken: paymentToken,
            paymentUrl: paymentUrl
        });

    } catch (error) {
        console.error("🔴 خطأ:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: "خطأ في الدفع" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
