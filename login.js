document.getElementById("loginButton").addEventListener("click", () => {
  const userName = document.getElementById("userNameInput").value;

  if (!userName) {
    alert("おなまえを入力してね！");
    return;
  }

  // localStorage保存
  localStorage.setItem("userName", userName);

  // メイン画面へ
  location.href = "index.html";
});