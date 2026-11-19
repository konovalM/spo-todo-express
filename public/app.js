// Токен хранится только в памяти страницы, в исходники не зашит.
let token = '';

const $ = (id) => document.getElementById(id);

async function api(method, path, body) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function connect() {
  token = $('token').value.trim();
  $('auth-error').textContent = '';
  try {
    const author = await api('GET', '/api/author/');
    $('author').textContent = `${author.fullName} (${author.login})`;
    $('app-card').classList.remove('hidden');
    await loadTasks();
  } catch (e) {
    $('auth-error').textContent = `Ошибка входа: ${e.message}`;
    $('app-card').classList.add('hidden');
  }
}

async function loadTasks() {
  $('app-error').textContent = '';
  const runId = $('runId').value.trim();
  try {
    const tasks = await api('GET', `/api/tasks/?runId=${encodeURIComponent(runId)}`);
    renderTasks(tasks);
  } catch (e) {
    $('app-error').textContent = e.message;
  }
}

function renderTasks(tasks) {
  const ul = $('tasks');
  ul.innerHTML = '';
  if (tasks.length === 0) {
    ul.innerHTML = '<li class="muted">Пусто</li>';
    return;
  }
  for (const t of tasks) {
    const li = document.createElement('li');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = t.done;
    check.onchange = () => patchTask(t.id, { done: check.checked });

    const title = document.createElement('span');
    title.className = 'title' + (t.done ? ' done' : '');
    title.textContent = t.title;

    const edit = document.createElement('button');
    edit.className = 'secondary';
    edit.textContent = 'Переименовать';
    edit.onclick = () => {
      const next = prompt('Новое название', t.title);
      if (next !== null) patchTask(t.id, { title: next });
    };

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'Удалить';
    del.onclick = () => removeTask(t.id);

    li.append(check, title, edit, del);
    ul.appendChild(li);
  }
}

async function addTask(e) {
  e.preventDefault();
  $('app-error').textContent = '';
  const title = $('new-title').value;
  const runId = $('runId').value.trim();
  try {
    await api('POST', '/api/tasks/', { title, runId });
    $('new-title').value = '';
    await loadTasks();
  } catch (err) {
    $('app-error').textContent = err.message;
  }
}

async function patchTask(id, patch) {
  try {
    await api('PATCH', `/api/tasks/${id}/`, patch);
    await loadTasks();
  } catch (e) {
    $('app-error').textContent = e.message;
  }
}

async function removeTask(id) {
  try {
    await api('DELETE', `/api/tasks/${id}/`);
    await loadTasks();
  } catch (e) {
    $('app-error').textContent = e.message;
  }
}

$('connect').onclick = connect;
$('refresh').onclick = loadTasks;
$('add-form').onsubmit = addTask;
