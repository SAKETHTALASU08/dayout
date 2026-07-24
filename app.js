// Dayout - Personal Invitation State Machine & Interactions (v2)
document.addEventListener('DOMContentLoaded', () => {

  // --- Element References ---
  const panelOpening = document.getElementById('panel-opening');
  const panelAskout = document.getElementById('panel-askout');
  const panelReschedule = document.getElementById('panel-reschedule');
  const panelConfirmed = document.getElementById('panel-confirmed');

  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const btnLetsDoIt = document.getElementById('btn-lets-do-it');
  const btnMaybeNextTime = document.getElementById('btn-maybe-next-time');
  const btnConfirmSlot = document.getElementById('btn-confirm-slot');
  const btnBackToStart = document.getElementById('btn-back-to-start');
  const btnReset = document.getElementById('btn-reset');
  const btnAddCalendar = document.getElementById('btn-add-calendar');
  const btnWhatsApp = document.getElementById('btn-whatsapp');

  const slotDateInput = document.getElementById('slot-date');
  const slotTimeInput = document.getElementById('slot-time');
  const quickChips = document.querySelectorAll('.chip');

  const confirmedSlotDisplay = document.getElementById('confirmed-slot-display');
  const confirmedTitle = document.getElementById('confirmed-heading');
  const confirmedSubtitle = document.getElementById('confirmed-subtitle');

  const toggleSoundBtn = document.getElementById('toggle-sound');
  const soundIcon = document.getElementById('sound-icon');
  const soundLabel = document.getElementById('sound-label');
  let soundEnabled = true;

  // --- Date Initialization (Default to Tomorrow) ---
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  // Format YYYY-MM-DD for date input
  const tomorrowString = tomorrow.toISOString().split('T')[0];
  slotDateInput.value = tomorrowString;
  slotDateInput.min = now.toISOString().split('T')[0]; // Can't pick past dates

  // --- Audio Synthesis for Micro-Interactions (Web Audio API) ---
  let audioCtx = null;

  function playPopSound(freq = 520, type = 'sine', duration = 0.08) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playFanfareSound() {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => playPopSound(freq, 'triangle', 0.18), idx * 100);
    });
  }

  // --- State Transition Logic (~280ms smooth fade/slide) ---
  let currentPanel = panelOpening;

  function switchPanel(targetPanel) {
    if (currentPanel === targetPanel) return;

    playPopSound(440, 'sine', 0.06);

    // Fade out current panel
    currentPanel.classList.add('leaving');
    
    setTimeout(() => {
      currentPanel.classList.remove('active', 'leaving');
      
      // Fade in target panel
      targetPanel.classList.add('active');
      currentPanel = targetPanel;
    }, 250);
  }

  // --- Quick Preset Chips Handling ---
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      quickChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const timeVal = chip.getAttribute('data-time');
      if (timeVal) {
        slotTimeInput.value = timeVal;
        playPopSound(600, 'sine', 0.05);
      }
    });
  });

  // Sync manual time input with chip highlight
  slotTimeInput.addEventListener('change', () => {
    quickChips.forEach(c => {
      if (c.getAttribute('data-time') === slotTimeInput.value) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
  });

  // --- Date Formatting Helper ---
  function formatNiceDateTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    
    const d = new Date(year, month - 1, day, hours, minutes);
    
    const optionsDate = { weekday: 'long', month: 'short', day: 'numeric' };
    const formattedDate = d.toLocaleDateString('en-US', optionsDate);
    
    let hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    hourNum = hourNum % 12 || 12;
    const formattedTime = `${hourNum}:${minutes} ${ampm}`;

    return { formattedDate, formattedTime, jsDate: d };
  }

  // --- External Link Builders ---
  function updateActionLinks(jsDate, confirmTextForWhatsApp) {
    // 1. Google Calendar Link
    const startTime = jsDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(jsDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
    const endTime = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Hangout with Friend ☕")}&dates=${startTime}/${endTime}&details=${encodeURIComponent(confirmTextForWhatsApp)}`;
    btnAddCalendar.setAttribute('href', googleCalUrl);

    // 2. WhatsApp Click-to-Chat Link (https://wa.me/918500451385?text=...)
    const waPhone = "918500451385";
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(confirmTextForWhatsApp)}`;
    btnWhatsApp.setAttribute('href', waUrl);
  }

  // --- Button Action Handlers ---

  // 1. OPENING: YES
  btnYes.addEventListener('click', () => {
    switchPanel(panelAskout);
  });

  // 2. OPENING: NO
  btnNo.addEventListener('click', () => {
    switchPanel(panelReschedule);
  });

  // 3. ASK-OUT: LET'S DO IT
  btnLetsDoIt.addEventListener('click', () => {
    const defaultTime = "18:30";
    const { jsDate } = formatNiceDateTime(tomorrowString, defaultTime);
    
    confirmedTitle.textContent = "Yay! Let's lock it in 🎉";
    confirmedSubtitle.textContent = "I knew I could count on you!";
    confirmedSlotDisplay.textContent = "Locked in for tomorrow 🤝";
    
    const waMessage = "Hey! Just confirming — let's go out tomorrow 🎉";
    updateActionLinks(jsDate, waMessage);

    switchPanel(panelConfirmed);
    
    setTimeout(() => {
      triggerConfetti();
      playFanfareSound();
    }, 250);
  });

  // 4. ASK-OUT: MAYBE NEXT TIME
  btnMaybeNextTime.addEventListener('click', () => {
    switchPanel(panelReschedule);
  });

  // 5. RESCHEDULE: CONFIRM SLOT
  document.getElementById('reschedule-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const chosenDate = slotDateInput.value;
    const chosenTime = slotTimeInput.value;

    if (!chosenDate || !chosenTime) return;

    const { formattedDate, formattedTime, jsDate } = formatNiceDateTime(chosenDate, chosenTime);
    
    confirmedTitle.textContent = "Yay! Let's lock it in 🎉";
    confirmedSubtitle.textContent = "Marked on the calendar!";
    confirmedSlotDisplay.textContent = `Locked in for ${formattedDate} at ${formattedTime} 🤝`;

    const waMessage = `Hey! Just confirming — let's hang out on ${formattedDate} at ${formattedTime} 🎉`;
    updateActionLinks(jsDate, waMessage);

    switchPanel(panelConfirmed);

    setTimeout(() => {
      triggerConfetti();
      playFanfareSound();
    }, 250);
  });

  // 6. RESCHEDULE: BACK
  btnBackToStart.addEventListener('click', () => {
    switchPanel(panelOpening);
  });

  // 7. CONFIRMED: RESET / START OVER
  btnReset.addEventListener('click', () => {
    switchPanel(panelOpening);
  });

  // 8. SOUND TOGGLE (Obvious visual icon + text + class toggle)
  toggleSoundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundIcon.textContent = '🔊';
      soundLabel.textContent = 'Sound On';
      toggleSoundBtn.classList.remove('sound-off');
      playPopSound(800, 'sine', 0.08);
    } else {
      soundIcon.textContent = '🔇';
      soundLabel.textContent = 'Sound Off';
      toggleSoundBtn.classList.add('sound-off');
    }
  });

  // --- Lightweight Confetti Particle Generator ---
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationFrameId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createParticle() {
    const colors = ['#6B7A4F', '#8A9A5B', '#FAF6EC', '#D4AF37', '#24395E', '#A4B875'];
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 2.5) * 12,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10,
      opacity: 1,
      gravity: 0.25,
      drag: 0.98
    };
  }

  function triggerConfetti() {
    particles = [];
    for (let i = 0; i < 95; i++) {
      particles.push(createParticle());
    }

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let activeParticles = 0;

    particles.forEach(p => {
      if (p.opacity <= 0) return;

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRotation;
      p.opacity -= 0.008;

      if (p.y < canvas.height && p.opacity > 0) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(animateConfetti);
    }
  }

});
