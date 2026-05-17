import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ユーザー名取得
const USER_NAME = localStorage.getItem("userName");
if (!USER_NAME) {
  location.href = "login.html";
} else {
  document.getElementById("displayUserName").textContent = USER_NAME;
}

// 未ログインなら login.html へ
if (!USER_NAME) {
  location.href = "login.html";
}

// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyA8N8eirqPZKiXt_8fci4YNgZ1jWn6VzQk",
    authDomain: "nekozukai-app.firebaseapp.com",
    projectId: "nekozukai-app",
    storageBucket: "nekozukai-app.firebasestorage.app",
    messagingSenderId: "576408918204",
    appId: "1:576408918204:web:2369690f00998f965a98b9",
    measurementId: "G-1X23TL9YL6"
  };

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 削除対象のドキュメントIDを一時保存する変数を定義
let selectedDocId = null;

// 現在選択されている年月を保持する変数（初期値は空）
let currentSelectedMonth = "";

// 残高と履歴を読み込み
async function loadData() {
  const q = query(collection(db, "history"), 
    where("userName", "==", USER_NAME));
  const snapshot = await getDocs(q);
  let balance = 0;
  const historyArea = document.getElementById("historyArea");
  historyArea.innerHTML = "";

  const availableMonths = new Set();

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.delFlg === 1) return;

    balance += data.amount;

    const dateObj = data.createDate.toDate();
    const yearMonthStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月`;
    
    availableMonths.add(yearMonthStr);
  });

  document.getElementById("balanceMoney").textContent = balance.toLocaleString() + "円";

  const monthSelector = document.getElementById("monthSelector");
  const previousSelection = monthSelector.value;
  monthSelector.innerHTML = "";

  const sortedMonths = Array.from(availableMonths).sort((a, b) => b.localeCompare(a, 'ja', {numeric: true}));

  if (sortedMonths.length === 0) {
    const now = new Date();
    sortedMonths.push(`${now.getFullYear()}年${now.getMonth() + 1}月`);
  }

  sortedMonths.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthSelector.appendChild(option);
  });

  if (sortedMonths.includes(previousSelection)) {
    monthSelector.value = previousSelection;
  } else {
    monthSelector.value = sortedMonths[0];
  }
  
  currentSelectedMonth = monthSelector.value;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const docId = docSnap.id;

    if (data.delFlg === 1) return;

    const dateObj = data.createDate.toDate();
    const yearMonthStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月`;

    if (yearMonthStr !== currentSelectedMonth) return;

    const item = document.createElement("div");
    item.classList.add("history-item");

    if (data.amount >= 0) {
      item.classList.add("plus");
    } else {
      item.classList.add("minus");
    }

    item.innerHTML = `
      <div class="history-top">
        <span>${data.memo}</span>
        <span>${data.amount}円</span>
      </div>
      <div class="history-date">
        ${dateObj.toLocaleString()}
      </div>
    `;

    item.addEventListener("click", () => {
      selectedDocId = docId;
      document.getElementById("deleteModal").style.display = "flex";
    });

    historyArea.appendChild(item);
  });
}

document.getElementById("monthSelector").addEventListener("change", (e) => {
  currentSelectedMonth = e.target.value;
  loadData();
});

// ==========================================
// モーダル制御ロジック
// ==========================================
const modal = document.getElementById("inputModal");
const toggleUse = document.getElementById("toggleUse");
const toggleGet = document.getElementById("toggleGet");
const inputMoney = document.getElementById("inputMoney");
const inputMemo = document.getElementById("inputMemo");
const submitBtn = document.getElementById("submitBtn");
const closeBtn = document.getElementById("closeBtn");

let currentMode = "use";

function openModal(mode) {
  currentMode = mode;
  inputMoney.value = "";
  inputMemo.value = "";
  updateToggleVisuals();
  modal.style.display = "flex";
}

function updateToggleVisuals() {
  if (currentMode === "use") {
    toggleUse.classList.remove("inactive");
    toggleGet.classList.add("inactive");
  } else {
    toggleGet.classList.remove("inactive");
    toggleUse.classList.add("inactive");
  }
}

toggleUse.addEventListener("click", () => {
  currentMode = "use";
  updateToggleVisuals();
});

toggleGet.addEventListener("click", () => {
  currentMode = "get";
  updateToggleVisuals();
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

submitBtn.addEventListener("click", async () => {
  const money = Number(inputMoney.value);
  const memo = inputMemo.value;

  if (!money || money <= 0) {
    alert("正しい金額を入力してください");
    return;
  }

  const amount = currentMode === "use" ? -money : money;
  submitBtn.disabled = true;

  try {
    await addDoc(collection(db, "history"), {
      userName: USER_NAME,
      amount: amount,
      memo: memo,
      createDate: new Date(),
      delFlg: 0
    });

    modal.style.display = "none";
    loadData();
  } catch (error) {
    console.error("保存エラー: ", error);
    alert("エラーが発生しました。");
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("useButton").addEventListener("click", () => {
  openModal("use");
});

document.getElementById("getButton").addEventListener("click", () => {
  openModal("get");
});

// ==========================================
// 履歴モーダル・削除モーダルの制御
// ==========================================
const historyModal = document.getElementById("historyModal");
const deleteModal = document.getElementById("deleteModal");

document.getElementById("historyOpenBtn").addEventListener("click", () => {
  historyModal.style.display = "flex";
});

document.getElementById("historyCloseBtn").addEventListener("click", () => {
  historyModal.style.display = "none";
});

document.getElementById("deleteCancelBtn").addEventListener("click", () => {
  deleteModal.style.display = "none";
  selectedDocId = null;
});

document.getElementById("deleteConfirmBtn").addEventListener("click", async () => {
  if (!selectedDocId) return;

  try {
    const docRef = doc(db, "history", selectedDocId);
    await updateDoc(docRef, {
      delFlg: 1
    });

    deleteModal.style.display = "none";
    selectedDocId = null;
    loadData(); 
  } catch (error) {
    console.error("削除エラー: ", error);
    alert("削除に失敗しました。");
  }
});

// ==========================================
// ログアウトモーダルの制御
// ==========================================
const logoutModal = document.getElementById("logoutModal");

document.getElementById("logoutTrigger").addEventListener("click", () => {
  logoutModal.style.display = "flex";
});

document.getElementById("logoutCancelBtn").addEventListener("click", () => {
  logoutModal.style.display = "none";
});

document.getElementById("logoutConfirmBtn").addEventListener("click", () => {
  localStorage.removeItem("userName");
  location.href = "login.html";
});

// 初期読み込み
loadData();