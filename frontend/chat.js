const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('studentId');
const counselorId = urlParams.get('counselorId');

const ws = new WebSocket(`ws://localhost:3000/chat?studentId=${studentId}&counselorId=${counselorId}`);
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

ws.onopen = () => {
  console.log("Connected to WebSocket chat");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const msgDiv = document.createElement('div');
  msgDiv.textContent = `${data.sender}: ${data.message}`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  ws.send(JSON.stringify({
    senderId: studentId,
    receiverId: counselorId,
    sender: 'Student',
    message
  }));

  const msgDiv = document.createElement('div');
  msgDiv.textContent = `You: ${message}`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  chatInput.value = '';
}
