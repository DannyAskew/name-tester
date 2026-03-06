// ── Storage ──

const STORAGE_KEY = "baby-name-tester";
const SLOTS = ["first", "middle", "last"];

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ familyMembers: data.familyMembers, candidates: data.candidates })
  );
}

// ── Share via URL hash ──

function importFromHash() {
  const hash = window.location.hash;
  if (!hash.startsWith("#data=")) return null;
  try {
    const b64 = hash.slice(6);
    const json = atob(b64);
    const parsed = JSON.parse(json);
    if (parsed.familyMembers && parsed.candidates) return parsed;
  } catch {}
  return null;
}

function buildShareURL() {
  const json = JSON.stringify({ familyMembers: data.familyMembers, candidates: data.candidates });
  const b64 = btoa(json);
  return `${window.location.origin}${window.location.pathname}#data=${b64}`;
}

const shared = importFromHash();
if (shared) {
  const existing = loadData();
  const shouldApply = !existing || confirm("This link contains a shared family setup. Replace your current data?");
  if (shouldApply) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shared));
  }
  // Clean the hash so it doesn't re-import on reload
  history.replaceState(null, "", window.location.pathname);
}

let data = loadData() || { familyMembers: [], candidates: { first: [], middle: [], last: [] } };

const state = { first: 0, middle: 0, last: 0 };

function getCandidates(slotKey) {
  return data.candidates[slotKey];
}

// ── Utility ──

function extractLastNames(members) {
  const lastNames = [];
  for (const fullName of members) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (!lastNames.includes(last)) lastNames.push(last);
    }
  }
  return lastNames;
}

function buildFamilyLabel() {
  const lastNames = extractLastNames(data.familyMembers);
  if (lastNames.length === 0) return "Our Family";
  if (lastNames.length === 1) return `The ${lastNames[0]} Family`;
  return `The ${lastNames.join(" & ")} Family`;
}

// ── Measure + animate ──

function measureTextWidth(text, el) {
  const measurer = document.createElement("span");
  const style = window.getComputedStyle(el);
  measurer.style.cssText = `
    position:absolute;visibility:hidden;white-space:nowrap;
    font:${style.font};letter-spacing:${style.letterSpacing};
    padding-right:${style.paddingRight};
  `;
  measurer.textContent = text;
  document.body.appendChild(measurer);
  const width = measurer.offsetWidth;
  measurer.remove();
  return width;
}

function cycle(slotKey, direction = 1) {
  const list = getCandidates(slotKey);
  if (list.length === 0) return;
  const el = document.getElementById(`${slotKey}-name`);

  state[slotKey] = (state[slotKey] + direction + list.length) % list.length;
  const newName = list[state[slotKey]];
  const newWidth = measureTextWidth(newName, el);

  el.classList.remove("swapping");
  void el.offsetWidth;
  el.classList.add("swapping");
  el.style.width = `${newWidth}px`;

  setTimeout(() => {
    el.textContent = newName;
    el.classList.remove("placeholder");
  }, 0.4 * 350);

  el.addEventListener("animationend", () => {
    el.classList.remove("swapping");
  }, { once: true });
}

function setDisplayedName(slotKey) {
  const list = getCandidates(slotKey);
  const el = document.getElementById(`${slotKey}-name`);
  if (list.length === 0) {
    el.textContent = el.dataset.placeholder;
    el.classList.add("placeholder");
    el.style.width = "";
    state[slotKey] = 0;
  } else {
    if (state[slotKey] >= list.length) state[slotKey] = list.length - 1;
    el.textContent = list[state[slotKey]];
    el.classList.remove("placeholder");
    el.style.width = `${el.scrollWidth}px`;
  }
}

// ── Family header rendering ──

const familyColors = ["#c97b9f", "#7b8fc9", "#7bb8a4", "#c9a87b", "#9f7bc9", "#7bc9b8"];

function renderFamilyHeader() {
  const label = document.getElementById("family-label");
  const container = document.getElementById("family-names");
  label.textContent = buildFamilyLabel();
  document.title = `${buildFamilyLabel()} — Baby Name Tester`;
  container.innerHTML = "";
  data.familyMembers.forEach((name, i) => {
    const span = document.createElement("span");
    span.className = "family-name";
    span.style.setProperty("--i", i);
    span.style.color = familyColors[i % familyColors.length];
    span.textContent = name;
    container.appendChild(span);
  });
  // Set baby name row animation index after family members
  const babyRow = document.getElementById("baby-name-row");
  babyRow.style.setProperty("--i", data.familyMembers.length);
}

// ── Panel: candidate pills ──

function renderPills(slotKey) {
  const container = document.getElementById(`${slotKey}-pills`);
  const list = getCandidates(slotKey);
  container.innerHTML = "";
  list.forEach((name, i) => {
    const pill = document.createElement("span");
    pill.className = "pill" + (i === state[slotKey] ? " active" : "");
    pill.textContent = name;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "\u00d7";
    remove.setAttribute("aria-label", `Remove ${name}`);
    remove.addEventListener("click", (e) => {
      e.stopPropagation();
      removeName(slotKey, i);
    });

    pill.appendChild(remove);
    container.appendChild(pill);
  });
}

function addName(slotKey, name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const list = getCandidates(slotKey);
  if (list.includes(formatted)) return;
  list.push(formatted);
  saveData();
  renderPills(slotKey);
  setDisplayedName(slotKey);
}

function removeName(slotKey, index) {
  const list = getCandidates(slotKey);
  if (list.length === 0) return;
  list.splice(index, 1);
  saveData();
  setDisplayedName(slotKey);
  renderPills(slotKey);
}

// ── Panel: family member pills ──

function renderFamilyPills() {
  const container = document.getElementById("family-pills");
  container.innerHTML = "";
  data.familyMembers.forEach((name, i) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = name;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "\u00d7";
    remove.setAttribute("aria-label", `Remove ${name}`);
    remove.addEventListener("click", (e) => {
      e.stopPropagation();
      data.familyMembers.splice(i, 1);
      saveData();
      renderFamilyPills();
      renderFamilyHeader();
      syncLastNamesFromFamily();
    });

    pill.appendChild(remove);
    container.appendChild(pill);
  });
}

function addFamilyMember(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (data.familyMembers.includes(trimmed)) return;
  data.familyMembers.push(trimmed);
  saveData();
  renderFamilyPills();
  renderFamilyHeader();
  syncLastNamesFromFamily();
}

function syncLastNamesFromFamily() {
  const extracted = extractLastNames(data.familyMembers);
  // Add any new last names from family members, but don't remove user-added ones
  for (const ln of extracted) {
    if (!data.candidates.last.includes(ln)) {
      data.candidates.last.push(ln);
    }
  }
  saveData();
  renderPills("last");
  setDisplayedName("last");
}

// ── Dropdown ──

let openDropdown = null;

function showDropdown(slotKey) {
  closeDropdown();
  const el = document.getElementById(`${slotKey}-name`);
  const list = getCandidates(slotKey);
  if (list.length === 0) return;

  const dropdown = document.createElement("div");
  dropdown.className = "name-dropdown open";
  dropdown.setAttribute("data-slot", slotKey);

  list.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.className = "name-dropdown-item" + (i === state[slotKey] ? " active" : "");
    btn.textContent = name;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (i !== state[slotKey]) {
        state[slotKey] = i;
        const newWidth = measureTextWidth(list[i], el);
        el.classList.remove("swapping");
        void el.offsetWidth;
        el.classList.add("swapping");
        el.style.width = `${newWidth}px`;
        setTimeout(() => {
          el.textContent = list[i];
          el.classList.remove("placeholder");
        }, 0.4 * 350);
        el.addEventListener("animationend", () => el.classList.remove("swapping"), { once: true });
        renderPills(slotKey);
      }
      closeDropdown();
    });
    dropdown.appendChild(btn);
  });

  document.body.appendChild(dropdown);
  openDropdown = dropdown;

  const rect = el.getBoundingClientRect();
  dropdown.style.position = "fixed";
  dropdown.style.left = `${rect.left + rect.width / 2}px`;
  dropdown.style.top = `${rect.bottom}px`;

  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

function closeDropdown() {
  if (openDropdown) {
    openDropdown.remove();
    openDropdown = null;
    document.removeEventListener("click", handleOutsideClick);
  }
}

function handleOutsideClick(e) {
  if (openDropdown && !openDropdown.contains(e.target)) {
    closeDropdown();
  }
}

// ── Setup screen ──

function addSetupRow() {
  const container = document.getElementById("setup-members");
  const row = document.createElement("div");
  row.className = "setup-member-row";
  row.innerHTML = `
    <input type="text" class="setup-input" placeholder="Full name (e.g. Jane Marie Smith)" maxlength="60" autocomplete="off" />
    <button class="setup-remove" aria-label="Remove" type="button">&times;</button>
  `;
  container.appendChild(row);
  row.querySelector("input").focus();
}

function initSetup() {
  const screen = document.getElementById("setup-screen");
  const addBtn = document.getElementById("setup-add");
  const doneBtn = document.getElementById("setup-done");

  addBtn.addEventListener("click", addSetupRow);

  // Delegate remove buttons
  screen.addEventListener("click", (e) => {
    if (e.target.classList.contains("setup-remove")) {
      const row = e.target.closest(".setup-member-row");
      const rows = screen.querySelectorAll(".setup-member-row");
      if (rows.length > 1) {
        row.remove();
      } else {
        row.querySelector("input").value = "";
      }
    }
  });

  doneBtn.addEventListener("click", () => {
    const inputs = screen.querySelectorAll(".setup-input");
    const members = [];
    inputs.forEach((input) => {
      const val = input.value.trim();
      if (val) members.push(val);
    });

    if (members.length === 0) return;

    data.familyMembers = members;
    data.candidates.last = extractLastNames(members);
    saveData();
    screen.classList.add("hidden");
    showApp();
  });
}

// ── App init ──

function showApp() {
  document.getElementById("top-bar").classList.remove("hidden");
  document.getElementById("app").classList.remove("hidden");

  renderFamilyHeader();
  SLOTS.forEach((slot) => setDisplayedName(slot));

  // Click name to open dropdown
  document.querySelectorAll(".name-part").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const slot = el.dataset.slot;
      if (openDropdown && openDropdown.getAttribute("data-slot") === slot) {
        closeDropdown();
      } else {
        showDropdown(slot);
      }
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showDropdown(el.dataset.slot);
      }
    });
  });

  // Chevron clicks
  document.querySelectorAll(".chevron").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      cycle(btn.dataset.slot, parseInt(btn.dataset.dir));
    });
  });

  // Swipe gestures on name slots for touch devices
  document.querySelectorAll(".name-slot").forEach((slot) => {
    let startY = 0;
    let swiped = false;
    slot.addEventListener("touchstart", (e) => {
      startY = e.touches[0].clientY;
      swiped = false;
    }, { passive: true });
    slot.addEventListener("touchmove", (e) => {
      const diff = Math.abs(e.touches[0].clientY - startY);
      if (diff > 10) swiped = true;
    }, { passive: true });
    slot.addEventListener("touchend", (e) => {
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;
      const slotKey = slot.querySelector(".name-part").dataset.slot;
      if (Math.abs(diff) > 30) {
        swiped = true;
        cycle(slotKey, diff > 0 ? 1 : -1);
      }
      if (swiped) {
        e.preventDefault();
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.classList.contains("name-part")) return;
    if (e.key === "ArrowUp") cycle("first", -1);
    if (e.key === "ArrowDown") cycle("first", 1);
    if (e.key === "ArrowLeft") cycle("middle", -1);
    if (e.key === "ArrowRight") cycle("middle", 1);
  });

  // Toggle panel
  const toggle = document.getElementById("manage-toggle");
  const panel = document.getElementById("manage-panel");
  const shareBtn = document.getElementById("share-btn");

  function openPanel() {
    panel.classList.remove("hidden");
    toggle.classList.add("active");
    toggle.textContent = "done";
    shareBtn.classList.add("hidden");
  }

  function closePanel() {
    panel.classList.add("hidden");
    toggle.classList.remove("active");
    toggle.textContent = "edit names";
    shareBtn.classList.remove("hidden");
  }

  toggle.addEventListener("click", () => {
    if (panel.classList.contains("hidden")) {
      openPanel();
    } else {
      closePanel();
    }
  });

  // Share button
  shareBtn.addEventListener("click", async () => {
    const url = buildShareURL();
    try {
      await navigator.clipboard.writeText(url);
      shareBtn.textContent = "copied!";
    } catch {
      shareBtn.textContent = "error";
    }
    setTimeout(() => { shareBtn.textContent = "share"; }, 2000);
  });

  // Render initial pills
  renderFamilyPills();
  SLOTS.forEach((slot) => renderPills(slot));

  // Add name forms (candidates + family)
  document.querySelectorAll(".add-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const list = form.dataset.list;
      if (list === "family") {
        addFamilyMember(input.value);
      } else {
        addName(list, input.value);
      }
      input.value = "";
    });
  });
}

function init() {
  if (data.familyMembers.length > 0) {
    document.getElementById("setup-screen").classList.add("hidden");
    showApp();
  } else {
    initSetup();
  }
}

init();
