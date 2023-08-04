// JavaScript file for the web interface

// Function to handle form submission for making a reservation
function reserve() {
    const roomNumber = document.getElementById('roomNumber').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    // Perform input validation (you can add more validation as needed)
    if (!roomNumber || !firstName || !lastName || !phoneNumber || !startTime || !endTime) {
        alert('Please fill in all the required fields.');
        return;
    }

    // Send the reservation details to the server (you can use Fetch API or other AJAX methods)
    // Example using Fetch API:
    fetch('/reserve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roomNumber,
            firstName,
            lastName,
            phoneNumber,
            startTime,
            endTime,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            // Handle the response from the server (e.g., show success message, update reservation list)
            if (data.success) {
                alert('Reservation successful.');
                // Perform any additional actions as needed
            } else {
                alert('Reservation failed. Please try again later.');
            }
        })
        .catch((error) => {
            console.error('Error making reservation:', error);
            alert('An error occurred. Please try again later.');
        });
}

// Function to handle form submission for canceling a reservation
function cancel(reservationId) {
    // Send the reservation ID to the server to cancel the reservation
    // Example using Fetch API:
    fetch('/cancel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reservationId,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            // Handle the response from the server (e.g., show success message, update reservation list)
            if (data.success) {
                alert('Reservation canceled successfully.');
                // Perform any additional actions as needed
            } else {
                alert('Failed to cancel reservation. Please try again later.');
            }
        })
        .catch((error) => {
            console.error('Error canceling reservation:', error);
            alert('An error occurred. Please try again later.');
        });
}

// Function to load the list of reservations from the server
function loadReservations() {
    // Fetch the list of reservations from the server
    // Example using Fetch API:
    fetch('/reservations')
        .then((response) => response.json())
        .then((data) => {
            // Update the reservation list on the web page
            const reservationList = document.getElementById('reservationList');
            reservationList.innerHTML = '';

            data.reservations.forEach((reservation) => {
                const reservationItem = document.createElement('div');
                reservationItem.classList.add('reservation');

                const startTime = new Date(reservation.start_time).toLocaleString();
                const endTime = new Date(reservation.end_time).toLocaleString();

                reservationItem.innerHTML = `
            <p><strong>Reservation ID:</strong> ${reservation.id}</p>
            <p><strong>Room Number:</strong> ${reservation.room_number}</p>
            <p><strong>Name:</strong> ${reservation.first_name} ${reservation.last_name}</p>
            <p><strong>Phone Number:</strong> ${reservation.phone_number}</p>
            <p><strong>Start Time:</strong> ${startTime}</p>
            <p><strong>End Time:</strong> ${endTime}</p>
            <button onclick="cancel(${reservation.id})">Cancel Reservation</button>
          `;

                reservationList.appendChild(reservationItem);
            });
        })
        .catch((error) => {
            console.error('Error fetching reservations:', error);
            alert('An error occurred while fetching reservations. Please try again later.');
        });
}

// Function to set up event listeners and initialize the web page
function init() {
    // Load the list of reservations when the page loads
    loadReservations();

    // Add event listener for the reservation form submission
    const reserveForm = document.getElementById('reserveForm');
    reserveForm.addEventListener('submit', (event) => {
        event.preventDefault();
        reserve();
    });
}

// Call the init function when the page is ready
document.addEventListener('DOMContentLoaded', init);
