'use strict';

const STORAGE_KEY = 'todo-app.todos';

const form = document.getElementById('new-todo-form');
const input = document.getElementById('new-todo-input');
const list = document.getElementById('todo-list');
const emptyMessage = document.getElementById('empty-message');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedButton = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filters button');

let todos = loadTodos();
let currentFilter = 'all';

function loadTodos() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 保存できない環境（プライベートモード等）でもアプリ自体は動かす
  }
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addTodo(text) {
  todos.push({ id: createId(), text, completed: false });
  commit();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    commit();
  }
}

function updateTodo(id, text) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.text = text;
    commit();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  commit();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.completed);
  commit();
}

function commit() {
  saveTodos();
  render();
}

function visibleTodos() {
  if (currentFilter === 'active') return todos.filter((t) => !t.completed);
  if (currentFilter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

function render() {
  list.replaceChildren(...visibleTodos().map(renderItem));

  const emptyTexts = {
    all: 'TODOはありません',
    active: '未完了のTODOはありません',
    completed: '完了済みのTODOはありません',
  };
  emptyMessage.textContent = emptyTexts[currentFilter];
  emptyMessage.hidden = list.children.length > 0;

  const remaining = todos.filter((t) => !t.completed).length;
  remainingCount.textContent = `残り ${remaining} 件`;
  clearCompletedButton.hidden = !todos.some((t) => t.completed);

  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });
}

function renderItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.completed ? ' completed' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.setAttribute('aria-label', '完了');
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;
  text.addEventListener('dblclick', () => startEditing(li, text, todo));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '×';
  deleteButton.setAttribute('aria-label', '削除');
  deleteButton.addEventListener('click', () => deleteTodo(todo.id));

  li.append(checkbox, text, deleteButton);
  return li;
}

function startEditing(li, textElement, todo) {
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'edit-input';
  editInput.maxLength = 200;
  editInput.value = todo.text;

  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    const value = editInput.value.trim();
    if (!save) {
      render();
    } else if (value === '') {
      deleteTodo(todo.id);
    } else {
      updateTodo(todo.id, value);
    }
  };

  editInput.addEventListener('keydown', (e) => {
    if (e.isComposing) return; // 日本語変換確定の Enter は無視
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  editInput.addEventListener('blur', () => finish(true));

  li.replaceChild(editInput, textElement);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text === '') return;
  addTodo(text);
  input.value = '';
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

clearCompletedButton.addEventListener('click', clearCompleted);

render();
