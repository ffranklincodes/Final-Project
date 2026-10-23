const strandPopup = document.getElementById("strand_popup_container");
const yearLevelPopup = document.getElementById("year_level_popup_container");
const strand_selected = document.getElementById("strand_selected");
const year_level_selected = document.getElementById("year_level_selected");
const miniPopup = document. getElementById("mini_popup_container");
const userDetails = document.getElementById("user_details");
const addQuestionOptions = document.getElementById("add_question_options");
const actionButtons = document.querySelectorAll('.action_button');
const editButton = document.querySelectorAll(".edit_question");
const removeButton = document.querySelectorAll(".remove_question_check_boxes")
const message = document.getElementById("message");



function openPopup(popup) {
    popup.style.display = "block";
}

function closePopup (popup) {
    popup.style.display = "none";
}

if (message) {
    message.addEventListener("click", function (event) {
        if (event.target === message) {
            closePopup(message);
        }
    });
}

if (userDetails) {
    userDetails.addEventListener("click", function (event) {
        if (event.target === userDetails) {
            closePopup(userDetails);
        }
    });
}

if (miniPopup) {
    miniPopup.addEventListener("click", function (event) {
        if (event.target === miniPopup) {
            closePopup(miniPopup);
        }
    });
}

if (strandPopup) { 
    strandPopup.addEventListener("click", function(event) {
        if (event.target === strandPopup) {
            closePopup(strandPopup);
        }
    });
}

if (yearLevelPopup) {
    yearLevelPopup.addEventListener("click", function(event) {
        if (event.target === yearLevelPopup) {
            closePopup(yearLevelPopup);
        }
    });
}

if (addQuestionOptions) {
    addQuestionOptions.addEventListener("click", function(event) {
        if (event.target === addQuestionOptions) {
            closePopup(addQuestionOptions);
        }
    });
}

const strand_headings = document.querySelectorAll(".strand_heading");

strand_headings.forEach(function(button) {
    button.addEventListener("click", function () {
        const children = this.nextElementSibling;
        const arrow = this.querySelector("span");

        children.classList.toggle("hidden");

        if (children.classList.contains("hidden")) {
            arrow.textContent = "▶";
        }
        else {
            arrow.textContent = "▼";
        }
    });
});


function updateButtonText(name, btn_namme) {

    const selected = document.querySelector(`input[name="${name}"]:checked`);
    if (selected) {
        document.getElementById(btn_namme).textContent = selected.parentElement.textContent;
    }

    if (name == "strand") {
        closePopup(strandPopup);
    }

    else if (name == "year_level") {
        closePopup(yearLevelPopup);
    }
}


actionButtons.forEach(function (button) {
    button.addEventListener("click", function() {

        const options = button.nextElementSibling;

        document.querySelectorAll(".question_actions_options").forEach(function(menu) {
            if (menu !== options) {
                menu.classList.remove("show");
            }
        });


        options.classList.toggle("show");
    });
});


editButton.forEach(function (button) {
    button.addEventListener("click", function () {
        const questionId = button.dataset.questionId;
        const courseId = button.dataset.courseId;
        const userEditing = button.dataset.userEditing;
        const authorId = button.dataset.authorId;
        const urlParams = new URLSearchParams(window.location.search);
        let taskId = "";
        let includeTaskId = "";

        if (userEditing == "teacher") {
            taskId = urlParams.get("task_id");

            if (taskId !== null) {
                includeTaskId = "&task_id=" + taskId;
            }
        }

        window.location.href="/edit-a-question?course_id="+ courseId + includeTaskId + "&edit=" + questionId;
    });
});


