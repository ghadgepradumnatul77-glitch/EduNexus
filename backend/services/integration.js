import { query } from '../db/connection.js';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Enterprise Webhook Dispatcher
 * Sends secure, signed events to tenant-defined URLs.
 */
export const dispatchWebhook = async (orgId, eventType, payload) => {
    try {
        // 1. Get webhook configuration for this organization
        const result = await query(
            'SELECT url, secret FROM organization_webhooks WHERE organization_id = $1 AND enabled = TRUE AND event_types @> $2',
            [orgId, JSON.stringify([eventType])]
        );

        for (const webhook of result.rows) {
            const signature = crypto
                .createHmac('sha256', webhook.secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            // 2. Dispatch asynchronously
            axios.post(webhook.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-EduNexus-Event': eventType,
                    'X-EduNexus-Signature': signature,
                    'User-Agent': 'EduNexus-Webhook-Dispatcher/2.0'
                },
                timeout: 5000
            }).catch(err => {
                console.error(`Webhook Dispatch Fail [${webhook.url}]:`, err.message);
            });
        }
    } catch (error) {
        console.error('Webhook system error:', error);
    }
};

// Placeholder for SSO/SAML Strategy
export const ssoStrategyPlaceholder = {
    name: 'SAML 2.0 Foundation',
    status: 'Ready for integration',
    note: 'Use passport-saml or similar with tenant-specific metadata stored in organization_settings.'
};
