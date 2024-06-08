// Define scrollleft function
function scrollleft() {
    const mrtList = document.querySelector('.middle-container');
    const scrollAmount = 200;
    mrtList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
}

// Define scrollright function
function scrollright() {
    const mrtList = document.querySelector('.middle-container');
    const scrollAmount = 200;
    mrtList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}


document.addEventListener('DOMContentLoaded', () => {
    const atframe = document.querySelector('.attractions-frame');
    let nextPage=0;
    let currentKeyword = ''; // Store the current search keyword
    let fetchedData = false; // Flag to indicate if data is being fetched

    //////////////////// attractions
    // Keyword search functionality
    const searchIcon = document.getElementById('searchIcon');
    searchIcon.addEventListener('click', () => {
        const searchInput = document.getElementById('searchkwbtn');
        currentKeyword = searchInput.value.trim();
        nextPage = 0; // Reset to the first page
        fetchAttractionData(currentKeyword, nextPage);
    });

    // Function to fetch attractions based on MRT Station name
    function fetchAttractionsByMRTName(mrtName,page) {
        if (mrtName != null) {
            fetch(`/api/attractions?page=${page}&keyword=${mrtName}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                atframe.innerHTML = ''; // Clear existing attractions
                renderAttractionData(data.data);
                nextPage = data.nextPage;
            });
        }
    }

    // homepage
    fetch(`/api/attractions`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (currentKeyword === ''){
            renderAttractionData(data.data);
            nextPage = data.nextPage;
        }
    });

    // scroll to get more pages
    function fetchAttractionData(keyword = '', page=0) {
        if (fetchedData) return; // Prevent fetching if data is already being fetched
        fetchedData = true; // Set fetching flag to true

        let url = `/api/attractions?page=${page}`;
        if (keyword) {
            url += `&keyword=${keyword}`;
        }

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (page === 0) {
                atframe.innerHTML = ''; // Clear existing data if it's a new search
            }
            renderAttractionData(data.data);
            nextPage = data.nextPage;
            fetchedData = false;
        });
    }

    // Event listener for scroll event
    window.addEventListener('scroll', () => {
        // Check if user has scrolled to the bottom of the .attractions-frame element
        const attractionsFrame = document.querySelector('.attractions-frame');
        if (attractionsFrame.getBoundingClientRect().bottom <= window.innerHeight) {
            // Fetch more attraction data if nextPage is not null
            if (nextPage !== null) {
                fetchAttractionData(currentKeyword, nextPage);
            }
        }
    });

    // Function to render attraction data
    function renderAttractionData(attractions) {
        attractions.forEach(attraction => {
            // console.log(attraction["name"]);
            const newatbox = document.createElement('div');
            newatbox.className=('attractions-box');

            const newatmain = document.createElement('div');
            newatmain.className=('attractions-main');

            const newatimg=document.createElement('img');
            newatimg.className=('attractions-img');
            newatimg.src=attraction["images"][0];

            const newattitle = document.createElement('div');
            newattitle.className=('attractions-title');
            newattitle.textContent = attraction["name"];

            const newatbottom = document.createElement('div');
            newatbottom.className=('attractions-bottom');

            const newatbottomtext1 = document.createElement('div');
            newatbottomtext1.className=('attractions-bottom-text');
            newatbottomtext1.textContent = attraction["mrt"];

            const newatbottomtext2 = document.createElement('div');
            newatbottomtext2.className=('attractions-bottom-text');
            newatbottomtext2.textContent = attraction["category"];

            atframe.appendChild(newatbox);
                newatbox.appendChild(newatmain);
                    newatmain.appendChild(newatimg);
                    newatmain.appendChild(newattitle);
                newatbox.appendChild(newatbottom);
                    newatbottom.appendChild(newatbottomtext1);
                    newatbottom.appendChild(newatbottomtext2);
        });
    }

    ///////////////////////MRT list bar
    const mrtList = document.querySelector('.middle-container');

    // Fetch MRT station names from the API
    fetch(`/api/mrts`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        data.data.forEach(station => {
            // console.log(station);
            const newlistitem = document.createElement('div');
            newlistitem.className=('listitem');

            const newlistitemtext = document.createElement('div');
            newlistitemtext.className=('listitem-text');
            newlistitemtext.textContent = station;

            mrtList.appendChild(newlistitem);
            newlistitem.appendChild(newlistitemtext);
        });
    });

    const scrollLeftButton = document.querySelector('.arrow-left');
    const scrollRightButton = document.querySelector('.arrow-right');

    // Add event listeners to the buttons
    scrollLeftButton.addEventListener('click', scrollleft);
    scrollRightButton.addEventListener('click', scrollright);



    // Event listener for clicking on MRT Station names
    mrtList.addEventListener('click', (event) => {
        const clickedMRTName = event.target.textContent;
        document.getElementById('searchkwbtn').value = clickedMRTName; // Fill the text input with clicked MRT Station name
        currentKeyword = clickedMRTName;
        nextPage = 0; // Reset page to 0
        fetchAttractionsByMRTName(clickedMRTName,nextPage);
    });
});






