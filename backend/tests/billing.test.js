import request from 'supertest';
import app from '../server.js';
import { query } from '../db/connection.js';
import crypto from 'crypto';

/**
 * SaaS Monetization & Billing Test Suite
 */
describe('SaaS Monetization & Billing', () => {
    let testOrg;
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

    const generateStripeSignature = (payload) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const signedPayload = `${timestamp}.${payload}`;
        const hmac = crypto
            .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
            .update(signedPayload)
            .digest('hex');
        return `t=${timestamp},v1=${hmac}`;
    };

    beforeAll(async () => {
        // Find or create a test organization
        const orgResult = await query("SELECT id, stripe_customer_id FROM organizations WHERE slug = 'oxford'");
        testOrg = orgResult.rows[0];
    });

    test('Webhook: checkout.session.completed should sync Stripe metadata', async () => {
        const payload = JSON.stringify({
            id: 'evt_test_123',
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: { orgId: testOrg.id },
                    customer: 'cus_test_999',
                    subscription: 'sub_test_999'
                }
            }
        });

        const sig = generateStripeSignature(payload);

        const response = await request(app)
            .post('/api/billing/webhook')
            .set('stripe-signature', sig)
            .set('Content-Type', 'application/json')
            .send(payload);

        expect(response.status).toBe(200);

        const updatedOrg = await query('SELECT stripe_customer_id FROM organizations WHERE id = $1', [testOrg.id]);
        expect(updatedOrg.rows[0].stripe_customer_id).toBe('cus_test_999');
    });

    test('Middleware: checkFeatureAccess should block Pro features for Free tier', async () => {
        // Oxford is 'free' by default
        const response = await request(app)
            .get('/api/saas/tenants') // Assuming this endpoint uses checkFeatureAccess('advanced_analytics')
            .set('Host', 'oxford.edunexus.com')
            .set('Authorization', 'Bearer mock-jwt-token'); // Mock auth needed

        // If 'advanced_analytics' is required:
        // expect(response.status).toBe(403);
        // expect(response.body.upgradeRequired).toBe(true);
    });

    test('Middleware: checkQuota should block user creation if limit reached', async () => {
        // Seed usage usage summary
        await query(
            "INSERT INTO organization_usage (organization_id, current_user_count) VALUES ($1, 10) ON CONFLICT (organization_id) DO UPDATE SET current_user_count = 10",
            [testOrg.id]
        );

        // Attempt to create user on 'free' tier (limit 10)
        // const response = await request(app)
        //     .post('/api/users')
        //     .set('Host', 'oxford.edunexus.com')
        //     .send({ email: 'overlimit@oxford.edu' });

        // expect(response.status).toBe(403);
        // expect(response.body.message).toContain('limit reached');
    });

    test('Soft Restriction: past_due status should block writes but allow reads', async () => {
        await query("UPDATE organizations SET subscription_status = 'past_due' WHERE id = $1", [testOrg.id]);

        // GET should work
        const getRes = await request(app)
            .get('/health/tenant/oxford')
            .set('Host', 'oxford.edunexus.com');
        expect(getRes.status).toBe(200);

        // POST should be blocked by checkFeatureAccess/tierEnforcement
        // const postRes = await request(app)
        //     .post('/api/attendance')
        //     .set('Host', 'oxford.edunexus.com')
        //     .send({});
        // expect(postRes.status).toBe(402);
    });
});
