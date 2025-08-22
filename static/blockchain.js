// simple client-side voting and chat mockups
const proposals = [];
const proposalForm = document.getElementById('proposal-form');
const proposalList = document.getElementById('proposal-list');
proposalForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = document.getElementById('proposal-text').value;
  proposals.push({ text, votes: 0 });
  renderProposals();
  proposalForm.reset();
});
function renderProposals() {
  proposalList.innerHTML = '';
  proposals.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = `${p.text} (votes: ${p.votes})`;
    const up = document.createElement('button');
    up.textContent = '+';
    up.onclick = () => { p.votes++; renderProposals(); };
    const down = document.createElement('button');
    down.textContent = '-';
    down.onclick = () => { p.votes--; renderProposals(); };
    li.appendChild(up); li.appendChild(down);
    proposalList.appendChild(li);
  });
}

// fake login to reveal chat
const loginForm = document.getElementById('login-form');
const chatBox = document.getElementById('chat');
const blog = document.getElementById('blog');
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  blog.classList.add('hidden');
  chatBox.classList.remove('hidden');
});

const messages = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
sendBtn.onclick = () => {
  const msg = chatInput.value;
  if (!msg) return;
  const li = document.createElement('li');
  li.textContent = msg; // placeholder; encryption would go here
  messages.appendChild(li);
  chatInput.value = '';
};
