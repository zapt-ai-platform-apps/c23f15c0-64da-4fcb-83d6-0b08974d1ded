# New App

## Overview

New App is a cryptocurrency faucet application that allows users to claim small amounts of cryptocurrency from FaucetPay wallets. Users can sign in with ZAPT to access the faucet and claim rewards at specified intervals. The app is designed to be user-friendly, responsive, and secure, ensuring a smooth experience for users wishing to receive cryptocurrency micropayments.

## User Journey

1. **Landing Page**
    - The user navigates to the app and is presented with a welcoming interface.
    - A "Sign in with ZAPT" text is displayed above the authentication component.
    - The user sees a link to the ZAPT marketing site (https://www.zapt.ai) that opens in a new tab.
  
2. **User Authentication**
    - The user signs in using their preferred method (Email, Google, Facebook, or Apple) via the Supabase Auth UI.
    - Upon successful authentication, the user is redirected to the main faucet page.

3. **Main Faucet Page**
    - The user sees their account information and an input field to enter their FaucetPay wallet address.
    - A "Claim Faucet Reward" button is prominently displayed.
    - The user can see a countdown timer indicating when they can next claim a reward if they are on cooldown.

4. **Claiming Rewards**
    - The user enters their FaucetPay wallet address.
    - The user clicks on the "Claim Faucet Reward" button.
    - The app processes the request and communicates with the backend API to execute the faucet claim via FaucetPay.
    - A loading state indicates that the transaction is in progress.
    - Upon successful claim, the user receives a confirmation message displaying the amount received.
    - The claim button becomes disabled until the next eligible claim time.

5. **Additional Features**
    - The user can sign out of the app by clicking the "Sign Out" button.

## External APIs Used

- **FaucetPay API**: Used to process faucet reward claims and interact with FaucetPay wallets.
    - *Note*: Users need to ensure their FaucetPay wallet address is correctly entered to receive rewards.

## Environment Variables

The following environment variables are required for the app to function correctly:

- `FAUCETPAY_API_KEY`: Your FaucetPay API key for authorized requests.
- `VITE_PUBLIC_SENTRY_DSN`: Sentry DSN for error logging on the frontend.
- `VITE_PUBLIC_APP_ENV`: Environment identifier (e.g., development, production).
- `VITE_PUBLIC_APP_ID`: Your ZAPT app ID for initialization in Supabase clients.

Please ensure these variables are set in your deployment environment.
