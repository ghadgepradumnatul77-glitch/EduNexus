import { query } from '../db/connection.js';
import { validateWebhook } from '../utils/stripe.js';
import redis from '../utils/redis.js';

/**
 * Stripe Webhook Handler
 * Processes async events from Stripe with signature verification.
 */
export const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Note: Stripe requires the RAW body for signature verification
        event = validateWebhook(req.body, sig);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;
    const eventType = event.type;

    try {
        switch (eventType) {
            case 'checkout.session.completed':
                await handleSubscriptionCreated(data);
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await handleSubscriptionUpdated(data);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(data);
                break;

            default:
                console.log(`Unhandled event type ${eventType}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error(`Database Error processing ${eventType}:`, err);
        res.status(500).json({ error: 'Internal server error processing webhook' });
    }
};

/**
 * Handle initial subscription creation
 */
async function handleSubscriptionCreated(session) {
    const tenantId = session.metadata.tenantId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // We'll update the organization with the new Stripe data
    // The tier will be resolved in handleSubscriptionUpdated via the subscription object itself
    await query(
        `UPDATE organizations 
     SET stripe_customer_id = $1, stripe_subscription_id = $2 
     WHERE id = $3`,
        [customerId, subscriptionId, tenantId]
    );
}

/**
 * Sync Subscription State (Creation/Update/Deletion)
 */
async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status; // 'active', 'past_due', 'canceled', etc.
    const periodEnd = new Date(subscription.current_period_end * 1000);

    // Resolve Tier from Stripe Price ID
    const priceId = subscription.items.data[0].price.id;

    const planResult = await query(
        'SELECT name FROM subscription_plans WHERE stripe_price_id = $1',
        [priceId]
    );

    const tier = planResult.rows[0]?.name || 'free';

    await query(
        `UPDATE organizations 
     SET subscription_tier = $1, 
         subscription_status = $2, 
         current_period_end = $3,
         stripe_subscription_id = $4
     WHERE stripe_customer_id = $5`,
        [tier, status, periodEnd, subscriptionId, customerId]
    );

    // Invalidate Redis Tier Cache
    const orgResult = await query('SELECT id FROM organizations WHERE stripe_customer_id = $1', [customerId]);
    if (orgResult.rows[0]) {
        await redis.del(`tenant:${orgResult.rows[0].id}:tier_info`);
    }
}

/**
 * Handle Payment Failures (Soft Restriction Only)
 */
async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;

    await query(
        `UPDATE organizations 
     SET subscription_status = 'past_due' 
     WHERE stripe_customer_id = $1`,
        [customerId]
    );
}
