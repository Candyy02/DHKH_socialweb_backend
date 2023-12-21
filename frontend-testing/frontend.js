gapi.load('auth2', () => {
  gapi.auth2.init({
    client_id:
      '1054277477225-533jjlejp9eiro9d181ou4rog5rf7ujm.apps.googleusercontent.com',
  });
});

async function onSignIn(googleUser) {
  const tokenId = googleUser.getAuthResponse().id_token;

  try {
    // Send the token to the backend for verification
    const response = await fetch('http://localhost:3000/users/googleSignIn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenId }),
    });

    const data = await response.json();

    // Use the backend token as needed (e.g., for authentication)
    console.log('Backend Token:', data.token);
  } catch (error) {
    console.error('Error during Google Sign-In:', error.message);
  }
}
