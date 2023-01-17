// works with server and port. used to connect server to client 
const socket = io()
// client receive
// element
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// location.search gives username and room from the submitted form, parse through result and remove ? by ignoring query
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// allows screen to scroll authomatically except when user scrolls up manually
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    // render any submitted message to page
    const html = Mustache.render(messageTemplate, {
        // message only is an object created in messages.js, so pick attribute of obj you want to render
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // messages sghould be updated at the bottom i.e beforeend
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


// client emit
// shows all users in side bar
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    // submit has an e var that can prevent browser from refreshing authomatically 
    e.preventDefault()
    // disables send button after submit is clicked
    $messageFormButton.setAttribute('disabled', 'disabled')

// you can use =document.querySelector('input').value below but if html file has more than 1 input, there will be problem
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        // enable button after message sends and clear field
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        // if errro occurs due to bad words
        if (error) {
            return console.log(error)
        }
// allows users to know when their message sends
        console.log('Message delivered!')
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    // throw error if browser has no access to geolocation
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    // disable location button
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            // enable location button when location sends
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        // if there's error in joining, error message from users.js prints and user is redirected to home page 
        alert(error)
        location.href = '/'
    }
})