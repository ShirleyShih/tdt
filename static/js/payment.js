TPDirect.setupSDK(152055, 'app_r3SmMxemCPVnP0itXpvbgcEvhyi4nJvpOcaK0kr74OAj4vAXF6zJ5AHtURgG', 'sandbox')
TPDirect.card.setup({
    fields: {
        number: {
            element: '.form-control.card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            element: document.getElementById('tappay-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: $('.form-control.ccv')[0],
            placeholder: '後三碼'
        }
    },
    styles: {
        'input': {
            'color': 'gray'
        },
        'input.ccv': {
            // 'font-size': '16px'
        },
        ':focus': {
            'color': 'black'
        },
        '.valid': {
            'color': 'green'
        },
        '.invalid': {
            'color': 'red'
        },
        '@media screen and (max-width: 400px)': {
            'input': {
                'color': 'orange'
            }
        }
    },
    // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6, 
        endIndex: 11
    }
})
// listen for TapPay Field
TPDirect.card.onUpdate(function (update) {
    /* Disable / enable submit button depend on update.canGetPrime  */
    /* ============================================================ */

    // update.canGetPrime === true
    //     --> you can call TPDirect.card.getPrime()
    // const submitButton = document.querySelector('button[type="submit"]')
    if (update.canGetPrime) {
        // submitButton.removeAttribute('disabled')
        $('button[type="submit"]').removeAttr('disabled')
    } else {
        // submitButton.setAttribute('disabled', true)
        $('button[type="submit"]').attr('disabled', true)
    }


    /* Change card type display when card type change */
    /* ============================================== */

    // cardTypes = ['visa', 'mastercard', ...]
    // var newType = update.cardType === 'unknown' ? '' : update.cardType
    // $('#cardtype').text(newType)



    /* Change form-group style when tappay field status change */
    /* ======================================================= */

    // number 欄位是錯誤的
    if (update.status.number === 2) {
        setNumberFormGroupToError('.card-number-group')
    } else if (update.status.number === 0) {
        setNumberFormGroupToSuccess('.card-number-group')
    } else {
        setNumberFormGroupToNormal('.card-number-group')
    }

    if (update.status.expiry === 2) {
        setNumberFormGroupToError('.expiration-date-group')
    } else if (update.status.expiry === 0) {
        setNumberFormGroupToSuccess('.expiration-date-group')
    } else {
        setNumberFormGroupToNormal('.expiration-date-group')
    }

    if (update.status.ccv === 2) {
        setNumberFormGroupToError('.ccv-group')
    } else if (update.status.ccv === 0) {
        setNumberFormGroupToSuccess('.ccv-group')
    } else {
        setNumberFormGroupToNormal('.ccv-group')
    }
})

$('form').on('submit', function (event) {
    event.preventDefault()
    
    // fix keyboard issue in iOS device
    forceBlurIos()
    
    const tappayStatus = TPDirect.card.getTappayFieldsStatus()
    console.log(tappayStatus)

    // Check TPDirect.card.getTappayFieldsStatus().canGetPrime before TPDirect.card.getPrime
    if (tappayStatus.canGetPrime === false) {
        alert('can not get prime')
        return
    }

    // Get prime
    TPDirect.card.getPrime(async function (result) {
        if (result.status !== 0) {
            alert('get prime error ' + result.msg)
            return
        }
        // alert('get prime 成功，prime: ' + result.card.prime)
        console.log(result);
        var command = `
        Use following command to send to server \n\n
        curl -X POST https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime \\
        -H 'content-type: application/json' \\
        -H 'x-api-key: partner_lZsurJ44kGoWnH1GG9uNci0g6gm4W0nWvY48BFI6nUFntPLiPxkruktD' \\
        -d '{
            "partner_key": "partner_lZsurJ44kGoWnH1GG9uNci0g6gm4W0nWvY48BFI6nUFntPLiPxkruktD",
            "prime": "${result.card.prime}",
            "amount": "1",
            "merchant_id": "GlobalTesting_CTBC",
            "details": "Some item",
            "cardholder": {
                "phone_number": "+886923456789",
                "name": "王小明",
                "email": "LittleMing@Wang.com",
                "zip_code": "100",
                "address": "台北市天龍區芝麻街1號1樓",
                "national_id": "A123456789"
            }
        }'`.replace(/                /g, '')
        // document.querySelector('#curl').innerHTML = command

        // send request to /api/order POST
        // token
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        // get booking attraction info
        const bookingResponse = await fetch(`/api/booking`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        if (!bookingResponse.ok) {
            throw new Error('Failed to fetch booking');
        }

        const bookingData = await bookingResponse.json();
        const booking = bookingData.data;

        const prime = result.card.prime;
        const orderData = {
            prime: prime,
            order: {
                price: booking.price,
                trip: {
                    attraction: {
                        id: booking.attraction.id,
                        name: booking.attraction.name,
                        address: booking.attraction.address,
                        image: booking.attraction.image
                    },
                    date: booking.date,
                    time: booking.time
                },
                contact: {
                    name: document.querySelector('#contact-name').value,
                    email: document.querySelector('#contact-email').value,
                    phone: document.querySelector('#contact-phone').value
                }
            }
        };

        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(orderData)
            });
            console.log(response);
            if (!response.ok) {
                throw new Error('Failed to pay');
            }

            const responseData = await response.json();
            const orderNumber = responseData.data.number;
            console.log(orderNumber);
            window.location.href = `/thankyou?number=${orderNumber}`;
        } catch (error) {
        }
    })
})

function setNumberFormGroupToError(selector) {
    $(selector).addClass('has-error')
    $(selector).removeClass('has-success')
}

function setNumberFormGroupToSuccess(selector) {
    $(selector).removeClass('has-error')
    $(selector).addClass('has-success')
}

function setNumberFormGroupToNormal(selector) {
    $(selector).removeClass('has-error')
    $(selector).removeClass('has-success')
}

function forceBlurIos() {
    if (!isIos()) {
        return
    }
    var input = document.createElement('input')
    input.setAttribute('type', 'text')
    // Insert to active element to ensure scroll lands somewhere relevant
    document.activeElement.prepend(input)
    input.focus()
    input.parentNode.removeChild(input)
}

function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}