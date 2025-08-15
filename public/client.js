// --- WebSocket Chat ---
const ws = new WebSocket(`ws://${location.host}`);
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');

ws.onmessage = (event) => {
  try {
    const msgData = JSON.parse(event.data);
    if (msgData.type === 'chat') {
      const msg = document.createElement('div');
      msg.textContent = msgData.message;
      chatBox.appendChild(msg);
      chatBox.scrollTop = chatBox.scrollHeight;
    } else if (msgData.type === 'offer' || msgData.type === 'answer' || msgData.type === 'candidate') {
      handleVCSignal(msgData);
    }
  } catch(e) {
    // fallback for plain chat messages
    const msg = document.createElement('div');
    msg.textContent = event.data;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
};

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    ws.send(JSON.stringify({ type: 'chat', message: chatInput.value }));
    chatInput.value = '';
  }
});

// --- Voice Chat (WebRTC) ---
let localStream;
let pc;
const startVCBtn = document.getElementById('start-vc');
const remoteAudio = document.getElementById('remote-audio');

startVCBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc = new RTCPeerConnection();
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => { remoteAudio.srcObject = event.streams[0]; };

  pc.onicecandidate = (event) => {
    if(event.candidate) ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify(offer));
};

function handleVCSignal(msg) {
  if (!pc) return;
  if (msg.type === 'offer') {
    pc.setRemoteDescription(new RTCSessionDescription(msg)).then(async () => {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify(answer));
    });
  } else if (msg.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(msg));
  } else if (msg.type === 'candidate') {
    pc.addIceCandidate(msg.candidate);
  }
}

// --- Simple Game ---
const gameContainer = document.getElementById('game-container');
document.getElementById('game1-btn').onclick = () => {
  gameContainer.innerHTML = `<canvas id="game1" width="300" height="200" style="background:#000; display:block; margin:auto;"></canvas>`;
  const canvas = document.getElementById('game1');
  const ctx = canvas.getContext('2d');

  let x = 50, y = 50, dx = 2, dy = 2;

  function loop() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    ctx.fillStyle = "#0f0";
    ctx.fillRect(x, y, 20, 20);

    x += dx;
    y += dy;

    if (x <= 0 || x >= canvas.width - 20) dx *= -1;
    if (y <= 0 || y >= canvas.height - 20) dy *= -1;

    requestAnimationFrame(loop);
  }

  loop();
};
