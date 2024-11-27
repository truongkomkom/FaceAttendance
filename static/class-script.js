const avatarEl = document.getElementById("avatar");
const currDateEl = document.getElementById("currDate");

const mornContainerEl = document.getElementById("mornContainer");
const mornListEl = document.getElementById("mornList");
let mornTimeout;

const afterContainerEl = document.getElementById("afterContainer");
const afterListEl = document.getElementById("afterList");
let afterTimeout;

const nightContainerEl = document.getElementById("nightContainer");
const nightListEl = document.getElementById("nightList");
let nightTimeout;

const timeCardEls = document.getElementsByClassName("time-card");
const timeCardArr = Array.from(timeCardEls);

timeCardArr.forEach((element, id) => {
  if (id + 1 > Math.ceil(timeCardArr.length / 2)) {
    element.style.setProperty("--radius-r", "5px");
  } else {
    element.style.setProperty("--radius-l", "5px");
  }
});

avatarEl.style.backgroundImage = `url(${avatarEl.dataset.bgImage})`;

const today = new Date();
currDateEl.textContent = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

function createClassLink(id, title, details) {
  return `
    <div class="cursor-pointer relative new-element" onclick="navigateToClassDetail(${id})">
      <div
        class="bg-black0f p-[4px] border-[2px] rounded-[5px] hover:border-[#0C76E0] transition-all duration-[0.15s] ease-in"
      >
        <h3 class="font-bold text-[18px] leading-[22px]">${title}</h3>
        <div class="text-[14px] text-redff0">${details}</div>
      </div>
      <div class="absolute inset-0 bg-whitef1 z-[-1] rounded-[5px]"></div>
    </div>`;
}

// Hàm điều hướng đến trang chi tiết lớp học
function navigateToClassDetail(id) {
  window.location.href = `/classDetail/${id}`;
}

// Morning section
mornContainerEl.addEventListener("mouseenter", () => {
  mornContainerEl.classList.add("z-[10]");
  mornTimeout = setTimeout(() => {
    mornListEl.insertAdjacentHTML(
      "beforeend",
      createClassLink(
        1,
        "(1,2,3) - Phát triển ứng dụng - GV: Nguyễn Thị Liệu",
        "(F302. Lý thuyết - Nhà F - TH Công nghệ - 1. BIÊN HÒA)"
      )
    );
    mornListEl.insertAdjacentHTML(
      "beforeend",
      createClassLink(
        2,
        "(4,5,6) - Phát triển ứng dụng - GV: Nguyễn Thị Liệu",
        "(F302. Lý thuyết - Nhà F - TH Công nghệ - 1. BIÊN HÒA)"
      )
    );
  }, 400);
});

mornContainerEl.addEventListener("mouseleave", () => {
  clearTimeout(mornTimeout);
  mornListEl.innerHTML = "";
  setTimeout(() => {
    mornContainerEl.classList.remove("z-[10]");
  }, 300);
});

// Afternoon section
afterContainerEl.addEventListener("mouseenter", () => {
  afterContainerEl.classList.add("z-[10]");
  afterTimeout = setTimeout(() => {
    afterListEl.insertAdjacentHTML(
      "beforeend",
      createClassLink(
        3,
        "(7,8,9) - Phát triển ứng dụng - GV: Nguyễn Thị Liệu",
        "(F302. Lý thuyết - Nhà F - TH Công nghệ - 1. BIÊN HÒA)"
      )
    );
  }, 400);
});

afterContainerEl.addEventListener("mouseleave", () => {
  clearTimeout(afterTimeout);
  afterListEl.innerHTML = "";
  setTimeout(() => {
    afterContainerEl.classList.remove("z-[10]");
  }, 300);
});

// Night section
nightContainerEl.addEventListener("mouseenter", () => {
  nightContainerEl.classList.add("z-[10]");
  nightTimeout = setTimeout(() => {
    nightListEl.insertAdjacentHTML(
      "beforeend",
      createClassLink(
        4,
        "(13,14,15,16) - Phát triển ứng dụng - GV: Nguyễn Thị Liệu",
        "(F302. Lý thuyết - Nhà F - TH Công nghệ - 1. BIÊN HÒA)"
      )
    );
  }, 400);
});

nightContainerEl.addEventListener("mouseleave", () => {
  clearTimeout(nightTimeout);
  nightListEl.innerHTML = "";
  setTimeout(() => {
    nightContainerEl.classList.remove("z-[10]");
  }, 300);
});
