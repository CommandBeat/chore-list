// ---------------------- INDEXEDDB SETUP ----------------------
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ChoreBoardDB", 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore("settings", { keyPath: "id" });
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

function saveData() {
  const tx = db.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");

  store.put({
    id: "choreData",
    choresByDay,
    dayOrder,
    currentDay
  });
}

function loadData() {
  return new Promise((resolve) => {
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");

    const request = store.get("choreData");

    request.onsuccess = () => {
      if (request.result) {
        choresByDay = request.result.choresByDay;
        dayOrder = request.result.dayOrder;
        currentDay = request.result.currentDay;
      }
      resolve();
    };

    request.onerror = () => resolve();
  });
}

// ---------------------- DEFAULT DATA ----------------------
let choresByDay = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
};

let dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let currentDay = "Monday";

// ---------------------- DOM ELEMENTS ----------------------
const daysList = document.getElementById("days-list");
const choresList = document.getElementById("chores-list");
const currentDayTitle = document.getElementById("current-day-title");
const choreForm = document.getElementById("chore-form");
const choreInput = document.getElementById("chore-input");
const editDaysBtn = document.getElementById("edit-days-btn");
const changeStartBtn = document.getElementById("change-start-btn");

// ---------------------- RENDER FUNCTIONS ----------------------
function renderDayList() {
  daysList.innerHTML = "";

  dayOrder.forEach(day => {
    const li = document.createElement("li");
    li.className = "day-item";
    li.dataset.day = day;
    li.textContent = day;

    if (day === currentDay) li.classList.add("active");

    li.addEventListener("click", () => setActiveDay(day));

    daysList.appendChild(li);
  });
}

function renderChores() {
  choresList.innerHTML = "";

  const chores = choresByDay[currentDay] || [];

  if (chores.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No chores yet.";
    li.style.color = "#9ca3af";
    choresList.appendChild(li);
    return;
  }

  chores.forEach((chore, index) => {
    const li = document.createElement("li");
    li.className = "chore-item";

    const span = document.createElement("span");
    span.textContent = chore;

    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.textContent = "Delete";
    btn.onclick = () => {
      choresByDay[currentDay].splice(index, 1);
      saveData();
      renderChores();
    };

    li.appendChild(span);
    li.appendChild(btn);
    choresList.appendChild(li);
  });
}

function setActiveDay(day) {
  currentDay = day;
  currentDayTitle.textContent = day;
  saveData();
  renderDayList();
  renderChores();
}

// ---------------------- EVENT LISTENERS ----------------------
choreForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = choreInput.value.trim();
  if (!text) return;

  choresByDay[currentDay].push(text);
  choreInput.value = "";
  saveData();
  renderChores();
});

// Rename days
editDaysBtn.addEventListener("click", () => {
  dayOrder = dayOrder.map(day => {
    const newName = prompt(`Rename "${day}" to:`, day);

    if (!newName || !newName.trim() || newName === day) return day;

    const clean = newName.trim();

    // Move chores
    choresByDay[clean] = choresByDay[day] || [];
    delete choresByDay[day];

    // Update current day
    if (currentDay === day) currentDay = clean;

    return clean;
  });

  saveData();
  renderDayList();
  renderChores();
});

// Change starting day
changeStartBtn.addEventListener("click", () => {
  const newStart = prompt(
    "Choose a new starting day:\n" + dayOrder.join(", "),
    dayOrder[0]
  );

  if (!newStart || !dayOrder.includes(newStart)) return;

  const index = dayOrder.indexOf(newStart);
  dayOrder = [...dayOrder.slice(index), ...dayOrder.slice(0, index)];

  saveData();
  renderDayList();
});

// ---------------------- INITIALIZE APP ----------------------
openDB().then(() => {
  loadData().then(() => {
    renderDayList();
    renderChores();
    currentDayTitle.textContent = currentDay;
  });
});
