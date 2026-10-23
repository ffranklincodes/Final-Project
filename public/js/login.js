const password = document.getElementById("password");
const togglePword = document.getElementById("toggle-password");

function togglePassword() {
    if (password.type === "password") {
        password.type = "text";
        togglePword.innerHTML = "HIDE";

    }

    else {
        password.type = "password";
        togglePword.innerHTML = "SHOW";
    }
}

password.addEventListener("input", function() {

    if (password.value.length > 0) {
        togglePword.style.display = "block";
    }
    else {
        togglePword.style.display = "none";
    }

});