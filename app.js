/* ═══════════════════════════════════════════════════════
   VIBE — Social Media App  |  Frontend JS
   CodeAlpha Task 2
═══════════════════════════════════════════════════════ */

const API = '/api';
let token = localStorage.getItem('vibe_token');
let currentUser = JSON.parse(localStorage.getItem('vibe_user') || 'null');

// ─── Utils ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const timeAgo = iso => {
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 60)    return 'just now';
  if (d < 3600)  return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};
const avatarText = name => (name || '?')[0].toUpperCase();
const avatarEl = (url, name, size = '') =>
  url
    ? `<img src="${url}" alt="${name}" />`
    : avatarText(name);

async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────
function setAuth(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem('vibe_token', token);
  localStorage.setItem('vibe_user', JSON.stringify(currentUser));
}

function clearAuth() {
  token = null; currentUser = null;
  localStorage.removeItem('vibe_token');
  localStorage.removeItem('vibe_user');
}

// ─── Screens ──────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`page-${name}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });

  if (name === 'feed')    loadFeed();
  if (name === 'explore') loadExplore();
  if (name === 'profile') loadOwnProfile();
}

// ─── App Init ─────────────────────────────────────────────────
function initApp() {
  if (!currentUser) return showScreen('auth-screen');
  showScreen('app-screen');
  updateNavUser();
  showPage('feed');
  loadSuggestions();
}

function updateNavUser() {
  $('nav-username').textContent = currentUser.username;
  $('nav-avatar').innerHTML = avatarEl(currentUser.avatar_url, currentUser.full_name);
  $('cp-avatar').innerHTML  = avatarEl(currentUser.avatar_url, currentUser.full_name);
}

// ─── Auth Forms ───────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    $(`${btn.dataset.tab}-form`).classList.add('active');
  });
});

$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('login-error').textContent = '';
  try {
    const data = await api('/auth/login', 'POST', {
      email:    $('login-email').value,
      password: $('login-password').value,
    });
    setAuth(data);
    initApp();
  } catch (err) {
    $('login-error').textContent = err.message;
  }
});

$('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('reg-error').textContent = '';
  try {
    const data = await api('/auth/register', 'POST', {
      username:  $('reg-username').value,
      full_name: $('reg-fullname').value,
      email:     $('reg-email').value,
      password:  $('reg-password').value,
    });
    setAuth(data);
    initApp();
  } catch (err) {
    $('reg-error').textContent = err.message;
  }
});

$('logout-btn').addEventListener('click', () => {
  clearAuth();
  showScreen('auth-screen');
});

// ─── Navigation ───────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ─── Post Card Builder ────────────────────────────────────────
function buildPostCard(post) {
  const isOwn = post.user_id === currentUser.id;
  const card  = document.createElement('div');
  card.className = 'post-card';
  card.dataset.postId = post.id;

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar" data-username="${post.username}">
        ${avatarEl(post.avatar_url, post.full_name)}
      </div>
      <div class="post-meta">
        <div class="post-username" data-username="${post.username}">
          ${post.full_name || post.username}
          <span style="color:var(--text3);font-weight:400"> @${post.username}</span>
        </div>
        <div class="post-time">${timeAgo(post.created_at)}</div>
      </div>
      ${isOwn ? `<button class="post-delete-btn" data-post-id="${post.id}" title="Delete">✕</button>` : ''}
    </div>
    <div class="post-content">${escapeHtml(post.content)}</div>
    ${post.image_url ? `<img class="post-image" src="${post.image_url}" alt="post image" loading="lazy" />` : ''}
    <div class="post-actions">
      <button class="action-btn like-btn ${post.liked_by_me ? 'liked' : ''}" data-post-id="${post.id}">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="like-count">${post.likes_count}</span>
      </button>
      <button class="action-btn comment-toggle-btn" data-post-id="${post.id}">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="comment-count">${post.comments_count}</span>
      </button>
    </div>
    <div class="comments-section" id="comments-${post.id}" style="display:none">
      <div class="add-comment">
        <input type="text" placeholder="Add a comment..." class="comment-input" data-post-id="${post.id}" />
        <button class="comment-submit-btn" data-post-id="${post.id}">Send</button>
      </div>
      <div class="comments-list" id="comments-list-${post.id}"></div>
    </div>
  `;

  // Like toggle
  card.querySelector('.like-btn').addEventListener('click', async function() {
    try {
      const res = await api(`/posts/${post.id}/like`, 'POST');
      this.classList.toggle('liked', res.liked);
      const cnt = this.querySelector('.like-count');
      cnt.textContent = parseInt(cnt.textContent) + (res.liked ? 1 : -1);
    } catch {}
  });

  // Comment toggle
  card.querySelector('.comment-toggle-btn').addEventListener('click', function() {
    const section = $(`comments-${post.id}`);
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'flex' : 'none';
    section.style.flexDirection = 'column';
    if (isHidden) loadComments(post.id);
  });

  // Submit comment
  const commentInput = card.querySelector('.comment-input');
  card.querySelector('.comment-submit-btn').addEventListener('click', () => submitComment(post.id, commentInput));
  commentInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(post.id, commentInput); });

  // Delete post
  if (isOwn) {
    card.querySelector('.post-delete-btn').addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      try {
        await api(`/posts/${post.id}`, 'DELETE');
        card.remove();
      } catch (err) { alert(err.message); }
    });
  }

  // Profile link
  card.querySelectorAll('[data-username]').forEach(el => {
    el.addEventListener('click', () => loadUserProfile(el.dataset.username));
  });

  return card;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Comments ─────────────────────────────────────────────────
async function loadComments(postId) {
  const list = $(`comments-list-${postId}`);
  list.innerHTML = '<div class="loading-spinner sm"></div>';
  try {
    const comments = await api(`/posts/${postId}/comments`);
    renderComments(postId, comments);
  } catch { list.innerHTML = ''; }
}

function renderComments(postId, comments) {
  const list = $(`comments-list-${postId}`);
  list.innerHTML = '';
  comments.forEach(c => list.appendChild(buildComment(postId, c)));
}

function buildComment(postId, c) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.dataset.commentId = c.id;
  div.innerHTML = `
    <div class="comment-avatar">${avatarEl(c.avatar_url, c.full_name)}</div>
    <div class="comment-body">
      <span class="comment-username">${c.full_name || c.username}</span>
      <div class="comment-text">${escapeHtml(c.content)}</div>
    </div>
    ${c.user_id === currentUser.id ? `<button class="comment-delete" data-comment-id="${c.id}" data-post-id="${postId}">✕</button>` : ''}
  `;
  const del = div.querySelector('.comment-delete');
  if (del) {
    del.addEventListener('click', async () => {
      try {
        await api(`/posts/${postId}/comments/${c.id}`, 'DELETE');
        div.remove();
        const cnt = document.querySelector(`.comment-toggle-btn[data-post-id="${postId}"] .comment-count`);
        if (cnt) cnt.textContent = Math.max(0, parseInt(cnt.textContent) - 1);
      } catch {}
    });
  }
  return div;
}

async function submitComment(postId, input) {
  const content = input.value.trim();
  if (!content) return;
  input.value = '';
  try {
    const comment = await api(`/posts/${postId}/comments`, 'POST', { content });
    const list = $(`comments-list-${postId}`);
    list.appendChild(buildComment(postId, comment));
    const cnt = document.querySelector(`.comment-toggle-btn[data-post-id="${postId}"] .comment-count`);
    if (cnt) cnt.textContent = parseInt(cnt.textContent) + 1;
  } catch (err) { alert(err.message); }
}

// ─── Feed ─────────────────────────────────────────────────────
async function loadFeed() {
  const container = $('feed-posts');
  container.innerHTML = '<div class="loading-spinner"></div>';
  try {
    const posts = await api('/posts/feed');
    container.innerHTML = '';
    if (!posts.length) {
      container.innerHTML = `<div class="empty-state"><h3>Nothing here yet</h3><p>Follow some people to see their posts.</p></div>`;
      return;
    }
    posts.forEach(p => container.appendChild(buildPostCard(p)));
  } catch (err) { container.innerHTML = `<p style="color:var(--accent2);padding:20px">${err.message}</p>`; }
}

// ─── Explore ──────────────────────────────────────────────────
async function loadExplore() {
  const container = $('explore-posts');
  container.innerHTML = '<div class="loading-spinner"></div>';
  try {
    const posts = await api('/posts/explore');
    container.innerHTML = '';
    if (!posts.length) {
      container.innerHTML = `<div class="empty-state"><h3>No posts yet</h3><p>Be the first to post!</p></div>`;
      return;
    }
    posts.forEach(p => container.appendChild(buildPostCard(p)));
  } catch (err) { container.innerHTML = `<p style="color:var(--accent2);padding:20px">${err.message}</p>`; }
}

// ─── Create Post ──────────────────────────────────────────────
$('submit-post').addEventListener('click', async () => {
  const content   = $('new-post-content').value.trim();
  const image_url = $('new-post-image').value.trim();
  if (!content) return;
  try {
    const post = await api('/posts', 'POST', { content, image_url: image_url || null });
    $('new-post-content').value = '';
    $('new-post-image').value   = '';
    const container = $('feed-posts');
    container.insertBefore(buildPostCard(post), container.firstChild);
  } catch (err) { alert(err.message); }
});

// ─── Suggestions ──────────────────────────────────────────────
async function loadSuggestions() {
  const list = $('suggestions-list');
  try {
    const users = await api('/follows/suggestions');
    list.innerHTML = '';
    if (!users.length) { list.innerHTML = '<p style="color:var(--text3);font-size:13px">No suggestions right now</p>'; return; }
    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <div class="post-avatar" style="width:36px;height:36px;font-size:14px;cursor:pointer" data-username="${u.username}">
          ${avatarEl(u.avatar_url, u.full_name)}
        </div>
        <div class="suggestion-info">
          <div class="suggestion-name">${u.full_name || u.username}</div>
          <div class="suggestion-meta">${u.followers_count} followers</div>
        </div>
        <button class="follow-btn" data-user-id="${u.id}">Follow</button>
      `;
      item.querySelector('.follow-btn').addEventListener('click', async function() {
        try {
          const res = await api(`/follows/${u.id}`, 'POST');
          this.textContent = res.following ? 'Following' : 'Follow';
          this.classList.toggle('following', res.following);
        } catch {}
      });
      item.querySelector('[data-username]').addEventListener('click', () => loadUserProfile(u.username));
      list.appendChild(item);
    });
  } catch { list.innerHTML = ''; }
}

// ─── Profile ──────────────────────────────────────────────────
async function loadOwnProfile() {
  loadUserProfile(currentUser.username);
}

async function loadUserProfile(username) {
  showPage_raw('profile');
  const container = $('profile-content');
  container.innerHTML = '<div class="loading-spinner"></div>';
  try {
    const [user, posts] = await Promise.all([
      api(`/users/${username}`),
      api(`/users/${username}/posts`),
    ]);
    renderProfile(user, posts);
  } catch (err) { container.innerHTML = `<p style="color:var(--accent2);padding:20px">${err.message}</p>`; }
}

function showPage_raw(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`page-${name}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === name));
}

function renderProfile(user, posts) {
  const isOwn = user.id === currentUser.id;
  const container = $('profile-content');

  const headerEl = document.createElement('div');
  headerEl.className = 'profile-header';
  headerEl.innerHTML = `
    <div class="profile-top">
      <div class="profile-avatar">${avatarEl(user.avatar_url, user.full_name)}</div>
      <div class="profile-info">
        <div class="profile-fullname">${user.full_name || user.username}</div>
        <div class="profile-username">@${user.username}</div>
        ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
        ${isOwn
          ? `<button class="profile-action-btn" id="edit-profile-btn" style="margin-top:12px">Edit Profile</button>`
          : `<button class="profile-action-btn ${user.is_following ? 'following' : ''}" id="follow-profile-btn"
               data-user-id="${user.id}" style="margin-top:12px">
               ${user.is_following ? 'Following' : 'Follow'}
             </button>`
        }
      </div>
    </div>
    <div class="profile-stats">
      <div class="stat"><div class="stat-number">${user.posts_count}</div><div class="stat-label">Posts</div></div>
      <div class="stat"><div class="stat-number">${user.followers_count}</div><div class="stat-label">Followers</div></div>
      <div class="stat"><div class="stat-number">${user.following_count}</div><div class="stat-label">Following</div></div>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(headerEl);

  if (isOwn) {
    headerEl.querySelector('#edit-profile-btn').addEventListener('click', () => showEditProfile());
  } else {
    headerEl.querySelector('#follow-profile-btn').addEventListener('click', async function() {
      try {
        const res = await api(`/follows/${user.id}`, 'POST');
        this.textContent = res.following ? 'Following' : 'Follow';
        this.classList.toggle('following', res.following);
      } catch {}
    });
  }

  const postsTitle = document.createElement('h2');
  postsTitle.textContent = 'Posts';
  postsTitle.style.cssText = 'font-family:Syne,sans-serif;font-size:18px;margin-bottom:16px';
  container.appendChild(postsTitle);

  const postsList = document.createElement('div');
  postsList.className = 'posts-list';
  if (!posts.length) {
    postsList.innerHTML = '<div class="empty-state"><h3>No posts yet</h3><p>Share something!</p></div>';
  } else {
    posts.forEach(p => postsList.appendChild(buildPostCard(p)));
  }
  container.appendChild(postsList);
}

// ─── Edit Profile Modal ───────────────────────────────────────
function showEditProfile() {
  const content = `
    <div class="edit-profile-form">
      <h2>Edit Profile</h2>
      <input id="ep-fullname"   placeholder="Full Name"   value="${currentUser.full_name || ''}" />
      <textarea id="ep-bio" rows="3"    placeholder="Bio">${currentUser.bio || ''}</textarea>
      <input id="ep-avatar"    placeholder="Avatar URL (optional)" value="${currentUser.avatar_url || ''}" />
      <button class="btn-primary" id="ep-save">Save Changes</button>
      <p class="auth-error" id="ep-error"></p>
    </div>
  `;
  showModal(content);

  setTimeout(() => {
    $('ep-save').addEventListener('click', async () => {
      $('ep-error').textContent = '';
      try {
        await api('/users/me', 'PUT', {
          full_name:  $('ep-fullname').value,
          bio:        $('ep-bio').value,
          avatar_url: $('ep-avatar').value || null,
        });
        currentUser.full_name  = $('ep-fullname').value;
        currentUser.bio        = $('ep-bio').value;
        currentUser.avatar_url = $('ep-avatar').value || null;
        localStorage.setItem('vibe_user', JSON.stringify(currentUser));
        updateNavUser();
        hideModal();
        loadOwnProfile();
      } catch (err) {
        $('ep-error').textContent = err.message;
      }
    });
  }, 50);
}

// ─── Modal ────────────────────────────────────────────────────
function showModal(html) {
  $('modal-content').innerHTML = html;
  $('modal-overlay').classList.remove('hidden');
}
function hideModal() {
  $('modal-overlay').classList.add('hidden');
  $('modal-content').innerHTML = '';
}

$('modal-close').addEventListener('click', hideModal);
$('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) hideModal(); });

// ─── Start ────────────────────────────────────────────────────
initApp();
