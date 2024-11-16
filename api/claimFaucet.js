import * as Sentry from "@sentry/node";
import { authenticateUser } from "./_apiUtils.js";
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

Sentry.init({
  dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
  environment: process.env.VITE_PUBLIC_APP_ENV,
  initialScope: {
    tags: {
      type: 'backend',
      projectId: process.env.PROJECT_ID
    }
  }
});

const claimCooldowns = new Map(); // In-memory cooldown storage

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const user = await authenticateUser(req);

    const { faucetPayAddress } = req.body;

    if (!faucetPayAddress) {
      return res.status(400).json({ error: 'FaucetPay address is required' });
    }

    // Rate limiting per user to prevent abuse (e.g., 1 claim per hour)
    const now = Date.now();
    const cooldownTime = 3600000; // 1 hour in milliseconds
    const lastClaimTime = claimCooldowns.get(user.id) || 0;

    if (now - lastClaimTime < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - (now - lastClaimTime)) / 1000);
      return res.status(429).json({ error: `Please wait ${remainingTime} seconds before claiming again` });
    }

    const faucetPayApiKey = process.env.FAUCETPAY_API_KEY;

    if (!faucetPayApiKey) {
      return res.status(500).json({ error: 'FaucetPay API key not configured' });
    }

    // Prepare data for FaucetPay API request
    const fpResponse = await fetch('https://faucetpay.io/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: faucetPayApiKey,
        amount: '0.000001', // Amount to send
        to: faucetPayAddress,
        currency: 'BTC' // Cryptocurrency to send
      })
    });

    const fpData = await fpResponse.json();

    if (fpData.status === 200) {
      claimCooldowns.set(user.id, now); // Update last claim time
      res.status(200).json({ message: 'Faucet reward claimed successfully!', data: fpData });
    } else {
      res.status(400).json({ error: fpData.message || 'Failed to claim faucet reward', details: fpData });
    }

  } catch (error) {
    console.error('Error claiming faucet reward:', error);
    Sentry.captureException(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}