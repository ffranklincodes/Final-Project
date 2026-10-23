const questionCanvas = document.getElementById('question_canvas');
const questionType = document.getElementById('question_type');
const previewButton = document.getElementById('preview_button');
const submitAnswerButtons = document.querySelectorAll(".form_questions");

const isEditing = questionCanvas ? questionCanvas.dataset.editing == 'true' : false;

if (questionType) {
    questionType.addEventListener('change', function () {

        var answerOptionsBlock = document.querySelector('.answer-options');

        if (isEditing) {
            if (answerOptionsBlock) {
                answerOptionsBlock.remove();
            }
        }

        else {
            questionCanvas.innerHTML = '';
        }

        if (questionType.value == "Multiple Choice") {
            createMultipleChoice(isEditing);
        }

        else if (questionType.value == "True or False") {
            createTrueFalse(isEditing);
        }

        else if (questionType.value == "Number") {
            createNumberBox(isEditing);
        }
    });
}

if (previewButton) {
    previewButton.addEventListener('click', function () {

        const courseId = previewButton.dataset.courseId;
        const taskId = previewButton.dataset.taskId;

        window.open(`/worksheet_preview/${courseId}/${taskId}`, "WorksheetPreview",
        "width=" + (.8 * screen.width) +
        ",height=" + (.8 * screen.height) +
        ",scrollbars=1,resizable=1" +
        ",top=20,left=" + (.1 * screen.width)
        );
    });
}

function openPreview(element) {
        const courseId = element.dataset.courseId;
        const taskId = element.dataset.taskId;
        const questionId = element.dataset.questionId; 
        const page = element.dataset.page;


        window.open(`/question_preview/${courseId}/${taskId}/${questionId}/${page}`, "QuestionPreview",
        "width=" + (.8 * screen.width) +
        ",height=" + (0.5 * screen.height) +
        ",scrollbars=1,resizable=1" +
        ",top=20,left=" + (.1 * screen.width)
        );
}

function createMultipleChoice(isEditing) {

    if (isEditing) {
        var answerOptionsBlock = document.createElement('div');
        answerOptionsBlock.classList.add('answer-options');

        answerOptionsBlock.innerHTML = `
            <div class="answer_option">
                <input type="radio" name="correct_answer" value="1" form="question_form" required>
                <input type="text" placeholder="Option 1" name="options" form="question_form" required>
            </div>

            <div class="answer_option">
                <input type="radio" name="correct_answer" value="2" form="question_form">
                <input type="text" placeholder="Option 2" name="options" form="question_form" required>
            </div>

            <div class="answer_option">
                <input type="radio" name="correct_answer" value="3" form="question_form">
                <input type="text" placeholder="Option 3" name="options" form="question_form" required>
            </div>

            <div class="answer_option">
                <input type="radio" name="correct_answer" value="4" form="question_form">
                <input type="text" placeholder="Option 4" name="options" form="question_form" required>
            </div>
        `;
        questionCanvas.appendChild(answerOptionsBlock);

    } else {


        var questionContent = `<div
            class="question_content"
            contenteditable="true" id="question_content">
        </div>`;

        var questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');

        questionBlock.innerHTML = `
            <label>Question Text:</label>

            ${questionContent}

            <div class="answer-options">

                <div class="answer_option">
                    <input type="radio" name="correct_answer" value="1" form="question_form" required>
                    <input type="text" placeholder="Option 1" name="options" form="question_form" required>
                </div>

                <div class="answer_option">
                    <input type="radio" name="correct_answer" value="2" form="question_form">
                    <input type="text" placeholder="Option 2" name="options" form="question_form" required>
                </div>

                <div class="answer_option">
                    <input type="radio" name="correct_answer" value="3" form="question_form">
                    <input type="text" placeholder="Option 3" name="options" form="question_form" required>
                </div>

                <div class="answer_option">
                    <input type="radio" name="correct_answer" value="4" form="question_form">
                    <input type="text" placeholder="Option 4" name="options" form="question_form" required>
                </div>

            </div>
        `;

        questionCanvas.appendChild(questionBlock);

        questionBlock
            .querySelector('.question_content')
            .focus();
    }
}

function createTrueFalse(isEditing) {

    if (isEditing) {
        var answerOptionsBlock = document.createElement('div');
        answerOptionsBlock.classList.add('answer-options');

        answerOptionsBlock.innerHTML = `
            <div class="answer_option">
                <input type="radio" name="correct_answer" value="1" form="question_form" required>
                <input type="text" placeholder="Option 1" name="options" form="question_form" value="True" required>
            </div>

            <div class="answer_option">
                <input type="radio" name="correct_answer" value="2" form="question_form">
                <input type="text" placeholder="Option 2" name="options" form="question_form" value="False" required>
            </div>`;

        questionCanvas.appendChild(answerOptionsBlock);

    } else {

        var questionContent = `<div
            class="question_content"
            contenteditable="true" id="question_content">
        </div>`;

        var questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');

        questionBlock.innerHTML = `
            <label>Question Text:</label>

            ${questionContent}

            <div class="answer-options">

                <div class="answer_option">
                    <input type="radio" name="correct_answer" value="1" form="question_form" required>
                    <input type="text" placeholder="Option 1" name="options" form="question_form" value="True" required>
                </div>

                <div class="answer_option">
                    <input type="radio" name="correct_answer" value="2" form="question_form">
                    <input type="text" placeholder="Option 2" name="options" form="question_form" value="False" required>
                </div>

            </div>`;

        questionCanvas.appendChild(questionBlock);

        questionBlock
            .querySelector('.question_content')
            .focus();
    }
}

function createNumberBox(isEditing) {

    if (isEditing) {
        var answerOptionsBlock = document.createElement('div');
        answerOptionsBlock.classList.add('answer-options');

        answerOptionsBlock.innerHTML = `
            <div class="answer-options">
                <div class="answer_option">
                    <input type="number" placeholder="Enter answer here" name="options" form="question_form" required>
                </div>
            </div>`;

        questionCanvas.appendChild(answerOptionsBlock);

    } else {


        var questionContent = `<div
            class="question_content"
            contenteditable="true" id="question_content">
        </div>`;

        var questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');

        questionBlock.innerHTML = `
            <label>Question Text:</label>

            ${questionContent}

        <div class="answer-options">
            <div class="answer_option">
                <input type="number" placeholder="Enter answer here" name="options" form="question_form" required>
            </div>
        </div>`;

        questionCanvas.appendChild(questionBlock);

        questionBlock
            .querySelector('.question_content')
            .focus();
    }
}


function saveQuestionContent (event) {
    const questionBox = document.getElementById("question_content");
    const content = document.getElementById("question_content_input")
    content.value = questionBox.textContent;


    if (content.value.trim() === "") {
        event.preventDefault();
        alert("Please enter a question.");
        questionBox.focus();
    }
}

submitAnswerButtons.forEach(function(form) {
    
    form.addEventListener("submit", function(event) {
        const submitButton = form.querySelector("button[type='submit']");
        submitButton.disabled = true;
        event.preventDefault();

        const formData = new FormData(form);

        fetch("/check-answer", {method: "POST", body: new URLSearchParams(formData)
            
        })
        .then(function(response) {
            return response.text();         
        })
        .then(function(result) {
            const resultBox = form.querySelector(".answer_result");
            
            submitButton.disabled = false;
            if (result == "Correct") {
                resultBox.textContent = "✓";
                resultBox.className = "answer_result correct";
                submitButton.disabled = true;
            } else {
                resultBox.textContent = "✗";
                resultBox.className = "answer_result incorrect";
                submitButton.disabled = false;
            }
        });
    });
});

function checkPreviewAnswer(button) {
    const correctAnswer = button.dataset.correctAnswer;
    const form = button.closest("form");
    const selectedAnswer = form.querySelector('input[name="option"]:checked') 
        || form.querySelector('input[name="option"]');

    if (!selectedAnswer || selectedAnswer.value === "") {
        return;
    }

    const answer = selectedAnswer.value;

    if (answer == correctAnswer) {
        form.querySelector(".answer_result").textContent = "Correct!";
    } else {
        form.querySelector(".answer_result").textContent = "Incorrect";
    }
}

function isChecked(action) {

    let questionCheckBoxes;

    if (action == "add") {
        questionCheckBoxes = document.querySelectorAll('.add_question_check_boxes:checked');
    }

    else if (action == "remove") {
        questionCheckBoxes = document.querySelectorAll('.remove_question_check_boxes:checked');
    }

    else if (action == "select") {
        questionCheckBoxes = document.querySelectorAll('.select_user_check_boxes:checked')
    }

    if (questionCheckBoxes.length == 0) {
        alert("Please check at least one box.");
        return false;
    }

    return true;
}


