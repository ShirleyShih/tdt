document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage
        if (!token) {
            window.location.href = '/';
        }

        const userResponse = await fetch('/api/user/auth', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        // if (!userResponse.ok) {
        //     throw new Error('Failed to fetch user');
        // }

        const currentUser = await userResponse.json();

        const bookingResponse = await fetch(`/api/booking`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        // if (!bookingResponse.ok) {
        //     throw new Error('Failed to fetch booking');
        // }

        const bookingData = await bookingResponse.json();
        const booking = bookingData.data;

        document.querySelector('.booking-headline').textContent = "您好，" + currentUser.data.name + "，待預訂的行程如下：";

        if (booking) {
            document.querySelector('.booking-attraction-img').src = booking.attraction.image;
            document.querySelector('.booking-attraction-name').textContent = "台北一日遊：" + booking.attraction.name;
            document.querySelector('.booking-attraction-date').textContent = "日期："+booking.date;
            document.querySelector('.booking-attraction-time').textContent = "時間："+(booking.time === "morning" ? "早上 9 點到下午 2 點" : "下午 2 點到晚上 9 點");
            document.querySelector('.booking-attraction-fee').textContent = "費用：新台幣 "+booking.price+" 元";
            document.querySelector('.booking-attraction-address').textContent = "地點："+booking.attraction.address;
            document.querySelector('#bill').textContent = "總價新台幣 "+booking.price+" 元";
        } else {
            emptycart();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function emptycart(){
    document.querySelector(".booking-headline-none").style.display="block";
    document.querySelector(".booking-attraction-frame").style.display="none";
    document.querySelector(".separator-content").style.display="none";
    document.querySelector(".cart-form").style.display="none";
}


document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('.booking-attraction-delete').addEventListener('click', deletebooking);
});

async function deletebooking() {
    const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage
    if (!token) {
        window.location.href = '/';
    }

    const deleteResponse = await fetch(`/api/booking`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    });

    if (deleteResponse.ok) {
        emptycart();
    }
}