// ============================================================
// RetailMind AI - Authentication
// Email/Password + Google SSO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginSubmitBtn');
  const googleLoginBtn = document.getElementById('googleLoginBtn');


  // ==========================================================
  // EMAIL + PASSWORD LOGIN
  // ==========================================================

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }


  async function handleLogin(event) {

    event.preventDefault();

    const email =
      document.getElementById('loginEmail').value.trim();

    const password =
      document.getElementById('loginPass').value;

    if (!email || !password) {

      showMessage(
        'Please enter your email and password.',
        'error'
      );

      return;
    }

    setLoading(true);

    try {

      console.log('Attempting email login...');

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      console.log(
        'Email login successful:',
        data.user
      );

      window.location.href = 'dashboard.html';

    } catch (error) {

      console.error(
        'Email login error:',
        error
      );

      let message =
        'Unable to sign in. Please try again.';

      if (
        error.message &&
        error.message
          .toLowerCase()
          .includes('invalid login credentials')
      ) {
        message = 'Invalid email or password.';
      }

      if (
        error.message &&
        error.message
          .toLowerCase()
          .includes('email not confirmed')
      ) {
        message =
          'Please confirm your email before signing in.';
      }

      showMessage(message, 'error');

      setLoading(false);
    }
  }


  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
      'click',
      handleGoogleLogin
    );

  }


  async function handleGoogleLogin() {

    googleLoginBtn.disabled = true;

    googleLoginBtn.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Connecting to Google...
    `;

    try {

      console.log('Starting Google OAuth...');

      const { error } =
        await supabaseClient.auth.signInWithOAuth({

          provider: 'google',

          options: {

            // Return to login page after Google authentication.
            // The code below will then detect the session
            // and redirect to the dashboard.

            redirectTo:
              window.location.origin + '/login.html'

          }

        });

      if (error) {
        throw error;
      }

    } catch (error) {

      console.error(
        'Google OAuth error:',
        error
      );

      showMessage(
        error.message ||
        'Google sign-in failed.',
        'error'
      );

      googleLoginBtn.disabled = false;

      googleLoginBtn.innerHTML = `
        <i class="fa-brands fa-google"></i>
        Google SSO
      `;

    }

  }


  // ==========================================================
  // GOOGLE OAUTH CALLBACK
  // ==========================================================

  // IMPORTANT:
  // Capture this BEFORE Supabase removes the access_token
  // from the URL.

  const hasOAuthCallback =
    window.location.hash.includes('access_token') ||
    window.location.hash.includes('refresh_token') ||
    window.location.search.includes('code=');


  console.log(
    'OAuth callback detected:',
    hasOAuthCallback
  );


  // ==========================================================
  // CHECK SESSION
  // ==========================================================

  async function checkGoogleSession() {

    try {

      console.log(
        'Checking Supabase session...'
      );

      const {
        data: { session },
        error
      } =
        await supabaseClient.auth.getSession();

      if (error) {

        console.error(
          'Session error:',
          error
        );

        return;
      }


      console.log(
        'Current session:',
        session
      );


      if (session && session.user) {

        console.log(
          'Authenticated user:',
          session.user.email
        );


        // Only redirect when this page was reached
        // through Google OAuth.

        if (hasOAuthCallback) {

          console.log(
            'Google authentication successful!'
          );

          showMessage(
            'Google login successful. Redirecting...',
            'success'
          );


          setTimeout(() => {

            window.location.href =
              'dashboard.html';

          }, 300);

        }

      }

    } catch (error) {

      console.error(
        'Session check failed:',
        error
      );

    }

  }


  // Give Supabase a moment to process the OAuth
  // access token from the URL.

  if (hasOAuthCallback) {

    setTimeout(() => {

      checkGoogleSession();

    }, 500);

  }


  // ==========================================================
  // AUTH STATE CHANGE
  // ==========================================================

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        'Supabase auth event:',
        event
      );


      if (
        event === 'SIGNED_IN' &&
        session &&
        session.user &&
        hasOAuthCallback
      ) {

        console.log(
          'Google user signed in:',
          session.user.email
        );


        setTimeout(() => {

          window.location.href =
            'dashboard.html';

        }, 300);

      }

    }
  );


  // ==========================================================
  // LOADING STATE
  // ==========================================================

  function setLoading(isLoading) {

    if (!loginButton) {
      return;
    }

    loginButton.disabled = isLoading;

    if (isLoading) {

      loginButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Signing In...</span>
      `;

    } else {

      loginButton.innerHTML = `
        <i class="fa-solid fa-arrow-right-to-bracket"></i>
        <span>Sign In to Dashboard</span>
      `;

    }

  }


  // ==========================================================
  // MESSAGE
  // ==========================================================

  function showMessage(
    message,
    type = 'info'
  ) {

    if (typeof showToast === 'function') {

      let icon = 'fa-circle-info';

      if (type === 'success') {
        icon = 'fa-circle-check';
      }

      if (type === 'error') {
        icon = 'fa-circle-exclamation';
      }

      showToast(
        message,
        type,
        icon
      );

      return;
    }

    alert(message);

  }

});