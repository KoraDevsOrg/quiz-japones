export class AchievementsModule {
  constructor(storageService, audioService) {
    this.storage = storageService;
    this.audio = audioService;

    // Catálogo de logros
    this.badges = [
      {
        id: "first_step",
        title: "Primeros Pasos",
        desc: "Acierta tu primera palabra en el cuestionario.",
        icon: "🥉"
      },
      {
        id: "streak_10",
        title: "En Llamas",
        desc: "Alcanza una racha de 10 aciertos seguidos.",
        icon: "🔥"
      },
      {
        id: "centurion",
        title: "Centurión",
        desc: "Llega a un total de 100 respuestas correctas.",
        icon: "🏆"
      },
      {
        id: "speed_ninja",
        title: "Velocista Ninja",
        desc: "Consigue 10 o más puntos en el Contrarreloj.",
        icon: "⚡"
      },
      {
        id: "memory_master",
        title: "Mente Fotográfica",
        desc: "Resuelve la Memoria en 8 intentos o menos.",
        icon: "🧠"
      },
      {
        id: "scramble_master",
        title: "Maestro de Sílabas",
        desc: "Racha de 5 palabras seguidas en Anagrama.",
        icon: "🧩"
      },
      {
        id: "wordsearch_master",
        title: "Rastreador",
        desc: "Completa una Sopa de Letras entera.",
        icon: "🔍"
      },
      {
        id: "night_owl",
        title: "Búho Nocturno",
        desc: "Practica japonés de noche (después de las 8:00 PM).",
        icon: "🦉"
      }
    ];

    this.gridContainer = document.getElementById("achievementsGrid");
    this.toastEl = document.getElementById("achievementToast");
    this.toastIcon = document.getElementById("toastIcon");
    this.toastTitle = document.getElementById("toastTitle");
  }

  // Verifica y desbloquea un logro con animación y sonido
  triggerUnlock(id) {
    const isNew = this.storage.unlockAchievement(id);
    if (isNew) {
      const badge = this.badges.find(b => b.id === id);
      if (badge) {
        this._showToast(badge);
        this.audio.playFeedback(true);
      }
    }
  }

  _showToast(badge) {
    if (!this.toastEl) return;
    this.toastIcon.textContent = badge.icon;
    this.toastTitle.textContent = badge.title;

    this.toastEl.classList.add("show");
    setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 3800);
  }

  // Renderiza la vitrina de medallas
  render() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = "";

    const unlockedIds = this.storage.getUnlockedAchievements();
    const unlockedCountEl = document.getElementById("unlockedBadgesCount");
    if (unlockedCountEl) {
      unlockedCountEl.textContent = `${unlockedIds.length} / ${this.badges.length}`;
    }

    this.badges.forEach(badge => {
      const isUnlocked = unlockedIds.includes(badge.id);
      const card = document.createElement("div");
      card.className = `badge-card ${isUnlocked ? "unlocked" : "locked"}`;

      card.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-info">
          <h4>${badge.title}</h4>
          <p>${badge.desc}</p>
          <span class="badge-status-tag">${isUnlocked ? "✅ Desbloqueado" : "🔒 Bloqueado"}</span>
        </div>
      `;

      this.gridContainer.appendChild(card);
    });
  }
}
