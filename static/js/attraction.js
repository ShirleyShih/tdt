document.addEventListener('DOMContentLoaded', () => {
    const id = window.location.pathname.split('/').pop(); // Extract ID from URL

    // Function to fetch attractions based on ID
    function fetchInfrosByID() {
        fetch(`/api/attractions/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const infros = data.data;
            if (infros) {
                const profilename = document.querySelector('.profile-name');
                profilename.textContent = infros["name"];

                const profiletext = document.querySelector('.profile-text');
                profiletext.textContent = infros["category"]+" at "+infros["mrt"];

                const descr = document.getElementById('infros-descr');
                descr.textContent = infros["description"];

                const address = document.getElementById('infros-address');
                address.textContent = infros["address"];

                const transport = document.getElementById('infros-transport');
                transport.textContent = infros["transport"];
            } else {
                console.error("No data found");
            }

            renderSlideshow(infros["images"]);
        });
    }
    fetchInfrosByID();


    ////////// select time
    const morningRadio = document.getElementById('morning');
    const afternoonRadio = document.getElementById('afternoon');
    const feeSpan = document.getElementById('fee');

    function updateFee() {
        if (morningRadio.checked) {
            feeSpan.textContent = '2000';
        } else if (afternoonRadio.checked) {
            feeSpan.textContent = '2500';
        }
    }

    updateFee();
    document.getElementById('morning').addEventListener('change', updateFee);
    document.getElementById('afternoon').addEventListener('change', updateFee);
});

//////////// Function to render slideshow for an attraction
function renderSlideshow(images) {
    const pictureall = document.querySelector('.picture-all');
    const circle = document.querySelector('.button-circle');

    // Clear previous content
    pictureall.innerHTML = '';
    circle.innerHTML = '';

    // Render slides
    images.forEach((imageUrl, index) => {
        const newslide = document.createElement('div');
        newslide.className = 'picture-img';
        newslide.style.backgroundImage = `url(${imageUrl})`;
        pictureall.appendChild(newslide);

        // Create corresponding dot for each image
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.addEventListener('click', () => { currentSlide(index + 1); });
        circle.appendChild(dot);
    });

    // Show the first slide and mark the corresponding dot as active
    showSlide(1);
}

let slideIndex = 1;

// Function to show a specific slide
function showSlide(index) {
    const slides = document.querySelectorAll('.picture-img');
    const dots = document.querySelectorAll('.dot');

    if (index > slides.length) {
        slideIndex = 1;
    }

    if (index < 1) {
        slideIndex = slides.length;
    }

    // Hide all slides and deactivate all dots
    slides.forEach(slide => slide.style.display = 'none');
    dots.forEach(dot => dot.classList.remove('active'));

    // Show the current slide and activate the corresponding dot
    slides[slideIndex - 1].style.display = 'block';
    dots[slideIndex - 1].classList.add('active');
}

// Function to navigate to the previous or next slide
function changeSlide(n) {
    showSlide(slideIndex += n);
}

// Function to navigate directly to a specific slide
function currentSlide(n) {
    showSlide(slideIndex = n);
}


document.addEventListener('DOMContentLoaded', async () => {
    // await checkSignInStatus(); from user.js
    document.querySelector('#addcart-form').addEventListener('submit', addcartFormSubmit);
});

async function addcartFormSubmit(event){
    event.preventDefault(); // Prevent default form submission

    const attractionid = window.location.pathname.split('/').pop(); // Extract ID from URL
    const dateInput = document.querySelector('#date');
    const feeInput = document.querySelector('#fee');
    const timeInput = document.querySelector('input[name="time"]:checked');
    console.log(parseInt(attractionid));
    console.log(feeInput.textContent);
    console.log(timeInput.value);

    const token = localStorage.getItem('token');
    if(token){
        const response = await fetch('/api/booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token // Add the Authorization header
            },
            body: JSON.stringify({
                attractionId: parseInt(attractionid),
                date: dateInput.value,
                time: timeInput.value,
                price: parseInt(feeInput.textContent)
            })
        });

        const data = await response.json();
        if(data.ok){
            window.location.href = '/booking';
        }else {
            console.log(data.message);
        }
    }else{
        open_signinup();
    }
}