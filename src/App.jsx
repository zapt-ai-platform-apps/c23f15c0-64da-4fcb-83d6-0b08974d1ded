import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function App() {
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [loading, setLoading] = createSignal(false);
  const [faucetPayAddress, setFaucetPayAddress] = createSignal('');
  const [message, setMessage] = createSignal('');
  const [claimCooldown, setClaimCooldown] = createSignal(0);
  let cooldownInterval;

  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(() => {
    checkUserSignedIn();
    createEffect(() => {
      const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        if (session?.user) {
          setUser(session.user);
          setCurrentPage('homePage');
        } else {
          setUser(null);
          setCurrentPage('login');
        }
      });
      return () => {
        authListener.unsubscribe();
      };
    });
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const handleClaimFaucet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (!faucetPayAddress()) {
      setMessage('Please enter your FaucetPay address.');
      setLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/claimFaucet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faucetPayAddress: faucetPayAddress() }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
        // Set cooldown (e.g., 60 minutes)
        setClaimCooldown(3600);
        cooldownInterval = setInterval(() => {
          setClaimCooldown(prev => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error claiming faucet reward:', error);
      setMessage('An error occurred while claiming the faucet reward.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
  };

  return (
    <div class="h-full bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
          <div class="flex items-center justify-center h-full">
            <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <h2 class="text-3xl font-bold mb-6 text-center text-purple-600">Sign in with ZAPT</h2>
              <a
                href="https://www.zapt.ai"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline mb-6 block text-center"
              >
                Learn more about ZAPT
              </a>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'facebook', 'apple']}
                magicLink={true}
                showLinks={false}
                authView="magic_link"
              />
            </div>
          </div>
        }
      >
        <div class="max-w-lg mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-purple-600">Crypto Faucet</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>

          <form onSubmit={handleClaimFaucet} class="space-y-4">
            <label class="block">
              <span class="text-gray-700">FaucetPay Address</span>
              <input
                type="text"
                placeholder="Enter your FaucetPay address"
                value={faucetPayAddress()}
                onInput={(e) => setFaucetPayAddress(e.target.value)}
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent box-border"
                required
              />
            </label>
            <button
              type="submit"
              class={`w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                loading() || claimCooldown() > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading() || claimCooldown() > 0}
            >
              {loading() ? 'Processing...' : 'Claim Faucet Reward'}
            </button>
          </form>

          <Show when={claimCooldown() > 0}>
            <p class="mt-4 text-center text-gray-700">
              You can claim again in {formatTime(claimCooldown())}
            </p>
          </Show>

          <Show when={message()}>
            <div class="mt-4 p-4 bg-white rounded-lg shadow-md">
              <p class="text-gray-700">{message()}</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

export default App;