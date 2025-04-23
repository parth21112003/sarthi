const socket = io();

let currentUser = sessionStorage.getItem('username');
let selectedUser = null;

if (!currentUser) {
  currentUser = prompt('Enter your username:');
  sessionStorage.setItem('username', currentUser);
}

socket.emit('login', currentUser);

const usersList = document.getElementById('users');
const chatHeader = document.getElementById('chat-header');
const chatHistory = document.getElementById('chat-history');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

socket.on('user list', (users) => {
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user;
    li.addEventListener('click', () => {
      selectedUser = user;
      chatHeader.textContent = `Chat with ${user}`;
      chatHistory.innerHTML = '';
      socket.emit('get chat history', { from: currentUser, to: selectedUser });
    });
    usersList.appendChild(li);
  });
});

socket.on('online users', (onlineUsers) => {
  const items = usersList.getElementsByTagName('li');
  for (let item of items) {
    if (onlineUsers.includes(item.textContent)) {
      item.classList.add('online');
    } else {
      item.classList.remove('online');
    }
  }
});

socket.on('chat history', (messages) => {
  chatHistory.innerHTML = '';
  messages.forEach(({ sender, message }) => {
    const div = document.createElement('div');
    div.classList.add('message');
    if (sender === currentUser) {
      div.classList.add('sent');
    }
    div.textContent = `${sender}: ${message}`;
    chatHistory.appendChild(div);
  });
  chatHistory.scrollTop = chatHistory.scrollHeight;
});

socket.on('private message', ({ from, message }) => {
  if (from === selectedUser || from === currentUser) {
    const div = document.createElement('div');
    div.classList.add('message');
    if (from === currentUser) {
      div.classList.add('sent');
    }
    div.textContent = `${from}: ${message}`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
});

sendBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message && selectedUser) {
    socket.emit('private message', { to: selectedUser, message });
    messageInput.value = '';
  }
});
