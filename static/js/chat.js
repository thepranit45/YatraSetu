document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const micBtn = document.getElementById('micBtn');

  function appendMessage(text, from='bot'){
    const div = document.createElement('div');
    div.className = from === 'user' ? 'text-end mb-2' : 'text-start mb-2';
    div.innerHTML = `<div class="d-inline-block p-2 rounded" style="max-width:80%; background:${from==='user'? '#0d6efd':'#e9ecef'}; color:${from==='user'? '#fff':'#000'}">${text}</div>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessage(text){
    if(!text) return;
    appendMessage(text, 'user');
    chatInput.value = '';
    try{
      const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:text})});
      const data = await res.json();
      const reply = data.reply || 'Sorry, I did not get that.';
      appendMessage(reply, 'bot');
      // speak
      if(window.speechSynthesis){
        const utter = new SpeechSynthesisUtterance(reply);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      }
    }catch(e){
      appendMessage('Error contacting assistant', 'bot');
    }
  }

  sendBtn.addEventListener('click', () => sendMessage(chatInput.value.trim()));
  chatInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ sendMessage(chatInput.value.trim()); } });

  // Speech-to-text (Web Speech API)
  let recognition = null;
  if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (ev) => {
      const text = Array.from(ev.results).map(r=>r[0].transcript).join('');
      chatInput.value = text;
      sendMessage(text);
    };
    recognition.onerror = (e)=>{ console.error('Speech error', e); };
  } else {
    micBtn.style.display = 'none';
  }

  micBtn.addEventListener('click', ()=>{
    if(!recognition) return;
    try{ recognition.start(); } catch(e){ console.error(e); }
  });
});
