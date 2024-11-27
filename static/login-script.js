const formEl = document.getElementById("submitForm");
let timeOut;

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailEl = document.getElementById("email");
  const emailErrEl = document.getElementById("emailErr");
  const passwordEl = document.getElementById("password");
  const passwordErrEl = document.getElementById("passwordErr");

  if (timeOut) {
    clearTimeout(timeOut);
    emailErrEl.innerText = "";
    passwordErrEl.innerText = "";
  }

  const errObj = {};

  if (emailEl.value) {
    const emailRegex = new RegExp(
      "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    const emailErr = emailRegex.test(emailEl.value);
    if (!emailErr) {
      errObj.email = "Email is not valid";
    }
  } else {
    errObj.email = "Email is required";
  }

  if (passwordEl.value) {
    if (passwordEl.value.length < 6) {
      errObj.password = "Password must be at least 6 characters long";
    }
  } else {
    errObj.password = "Password is required";
  }

  if (Object.keys(errObj).length > 0) {
    for (const [key, value] of Object.entries(errObj)) {
      if (key === "email") {
        emailErrEl.innerText = value;
      } else {
        passwordErrEl.innerText = value;
      }
    }
    timeOut = setTimeout(() => {
      emailErrEl.innerText = "";
      passwordErrEl.innerText = "";
    }, 1500);

    return;
  }

  const data = {
    email: emailEl.value,
    password: passwordEl.value,
  };

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data)
    });

    const result = await response.json();

    if (result.success) {
      // Redirect tới main page
      window.location.href = result.redirect_url;
    } else {
      // Hiển thị error message
      emailErrEl.innerText = result.error;
      timeOut = setTimeout(() => {
        emailErrEl.innerText = "";
      }, 1500);
    }
  } catch (error) {
    console.error("Login error:", error);
    emailErrEl.innerText = "Login failed. Please try again.";
    timeOut = setTimeout(() => {
      emailErrEl.innerText = "";
    }, 1500);
  }
});