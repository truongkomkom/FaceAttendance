const currentPath = window.location.pathname;
console.log(currentPath);

const homeEl = document.getElementById("home");
const classEl = document.getElementById("class");

if (currentPath.includes("main")) {
  classEl.classList.add("not-active");
  homeEl.classList.add("active");
} else if (currentPath.includes("class")) {
  homeEl.classList.add("not-active");
  classEl.classList.add("active");
}
