let currentData = null;

function randomKg(max) {
  const min = 1;
  const step = 0.1;

  const upper = Math.min(25, max);
  if (upper < min) return 0;

  const steps = Math.floor((upper - min) / step);
  const value = min + Math.floor(Math.random() * (steps + 1)) * step;

  return +value.toFixed(1);
}

function parseMoney(str) {
  return Number(str.replace(/[^\d]/g, ""));
}

function formatMoneyInput(input) {
  let value = input.value.replace(/[^\d]/g, "");
  input.value = value ? Number(value).toLocaleString("vi-VN") : "";
}

function generate() {
  const prices = document
    .getElementById("pricesInput")
    .value.split(",")
    .map((p) => +p.trim())
    .filter(Boolean);

  const targetMoney = parseMoney(document.getElementById("targetMoney").value);
  const targetKg = +document.getElementById("targetKg").value;

  if (!prices.length || !targetMoney || !targetKg) {
    alert("Vui lòng nhập giá, tổng tiền và tổng kg");
    return;
  }

  const priceRow = document.getElementById("priceRow");
  const orderRows = document.getElementById("orderRows");
  const totalRow = document.getElementById("totalRow");

  priceRow.innerHTML = "";
  orderRows.innerHTML = "";
  totalRow.innerHTML = "";

  let moneyLeft = targetMoney;
  let kgLeft = targetKg;

  let totalDayMoney = 0;
  let totalDayKg = 0;

  const moneyPerColumn = targetMoney / prices.length;
  const kgPerColumn = targetKg / prices.length;

  currentData = [];

  prices.forEach((price, index) => {
    const isLastColumn = index === prices.length - 1;

    const th = document.createElement("th");
    th.textContent = `${price}k`;
    priceRow.appendChild(th);

    const td = document.createElement("td");

    let columnMoney = 0;
    let columnKg = 0;
    let orders = [];

    while (true) {
      // ❌ không đủ để tạo 1 đơn tối thiểu
      if (kgLeft < 1) break;
      if (moneyLeft < price * 1000) break;

      let maxKg = Math.min(25, kgLeft, kgPerColumn - columnKg);

      if (maxKg < 1) break;

      let kg = randomKg(maxKg);
      let money = kg * price * 1000;

      // CỘT CUỐI → cân sát phần còn lại
      if (isLastColumn && money > moneyLeft) {
        let possibleKg = Math.floor((moneyLeft / (price * 1000)) * 10) / 10;

        possibleKg = Math.min(25, possibleKg);

        if (possibleKg < 1) break;

        kg = +possibleKg.toFixed(1);
        money = kg * price * 1000;
      }

      const columnLimit = isLastColumn ? moneyLeft : moneyPerColumn * 1.1;

      if (columnMoney + money > columnLimit) break;

      orders.push(kg);
      columnKg += kg;
      columnMoney += money;

      totalDayKg += kg;
      totalDayMoney += money;

      kgLeft -= kg;
      moneyLeft -= money;
    }

    td.innerHTML =
      renderOrders(orders, price) + `<hr><b>${columnKg.toFixed(1)} kg</b>`;

    orderRows.appendChild(td);

    const tdTotal = document.createElement("td");
    tdTotal.textContent = columnMoney.toLocaleString() + " đ";
    totalRow.appendChild(tdTotal);

    currentData.push({ price, orders });
  });

  document.getElementById("totalKg").textContent = totalDayKg.toFixed(1);
  document.getElementById("totalMoney").textContent =
    totalDayMoney.toLocaleString();
}

function renderOrders(orders, price) {
  return orders
    .map(
      (kg) =>
        `<input
          type="number"
          step="0.1"
          min="1"
          max="25"
          value="${kg}"
          data-price="${price}"
          class="order-input"
          oninput="recalculate(this)"
        />`,
    )
    .join("<br>");
}

function recalculate(changedInput) {
  /** ===== CẬP NHẬT CỘT HIỆN TẠI ===== */
  const td = changedInput.closest("td");
  const columnIndex = Array.from(td.parentNode.children).indexOf(td);

  let columnKg = 0;
  let columnMoney = 0;

  td.querySelectorAll("input[data-price]").forEach((input) => {
    let kg = +input.value || 0;

    // khóa cứng 1 → 25
    if (kg < 1) kg = 1;
    if (kg > 25) kg = 25;

    input.value = kg.toFixed(1);

    const price = +input.dataset.price;
    columnKg += kg;
    columnMoney += kg * price * 1000;
  });

  // cập nhật tổng kg trong cột
  const kgSummary = td.querySelector("b");
  if (kgSummary) {
    kgSummary.textContent = `${columnKg.toFixed(1)} kg`;
  }

  // cập nhật tiền cột ở footer
  const totalRow = document.getElementById("totalRow");
  if (totalRow.children[columnIndex]) {
    totalRow.children[columnIndex].textContent =
      columnMoney.toLocaleString() + " đ";
  }

  /** ===== CẬP NHẬT TỔNG TOÀN BẢNG ===== */
  let totalKg = 0;
  let totalMoney = 0;

  document.querySelectorAll("input[data-price]").forEach((input) => {
    const kg = +input.value || 0;
    const price = +input.dataset.price;

    totalKg += kg;
    totalMoney += kg * price * 1000;
  });

  document.getElementById("totalKg").textContent = totalKg.toFixed(1);
  document.getElementById("totalMoney").textContent =
    totalMoney.toLocaleString();
}

function saveDay() {
  const date = document.getElementById("dateInput").value;
  if (!date || !currentData) return alert("Chưa có dữ liệu");

  const data = JSON.parse(localStorage.getItem("dailyOrders") || "{}");
  data[date] = currentData;

  localStorage.setItem("dailyOrders", JSON.stringify(data));
  alert("Đã lưu dữ liệu ngày " + date);
}

function loadSavedDays() {
  const data = JSON.parse(localStorage.getItem("dailyOrders") || "{}");
  const select = document.getElementById("savedDays");

  select.innerHTML = `<option value="">-- Xem ngày đã lưu --</option>`;

  Object.keys(data).forEach((date) => {
    select.innerHTML += `<option value="${date}">${date}</option>`;
  });
}

function loadDay(date) {
  if (!date) return;

  const data = JSON.parse(localStorage.getItem("dailyOrders"));
  currentData = data[date];

  const priceRow = document.getElementById("priceRow");
  const orderRows = document.getElementById("orderRows");
  const totalRow = document.getElementById("totalRow");

  priceRow.innerHTML = "";
  orderRows.innerHTML = "";
  totalRow.innerHTML = "";

  let totalKg = 0;
  let totalMoney = 0;

  currentData.forEach(({ price, orders }) => {
    const th = document.createElement("th");
    th.textContent = `${price}k`;
    priceRow.appendChild(th);

    const td = document.createElement("td");
    td.innerHTML =
      renderOrders(orders, price) +
      `<hr><b>${orders.reduce((a, b) => a + b, 0).toFixed(1)} kg</b>`;
    orderRows.appendChild(td);

    const colMoney = orders.reduce((s, kg) => s + kg * price * 1000, 0);

    const tdTotal = document.createElement("td");
    tdTotal.textContent = colMoney.toLocaleString() + " đ";
    totalRow.appendChild(tdTotal);

    totalKg += orders.reduce((a, b) => a + b, 0);
    totalMoney += colMoney;
  });

  document.getElementById("totalKg").textContent = totalKg.toFixed(1);
  document.getElementById("totalMoney").textContent =
    totalMoney.toLocaleString();
}

// set ngày mặc định = hôm nay
window.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("dateInput").value = today;
  loadSavedDays();
});

function onDateChange() {
  const date = document.getElementById("dateInput").value;
  if (!date) return;

  const data = JSON.parse(localStorage.getItem("dailyOrders") || "{}");

  if (data[date]) {
    // đã có dữ liệu → load để chỉnh
    currentData = data[date];
    renderFromData(currentData);
  } else {
    // ngày mới → reset để nhập lượng mới
    clearTable();
    currentData = null;

    document.getElementById("totalKg").textContent = "0";
    document.getElementById("totalMoney").textContent = "0";
  }
}

function renderFromData(data) {
  const priceRow = document.getElementById("priceRow");
  const orderRows = document.getElementById("orderRows");
  const totalRow = document.getElementById("totalRow");

  priceRow.innerHTML = "";
  orderRows.innerHTML = "";
  totalRow.innerHTML = "";

  let totalKg = 0;
  let totalMoney = 0;

  data.forEach(({ price, orders }) => {
    const th = document.createElement("th");
    th.textContent = `${price}k`;
    priceRow.appendChild(th);

    const td = document.createElement("td");
    td.innerHTML =
      renderOrders(orders, price) +
      `<hr><b>${orders.reduce((a, b) => a + b, 0).toFixed(1)} kg</b>`;
    orderRows.appendChild(td);

    const colMoney = orders.reduce((s, kg) => s + kg * price * 1000, 0);

    const tdTotal = document.createElement("td");
    tdTotal.textContent = colMoney.toLocaleString() + " đ";
    totalRow.appendChild(tdTotal);

    totalKg += orders.reduce((a, b) => a + b, 0);
    totalMoney += colMoney;
  });

  document.getElementById("totalKg").textContent = totalKg.toFixed(1);
  document.getElementById("totalMoney").textContent =
    totalMoney.toLocaleString();
}

function clearTable() {
  document.getElementById("priceRow").innerHTML = "";
  document.getElementById("orderRows").innerHTML = "";
  document.getElementById("totalRow").innerHTML = "";
}

function renderSavedDays() {
  const select = document.getElementById("savedDays");
  select.innerHTML = `<option value="">-- Xem ngày đã lưu --</option>`;

  const days = Object.keys(localStorage)
    .filter((k) => k.startsWith("order_"))
    .sort((a, b) => b.localeCompare(a)); // DESC

  days.forEach((key) => {
    const date = key.replace("order_", "");
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    select.appendChild(option);
  });
}

function exportImage() {
  const table = document.querySelector(".table-wrapper");
  if (!table) return alert("Chưa có dữ liệu");

  const totalKg = document.getElementById("totalKg").textContent;
  const totalMoney = document.getElementById("totalMoney").textContent;
  const date = document.getElementById("dateInput").value;

  // container tạm để chụp
  const wrapper = document.createElement("div");
  wrapper.style.padding = "24px";
  wrapper.style.background = "#ffffff";
  wrapper.style.width = "fit-content";
  wrapper.style.fontFamily = "Segoe UI, sans-serif";

  wrapper.innerHTML = `
    <h2 style="margin:0 0 8px;color:#0f766e">
      ĐƠN HÀNG TRONG NGÀY
    </h2>
    <div style="margin-bottom:12px;color:#555">
      Ngày: <b>${date}</b>
    </div>

    <div style="
      display:flex;
      gap:32px;
      margin-bottom:16px;
      font-size:16px;
    ">
      <div>Tổng ký: <b style="color:#0f766e">${totalKg} kg</b></div>
      <div>Tổng tiền: <b style="color:#0f766e">${totalMoney} đ</b></div>
    </div>
  `;

  // clone bảng để không ảnh hưởng UI thật
  const tableClone = table.cloneNode(true);
  wrapper.appendChild(tableClone);

  document.body.appendChild(wrapper);

  html2canvas(wrapper, {
    scale: 3, // 👈 QUAN TRỌNG: tăng size ảnh
    backgroundColor: "#ffffff",
    useCORS: true,
  }).then((canvas) => {
    const link = document.createElement("a");
    link.download = `don-hang-${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    document.body.removeChild(wrapper);
  });
}

function exportCSV() {
  if (!currentData) return alert("Chưa có dữ liệu");

  let rows = [];
  rows.push(["Giá (k)", "Số kg", "Thành tiền"]);

  currentData.forEach(({ price, orders }) => {
    orders.forEach((kg) => {
      rows.push([price, kg, kg * price * 1000]);
    });
  });

  rows.push([]);
  rows.push([
    "TỔNG",
    document.getElementById("totalKg").textContent,
    document.getElementById("totalMoney").textContent,
  ]);

  const csv = rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `don-hang-${document.getElementById("dateInput").value}.csv`;
  link.click();
}
