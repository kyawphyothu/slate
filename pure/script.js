// === CONSTANTS === //
const today = new Date().toISOString().slice(0, 10);

// === VIEW CONTAINERS === //
const summaryView = document.getElementById("summary-view");
const detailView = document.getElementById("detail-view");
const futureView = document.getElementById("future-view");

// === HOME PAGE ELEMENTS === //
const inputBox = document.getElementById("input-box");
const completedCounter = document.getElementById("completed-counter");
const uncompletedCounter = document.getElementById("uncompleted-counter");
const todayTaskList = document.getElementById("today-task-list");
const reminderMessage = document.getElementById("reminder-message");
const leftoverMessage = document.getElementById("yesterday-leftover-message");

// === ALL TASKS PAGE ELEMENTS === //
const uncompletedList = document.getElementById("uncompleted-list");
const completedList = document.getElementById("completed-list");
const deleteAllButton = document.getElementById("delete-all-completed");

// === FUTURE TASKS PAGE ELEMENTS === //
const futureInput = document.getElementById("future-input");
const futureDateInput = document.getElementById("future-date-input");
const futureTaskList = document.getElementById("future-task-list");

// === BUTTON EVENTS === //
document.getElementById("input-button").addEventListener("click", () => addTask(today));
document.getElementById("show-list-button").addEventListener("click", showAllTasks);
document.getElementById("back-button").addEventListener("click", goHome);
document.getElementById("view-future-button").addEventListener("click", showFutureTasks);
document.getElementById("back-to-all-button").addEventListener("click", showAllTasks);
document.getElementById("future-add-button").addEventListener("click", addFutureTask);
deleteAllButton.addEventListener("click", deleteAllCompleted);

// === TASK STORAGE === //
let tasks = [];
try {
  tasks = JSON.parse(localStorage.getItem("tasks")) || [];
} catch (e) {
  tasks = [];
}

// === HELPERS === //
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function filterTasksByDate(date) {
  return tasks.filter(task => task.date === date);
}

function filterFutureTasks() {
  return tasks.filter(task => task.date > today);
}

function calculateProgress(task) {
  if (!task.subtasks.length) return null;
  const done = task.subtasks.filter(s => s.completed).length;
  return `${done}/${task.subtasks.length}`;
}

function checkParentCompletion(task) {
  if (task.subtasks.length) {
    task.completed = task.subtasks.every(s => s.completed);
  }
}

// === ADD TASKS === //
function addTask(date) {
  const text = inputBox.value.trim();
  if (!text) {
    alert("Please write a task.");
    return;
  }
  tasks.push({
    id: generateId(),
    text,
    date,
    completed: false,
    subtasks: []
  });
  inputBox.value = "";
  saveTasks();
  renderHome();
}

function addFutureTask() {
  const text = futureInput.value.trim();
  const date = futureDateInput.value;
  if (!text || !date) {
    alert("Enter text and pick a date!");
    return;
  }
  tasks.push({
    id: generateId(),
    text,
    date,
    completed: false,
    subtasks: []
  });
  futureInput.value = "";
  futureDateInput.value = "";
  saveTasks();
  renderFuture();
}

function deleteAllCompleted() {
  if (confirm("Delete all completed tasks?")) {
    tasks = tasks.filter(task => !(task.date === today && task.completed));
    saveTasks();
    renderAll();
  }
}

// === VIEW SWITCHING === //
function goHome() {
  summaryView.style.display = "block";
  detailView.style.display = "none";
  futureView.style.display = "none";
  renderHome();
}

function showAllTasks() {
  summaryView.style.display = "none";
  detailView.style.display = "block";
  futureView.style.display = "none";
  renderAll();
}

function showFutureTasks() {
  summaryView.style.display = "none";
  detailView.style.display = "none";
  futureView.style.display = "block";
  renderFuture();
}

// === RENDER FUNCTIONS === //
function renderHome() {
  summaryView.style.display = "block";
  detailView.style.display = "none";
  futureView.style.display = "none";

  const todays = filterTasksByDate(today);
  const completedCount = todays.filter(t => t.completed).length;
  const uncompletedCount = todays.length - completedCount;

  completedCounter.textContent = completedCount;
  uncompletedCounter.textContent = uncompletedCount;

  todayTaskList.innerHTML = ""; 
  reminderMessage.textContent = "";
  leftoverMessage.textContent = "";

  if (todays.some(t => !t.completed)) {
    reminderMessage.textContent = "You assigned some tasks for today!";
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  const leftovers = filterTasksByDate(yesterday).filter(t => !t.completed);
  if (leftovers.length) {
    leftoverMessage.textContent = "Leftover from yesterday!";
  }
}

function renderAll() {
  const todays = filterTasksByDate(today);
  uncompletedList.innerHTML = "";
  completedList.innerHTML = "";

  const completedCount = todays.filter(t => t.completed).length;
  deleteAllButton.style.display = completedCount > 0 ? "inline-block" : "none";

  todays.forEach(task => {
    const li = renderTaskItem(task);
    (task.completed ? completedList : uncompletedList).appendChild(li);
  });
}

function renderFuture() {
  futureTaskList.innerHTML = "";
  const futures = filterFutureTasks();
  futures.forEach(task => {
    const li = renderTaskItem(task);
    futureTaskList.appendChild(li);
  });
}

function renderTaskItem(task) {
  const li = document.createElement("li");

  let title = task.text;
  const progress = calculateProgress(task);
  if (progress) title += ` (${progress})`;

  const header = document.createElement("div");
  
  // Build header buttons
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  header.appendChild(checkbox);

  const span = document.createElement("span");
  span.textContent = title;
  header.appendChild(span);

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.textContent = "✎";
  header.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn";
  deleteBtn.textContent = "🗑️";
  header.appendChild(deleteBtn);

  if (task.subtasks.length > 0) {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "icon-btn";
    toggleBtn.textContent = "▶";
    header.appendChild(toggleBtn);
  }

  const addSubBtn = document.createElement("button");
  addSubBtn.className = "icon-btn";
  addSubBtn.textContent = "+";
  header.appendChild(addSubBtn);

  li.appendChild(header);

  // EVENTS
  checkbox.addEventListener("click", () => {
    task.completed = checkbox.checked;
    if (task.subtasks.length) {
      task.subtasks.forEach(st => st.completed = checkbox.checked);
    }
    saveTasks();
    renderAll();
  });

  editBtn.addEventListener("click", () => {
    const newText = prompt("Edit task:", task.text);
    if (newText !== null) {
      const trimmed = newText.trim();
      if (trimmed) {
        task.text = trimmed;
        saveTasks();
        renderAll();
      }
    }
  });

  deleteBtn.addEventListener("click", () => {
    if (confirm("Delete this task?")) {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderAll();
    }
  });

  const subtaskContainer = document.createElement("ul");
  subtaskContainer.style.display = task.subtasks.length > 0 ? "block" : "none";

  if (task.subtasks.length > 0) {
    header.querySelector(".icon-btn:nth-child(5)").addEventListener("click", () => {
      subtaskContainer.style.display = subtaskContainer.style.display === "none" ? "block" : "none";
    });
  }

  addSubBtn.addEventListener("click", () => {
    const st = prompt("Subtask?");
    if (st && st.trim()) {
      task.subtasks.push({ id: generateId(), text: st.trim(), completed: false });
      saveTasks();
      renderAll();

      // Open the subtasks immediately
      subtaskContainer.style.display = "block";
    }
  });

  task.subtasks.forEach(sub => {
    const subLi = document.createElement("li");
    const subCheckbox = document.createElement("input");
    subCheckbox.type = "checkbox";
    subCheckbox.checked = sub.completed;
    subLi.appendChild(subCheckbox);

    const subSpan = document.createElement("span");
    subSpan.textContent = sub.text;
    subLi.appendChild(subSpan);

    const subEdit = document.createElement("button");
    subEdit.className = "icon-btn";
    subEdit.textContent = "✎";
    subLi.appendChild(subEdit);

    const subDelete = document.createElement("button");
    subDelete.className = "icon-btn";
    subDelete.textContent = "🗑️";
    subLi.appendChild(subDelete);

    subCheckbox.addEventListener("click", () => {
      sub.completed = subCheckbox.checked;
      checkParentCompletion(task);
      saveTasks();
      renderAll();
    });

    subEdit.addEventListener("click", () => {
      const newText = prompt("Edit subtask:", sub.text);
      if (newText !== null) {
        const trimmed = newText.trim();
        if (trimmed) {
          sub.text = trimmed;
          saveTasks();
          renderAll();
        }
      }
    });

    subDelete.addEventListener("click", () => {
      if (confirm("Delete this subtask?")) {
        task.subtasks = task.subtasks.filter(s => s.id !== sub.id);
        checkParentCompletion(task);
        saveTasks();
        renderAll();
      }
    });

    subtaskContainer.appendChild(subLi);
  });

  li.appendChild(subtaskContainer);

  return li;
}

// === INIT === //
renderHome();
