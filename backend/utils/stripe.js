import Stripe from 'stripe';

console.log(`💳 Stripe Secret Key Present: ${!!process.env.STRIPE_SECRET_KEY}`);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Or latest
});

/**
 * Create Stripe Checkout Session
 */
export const createCheckout = async (customerEmail, orgId, priceId) => {
    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/billing/cancel`,
        metadata: { orgId }
    });
};

/**
 * Create Stripe Customer Portal Session
 */
export const createPortal = async (stripeCustomerId) => {
    return await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.APP_URL}/billing`
    });
};

/**
 * Validate Webhook Signature
 */
export const validateWebhook = (payload, sig) => {
    return stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );
};

export default stripe;
