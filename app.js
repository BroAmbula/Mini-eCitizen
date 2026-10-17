/* HudumaLink demo application
 * Client-side prototype: records and demo accounts are stored in localStorage.
 * Replace this layer with a secure API/database before production deployment.
 */
(() => {
  "use strict";
  const STORAGE = { requests: "hudumalink_requests_v1", users: "hudumalink_users_v1", session: "hudumalink_session_v1" };
  const categories = ["Roads & Lighting", "Water & Sanitation", "Waste Management", "Public Safety", "Other"];
  const categoryMeta = {
    "Roads & Lighting": { icon: "☼", className: "roads" },
    "Water & Sanitation": { icon: "≈", className: "water" },
    "Waste Management": { icon: "♻", className: "waste" },
    "Public Safety": { icon: "◇", className: "safety" },
    "Other": { icon: "＋", className: "other" }
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const dateLabel = value => new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  const statusClass = status => status === "Resolved" ? "status-resolved" : status === "In Progress" ? "status-progress" : "status-pending";
  const statusIcon = category => categoryMeta[category] || categoryMeta.Other;
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const demoRequests = [
    { id: "HL-2026-0001", title: "Streetlight out near Kiharu Market", category: "Roads & Lighting", location: "Kiharu Market, main road", county: "Murang’a County", description: "The streetlight outside the market entrance has not been working for several nights. The road gets very dark after sunset.", priority: "High", status: "In Progress", createdAt: "2026-10-14T08:30:00.000Z", owner: "demo-citizen", contact: "", image: "" },
    { id: "HL-2026-0002", title: "Missed waste collection", category: "Waste Management", location: "Mumbi Estate, Block C", county: "Murang’a County", description: "Waste has not been collected at the shared collection point this week and bins are overflowing.", priority: "Normal", status: "Pending", createdAt: "2026-10-15T10:10:00.000Z", owner: "demo-citizen", contact: "", image: "" },
    { id: "HL-2026-0003", title: "Water leak by the bus stage", category: "Water & Sanitation", location: "Near the main bus stage", county: "Murang’a County", description: "A pipe appears to be leaking continuously beside the bus stage. Water is running into the walkway.", priority: "Urgent", status: "Resolved", createdAt: "2026-10-11T06:20:00.000Z", owner: "demo-citizen", contact: "", image: "" },
    { id: "HL-2026-0004", title: "Damaged pedestrian crossing sign", category: "Public Safety", location: "School zone, Kenol Road", county: "Murang’a County", description: "The pedestrian crossing sign is leaning into the road and is difficult for drivers to see.", priority: "Normal", status: "Pending", createdAt: "2026-10-16T07:45:00.000Z", owner: "demo-citizen", contact: "", image: "" }
  ];
  let requests = read(STORAGE.requests);
  if (!Array.isArray(requests)) { requests = demoRequests; write(STORAGE.requests, requests); }
  requests.forEach(request => {
    if (!Array.isArray(request.statusHistory)) {
      request.statusHistory = [{ status: request.status || "Pending", at: request.updatedAt || request.createdAt, actor: "Existing record" }];
    }
  });
  write(STORAGE.requests, requests);
  let users = read(STORAGE.users);
  if (!Array.isArray(users)) { users = []; write(STORAGE.users, users); }
  let session = read(STORAGE.session);
  let authMode = "login";
  let pendingImage = "";
  let pendingImageName = "";

  function currentUser() { return session ? session : null; }
  function isAdmin() { return !!session && session.role === "admin"; }
  function showToast(message, error = false) {
    const toast = document.createElement("div");
    toast.className = `toast${error ? " error" : ""}`;
    toast.textContent = message;
    $("#toastContainer").append(toast);
    setTimeout(() => toast.remove(), 3600);
  }
  function setView(name) {
    const valid = ["overview", "requests", "new-request", "tracking"];
    if (!valid.includes(name)) name = "overview";
    $$(".page").forEach(page => page.classList.toggle("active", page.id === `view-${name}`));
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === name));
    const labels = { overview: "Overview", requests: "Service requests", "new-request": "Submit a request", tracking: "Track a request" };
    $("#crumbTitle").textContent = labels[name];
    $("#sidebar").classList.remove("open");
    if (name === "requests") renderRequests();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function canSeeRequest(request) { return isAdmin() || request.owner === "demo-citizen" || (!!session && request.owner === session.email); }
  function visibleRequests() { return [...requests].filter(canSeeRequest).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); }
  function refreshHeader() {
    const user = currentUser();
    $("#userName").textContent = user ? user.name : "Guest Citizen";
    $("#userRole").textContent = isAdmin() ? "Service administrator" : user ? "Registered citizen" : "Citizen access";
    $("#userAvatar").textContent = user ? user.name.trim().charAt(0).toUpperCase() : "G";
    $("#authAction").textContent = user ? "Sign out" : "Sign in / Register";
    $("#demoAdmin").classList.toggle("hidden", isAdmin());
    $("#navCount").textContent = visibleRequests().length;
    $("#adminIndicator").classList.toggle("hidden", !isAdmin());
    $("#adminDashboard").classList.toggle("hidden", !isAdmin());
    renderOverview();
  }
  function renderOverview() {
    const list = visibleRequests();
    $("#statTotal").textContent = list.length;
    $("#statPending").textContent = list.filter(r => r.status === "Pending").length;
    $("#statProgress").textContent = list.filter(r => r.status === "In Progress").length;
    $("#statResolved").textContent = list.filter(r => r.status === "Resolved").length;
    if (isAdmin()) {
      const resolved = list.filter(r => r.status === "Resolved").length;
      $("#adminOpen").textContent = list.length - resolved;
      $("#adminResolution").textContent = list.length ? Math.round(resolved / list.length * 100) : 0;
      $("#adminUrgent").textContent = list.filter(r => r.priority === "Urgent" && r.status !== "Resolved").length;
    }
    $("#recentRequests").innerHTML = list.slice(0, 4).map(request => {
      const meta = statusIcon(request.category);
      return `<div class="request-row"><div class="category-icon ${meta.className}">${meta.icon}</div><div class="request-main"><strong>${escapeHTML(request.title)}</strong><span>${escapeHTML(request.id)} · ${escapeHTML(request.location)}</span></div><div class="request-meta"><span class="status-pill ${statusClass(request.status)}">${escapeHTML(request.status)}</span><time>${dateLabel(request.createdAt)}</time></div></div>`;
    }).join("");
    $("#recentEmpty").classList.toggle("hidden", list.length > 0);
    $("#recentRequests").classList.toggle("hidden", list.length === 0);
    const counts = categories.map(category => ({ category, count: list.filter(r => r.category === category).length }));
    const max = Math.max(1, ...counts.map(item => item.count));
    $("#categoryChart").innerHTML = counts.map(item => `<div class="chart-row"><span class="chart-label">${escapeHTML(item.category)}</span><div class="chart-track"><div class="chart-fill" style="width:${item.count / max * 100}%"></div></div><span class="chart-value">${item.count}</span></div>`).join("");
  }
  function renderRequests() {
    const search = ($("#requestSearch")?.value || "").trim().toLowerCase();
    const status = $("#statusFilter")?.value || "all";
    const category = $("#categoryFilter")?.value || "all";
    const filtered = visibleRequests().filter(r => {
      const matchText = [r.id, r.title, r.location, r.category].some(value => String(value || "").toLowerCase().includes(search));
      return matchText && (status === "all" || r.status === status) && (category === "all" || r.category === category);
    });
    $("#requestCountLabel").textContent = `${filtered.length} request${filtered.length === 1 ? "" : "s"} found`;
    $("#requestTable").innerHTML = filtered.map(r => {
      const meta = statusIcon(r.category);
      const statusControl = isAdmin()
        ? `<select class="status-select" data-status-id="${escapeHTML(r.id)}" aria-label="Update status for ${escapeHTML(r.id)}"><option ${r.status === "Pending" ? "selected" : ""}>Pending</option><option ${r.status === "In Progress" ? "selected" : ""}>In Progress</option><option ${r.status === "Resolved" ? "selected" : ""}>Resolved</option></select>`
        : `<span class="status-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span>`;
      return `<tr><td><div class="table-request"><div class="category-icon ${meta.className}">${meta.icon}</div><div><strong>${escapeHTML(r.title)}</strong><span>${escapeHTML(r.id)}</span></div></div></td><td>${escapeHTML(r.category)}</td><td>${escapeHTML(r.location)}</td><td class="table-date">${dateLabel(r.createdAt)}</td><td>${statusControl}</td><td><button class="table-action" data-detail-id="${escapeHTML(r.id)}">View details</button></td></tr>`;
    }).join("");
    $("#tableEmpty").classList.toggle("hidden", filtered.length > 0);
    $(".table-wrap").classList.toggle("hidden", filtered.length === 0);
  }
  function openDetails(id) {
    const r = requests.find(item => item.id === id);
    if (!r) return;
    const meta = statusIcon(r.category);
    const history = [...(r.statusHistory || [])].reverse().map(entry => `<li><span class="history-dot"></span><div><strong>${escapeHTML(entry.status)}</strong><span>${dateLabel(entry.at)} · ${escapeHTML(entry.actor || "Service team")}</span></div></li>`).join("");
    $("#detailContent").innerHTML = `<div class="detail-header"><div class="category-icon ${meta.className}">${meta.icon}</div><div><h2 id="detailTitle">${escapeHTML(r.title)}</h2><span class="request-id">${escapeHTML(r.id)} · Submitted ${dateLabel(r.createdAt)}</span></div></div><div style="margin-top:14px"><span class="status-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span></div><p class="detail-body">${escapeHTML(r.description)}</p><div class="detail-info-grid"><div><span>Category</span><strong>${escapeHTML(r.category)}</strong></div><div><span>Priority</span><strong>${escapeHTML(r.priority || "Normal")}</strong></div><div><span>Location</span><strong>${escapeHTML(r.location)}</strong></div><div><span>County / area</span><strong>${escapeHTML(r.county || "Not provided")}</strong></div></div><section class="status-history"><h3>Status history</h3><ol>${history}</ol></section>${r.image ? `<img class="detail-photo" src="${r.image}" alt="Photo attached to ${escapeHTML(r.id)}">` : ""}${isAdmin() ? `<div class="detail-admin"><label for="detailStatus">Update request status</label><select id="detailStatus" data-status-id="${escapeHTML(r.id)}"><option ${r.status === "Pending" ? "selected" : ""}>Pending</option><option ${r.status === "In Progress" ? "selected" : ""}>In Progress</option><option ${r.status === "Resolved" ? "selected" : ""}>Resolved</option></select></div>` : ""}`;
    $("#detailModal").classList.remove("hidden");
  }
  function closeModals() { $$(".modal-backdrop").forEach(m => m.classList.add("hidden")); }
  function saveStatus(id, status) {
    const r = requests.find(item => item.id === id);
    if (!r || !isAdmin()) return;
    if (r.status === status) return;
    if (!Array.isArray(r.statusHistory)) r.statusHistory = [];
    r.status = status;
    r.updatedAt = new Date().toISOString();
    r.statusHistory.push({ status, at: r.updatedAt, actor: session.name });
    write(STORAGE.requests, requests);
    renderRequests(); renderOverview(); openDetails(id);
    showToast(`Request ${id} updated to ${status}.`);
  }
  function makeRequestId() {
    const year = new Date().getFullYear();
    const highest = requests.reduce((max, r) => {
      const match = String(r.id).match(/^HL-\d{4}-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `HL-${year}-${String(highest + 1).padStart(4, "0")}`;
  }
  function handleSubmitRequest(event) {
    event.preventDefault();
    if (!session) { showToast("Please sign in or create an account before submitting.", true); openAuth("register"); return; }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const request = {
      id: makeRequestId(), title: String(data.get("title")).trim(), category: String(data.get("category")),
      location: String(data.get("location")).trim(), county: String(data.get("county") || "").trim(),
      description: String(data.get("description")).trim(), priority: String(data.get("priority") || "Normal"),
      contact: String(data.get("contact") || "").trim(), status: "Pending", createdAt: new Date().toISOString(),
      owner: session.email, image: pendingImage,
      statusHistory: [{ status: "Pending", at: new Date().toISOString(), actor: session.name }]
    };
    requests.push(request); write(STORAGE.requests, requests);
    form.reset(); $("#requestCounty").value = "Murang’a County"; pendingImage = ""; pendingImageName = ""; $("#imagePreview").classList.add("hidden");
    refreshHeader(); setView("requests"); showToast(`Request submitted. Your tracking ID is ${request.id}.`); openDetails(request.id);
  }
  function openAuth(mode = "login") {
    authMode = mode; updateAuthMode(); $("#authError").classList.add("hidden"); $("#authModal").classList.remove("hidden"); $("#accountPopover").classList.add("hidden");
  }
  function updateAuthMode() {
    $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.authTab === authMode));
    $("#registerFields").classList.toggle("hidden", authMode !== "register");
    $("#authName").required = authMode === "register";
    $("#authTitle").textContent = authMode === "register" ? "Create your account" : "Welcome to HudumaLink";
    $(".auth-submit").innerHTML = authMode === "register" ? "Create account <span>→</span>" : "Sign in <span>→</span>";
    $("#authPassword").autocomplete = authMode === "register" ? "new-password" : "current-password";
  }
  function handleAuth(event) {
    event.preventDefault();
    const email = $("#authEmail").value.trim().toLowerCase();
    const password = $("#authPassword").value;
    const error = $("#authError");
    error.classList.add("hidden");
    if (authMode === "register") {
      const name = $("#authName").value.trim();
      if (!name) return;
      if (users.some(u => u.email === email)) { error.textContent = "An account with this email already exists."; error.classList.remove("hidden"); return; }
      // Demo only: never store plaintext passwords in a real application.
      users.push({ name, email, password, role: "citizen" }); write(STORAGE.users, users);
      session = { name, email, role: "citizen" }; write(STORAGE.session, session); closeModals(); refreshHeader(); showToast("Account created. Welcome to HudumaLink!");
    } else {
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) { error.textContent = "Email or password is incorrect. For judging, try creating a demo account."; error.classList.remove("hidden"); return; }
      session = { name: user.name, email: user.email, role: user.role }; write(STORAGE.session, session); closeModals(); refreshHeader(); showToast(`Welcome back, ${user.name.split(" ")[0]}!`);
    }
  }
  function handleTracking(event) {
    event.preventDefault();
    const id = $("#trackingId").value.trim().toUpperCase();
    const r = requests.find(item => item.id.toUpperCase() === id && canSeeRequest(item));
    const target = $("#trackingResult");
    if (!r) { target.classList.remove("hidden"); target.innerHTML = `<div class="empty-state"><div class="empty-symbol">⌕</div><strong>We couldn't find that request</strong><p>Check the ID and try again. Example: HL-2026-0001</p></div>`; return; }
    const steps = ["Pending", "In Progress", "Resolved"];
    const current = steps.indexOf(r.status);
    target.classList.remove("hidden");
    const history = [...(r.statusHistory || [])].reverse().map(entry => `<li><span class="history-dot"></span><div><strong>${escapeHTML(entry.status)}</strong><span>${dateLabel(entry.at)} · ${escapeHTML(entry.actor || "Service team")}</span></div></li>`).join("");
    target.innerHTML = `<div class="detail-header"><div class="category-icon ${statusIcon(r.category).className}">${statusIcon(r.category).icon}</div><div><h3>${escapeHTML(r.title)}</h3><span class="tracking-id">${escapeHTML(r.id)} · Submitted ${dateLabel(r.createdAt)}</span></div></div><div style="margin-top:14px"><span class="status-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span></div><div class="tracking-progress">${steps.map((step,i) => `<div class="progress-step ${i <= current ? "done" : ""}"><strong>${escapeHTML(step)}</strong><span>${i < current ? "Completed" : i === current ? "Current status" : "Not started"}</span></div>`).join("")}</div><div class="tracking-detail-grid"><div><span>Category</span><strong>${escapeHTML(r.category)}</strong></div><div><span>Location</span><strong>${escapeHTML(r.location)}</strong></div><div><span>County / area</span><strong>${escapeHTML(r.county || "Not provided")}</strong></div><div><span>Priority</span><strong>${escapeHTML(r.priority || "Normal")}</strong></div></div><p class="detail-body">${escapeHTML(r.description)}</p><section class="status-history"><h3>Status history</h3><ol>${history}</ol></section>`;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function useDemoAdmin() {
    // Clearly disclosed demo role; production authorization must be enforced server-side.
    session = { name: "Service Administrator", email: "admin-demo@hudumalink.local", role: "admin" };
    write(STORAGE.session, session); closeModals(); refreshHeader(); setView("requests"); showToast("Demo admin mode enabled. You can update request statuses.");
  }

  document.addEventListener("click", event => {
    const go = event.target.closest("[data-go]");
    if (go) setView(go.dataset.go);
    const nav = event.target.closest("[data-view]");
    if (nav) setView(nav.dataset.view);
    const detail = event.target.closest("[data-detail-id]");
    if (detail) openDetails(detail.dataset.detailId);
    if (event.target.closest("[data-close-modal]")) closeModals();
    const tab = event.target.closest("[data-auth-tab]");
    if (tab) { authMode = tab.dataset.authTab; updateAuthMode(); $("#authError").classList.add("hidden"); }
  });
  document.addEventListener("change", event => {
    const statusControl = event.target.closest("[data-status-id]");
    if (statusControl) saveStatus(statusControl.dataset.statusId, statusControl.value);
  });
  $("#requestForm").addEventListener("submit", handleSubmitRequest);
  $("#authForm").addEventListener("submit", handleAuth);
  $("#trackingForm").addEventListener("submit", handleTracking);
  ["requestSearch", "statusFilter", "categoryFilter"].forEach(id => $(`#${id}`).addEventListener(id === "requestSearch" ? "input" : "change", renderRequests));
  $("#accountBtn").addEventListener("click", () => $("#accountPopover").classList.toggle("hidden"));
  $("#authAction").addEventListener("click", () => {
    $("#accountPopover").classList.add("hidden");
    if (session) { session = null; localStorage.removeItem(STORAGE.session); refreshHeader(); showToast("You have signed out."); }
    else openAuth("login");
  });
  $("#demoAdmin").addEventListener("click", useDemoAdmin);
  $("#helpBtn").addEventListener("click", () => showToast("Sign in → submit a report → save your tracking ID → follow its status."));
  $("#notificationBtn").addEventListener("click", () => showToast("You're all caught up. Request updates appear in your service requests list."));
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#requestImage").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { showToast("Please choose a JPG, PNG or WEBP image.", true); event.target.value = ""; return; }
    if (file.size > 2 * 1024 * 1024) { showToast("Image must be 2 MB or smaller.", true); event.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = reader.result; pendingImageName = file.name;
      $("#imagePreview").innerHTML = `<img src="${pendingImage}" alt="Selected photo preview"><span>${escapeHTML(pendingImageName)}</span><button type="button" id="removeImage" aria-label="Remove image">×</button>`;
      $("#imagePreview").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
  $("#imagePreview").addEventListener("click", event => {
    if (event.target.id === "removeImage") { pendingImage = ""; pendingImageName = ""; $("#requestImage").value = ""; $("#imagePreview").classList.add("hidden"); }
  });
  $$(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModals(); }));
  document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModals(); $("#accountPopover").classList.add("hidden"); $("#sidebar").classList.remove("open"); } });

  refreshHeader();
})();
