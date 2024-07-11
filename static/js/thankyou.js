function backtohome() {
    window.location.href = '/';
}

// Wait for the DOM to fully load before manipulating it
document.addEventListener('DOMContentLoaded', function() {
    // Parse the URL to get the query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('number'); // Get the value of 'number' parameter

    // Update the content of the HTML element with orderNumber
    const orderNumberDisplay = document.getElementById('orderNumberDisplay');
    orderNumberDisplay.textContent ="您的訂單編號："+ orderNumber; // Append orderNumber to the existing content
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const userResponse = await fetch('/api/user/auth', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!userResponse.ok) {
            window.location.href = '/';
        }

        // sign out
        setSignInButton("登出系統", async () => {
            localStorage.removeItem('token');
            location.reload();
        });
    } catch (error) {
    }
});

function redirect_booking() {
    const token = localStorage.getItem('token');
    console.log(token);
    if (token) {
        window.location.href = '/booking';
    }
    else{
        open_signinup();
    }
}