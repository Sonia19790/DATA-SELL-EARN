/* ========= Utilities: user store in localStorage =========
   Structure:
   users = {
     username: {
       pass: "pwd",
       balance: 0,
       history: [{date, desc, amount}],
       sellCount: { "Mon Jan 01 2025": 2, ... },
       referrals: { count: 0, earned: 0 }
     }
   }
   currentUser = "username"
=========================================================== */

const REF_BONUS = 40;
const SELL_AMOUNT = 500;
const SELL_LIMIT_PER_DAY = 4;

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}
function setUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function getCurrentUsername() {
  return localStorage.getItem("currentUser") || null;
}
function getCurrentUser() {
  const u = getCurrentUsername();
  const users = getUsers();
  return u ? users[u] : null;
}
function setCurrentUser(username) {
  localStorage.setItem("currentUser", username);
}

/* ======== Page bootstrap ======== */
window.addEventListener("load", () => {
  // If on dashboard
  const balEl = document.getElementById("balance");
  if (balEl) {
    const user = getCurrentUser();
    if (!user) {
      // not logged in
      window.location.href = "login.html";
      return;
    }
    // Welcome + balance
    document.getElementById("welcome-user").innerText = "Hi, " + getCurrentUsername();
    balEl.innerText = "₹" + (user.balance || 0);

    // History
    const table = document.getElementById("history-table");
    (user.history || []).forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.date}</td><td>${row.desc}</td><td>₹${row.amount}</td>`;
      table.appendChild(tr);
    });

    // Sell usage today
    const today = new Date().toDateString();
    const used = (user.sellCount && user.sellCount[today]) ? user.sellCount[today] : 0;
    const btn = document.getElementById("sell-btn");
    const note = document.getElementById("sell-usage-note");
    note.textContent = `Today's sells: ${used}/${SELL_LIMIT_PER_DAY}`;
    if (used >= SELL_LIMIT_PER_DAY) btn.disabled = true;

    // Referral link & stats
    const link = location.origin + location.pathname.replace(/index\.html$/i, "") + "signup.html?ref=" + encodeURIComponent(getCurrentUsername());
    document.getElementById("ref-link").value = link;

    const stats = user.referrals || {count:0, earned:0};
    document.getElementById("ref-stats").textContent =
      `You have earned ₹${stats.earned || 0} from ${stats.count || 0} referrals.`;
  }
});

/* ======== Auth ======== */
function signup() {
  const user = document.getElementById("signup-username").value.trim();
  const pass = document.getElementById("signup-password").value;

  if (!user || !pass) return alert("Enter all fields");
  const users = getUsers();
  if (users[user]) return alert("Username already exists");

  // new user object with signup bonus ₹50
  users[user] = {
    pass,
    balance: 50,
    history: [{ date: "Today", desc: "Signup Bonus", amount: 50 }],
    sellCount: {},
    referrals: { count: 0, earned: 0 }
  };

  // Handle referral (?ref=USERNAME)
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (ref && users[ref]) {
    // credit referrer
    users[ref].balance = (users[ref].balance || 0) + REF_BONUS;
    users[ref].history = users[ref].history || [];
    users[ref].history.unshift({ date: "Today", desc: `Referral bonus from ${user}`, amount: REF_BONUS });
    users[ref].referrals = users[ref].referrals || { count: 0, earned: 0 };
    users[ref].referrals.count += 1;
    users[ref].referrals.earned += REF_BONUS;
  }

  setUsers(users);
  setCurrentUser(user);
  alert("Signup successful! Bonus ₹50 added.");
  window.location.href = "index.html";
}

function login() {
  const user = document.getElementById("login-username").value.trim();
  const pass = document.getElementById("login-password").value;
  const users = getUsers();

  if (users[user] && users[user].pass === pass) {
    setCurrentUser(user);
    window.location.href = "index.html";
  } else {
    alert("Invalid credentials");
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

/* ======== Core actions ======== */
function sellData() {
  const username = getCurrentUsername();
  const users = getUsers();
  const u = users[username];
  if (!u) return alert("Please login again.");

  const today = new Date().toDateString();
  if (!u.sellCount) u.sellCount = {};
  if (!u.sellCount[today]) u.sellCount[today] = 0;

  if (u.sellCount[today] >= SELL_LIMIT_PER_DAY) {
    alert("Daily sell limit reached! (4 times only)");
    return;
  }

  // credit sell
  u.balance = (u.balance || 0) + SELL_AMOUNT;
  u.history = u.history || [];
  u.history.unshift({ date: "Today", desc: "200MB Sold", amount: SELL_AMOUNT });
  u.sellCount[today] += 1;

  users[username] = u;
  setUsers(users);

  // refresh UI
  location.reload();
}

/* ======== Refer UI helper ======== */
function copyRefLink() {
  const el = document.getElementById("ref-link");
  el.select();
  el.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("Referral link copied!");
}
