// update users variables
const updateUserButtons = document.querySelectorAll(".update_user_button");
const popupUserId = document.getElementById("popup_user_id");
const popupEmail = document.getElementById("popup_email");
const popupFirstName = document.getElementById("popup_first_name");
const popupLastName = document.getElementById("popup_last_name");
const popupSchool = document.getElementById("popup_school");
const popupRole = document.getElementById("popup_role");
const popupStatus = document.getElementById("popup_status");


// view message details variables
const viewMessageButtons = document.querySelectorAll(".view_message_button");
const messageSender = document.getElementById("message_sender");
const messageRole = document.getElementById("message_role");
const messageEmail = document.getElementById("message_email");
const messageLocation = document.getElementById("message_location")
const messageDate = document.getElementById("message_date");
const messageSubject = document.getElementById("message_subject");
const messageText = document.getElementById("message_text");
const messageId = document.getElementById("message_id");



updateUserButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        popupUserId.value = button.dataset.userId;
        popupEmail.value = button.dataset.userEmail;
        popupFirstName.value = button.dataset.userFirstName;
        popupLastName.value = button.dataset.userLastName;
        popupSchool.value = button.dataset.userSchool;
        popupRole.value = button.dataset.userRole;
        popupStatus.value = button.dataset.userStatus;

        openPopup(userDetails);

    });

});

viewMessageButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        messageSender.textContent = button.dataset.messageSender;
        messageDate.textContent = button.dataset.messageDate;
        messageEmail.textContent = button.dataset.messageEmail;
        messageLocation.textContent = button.dataset.messageLocation;
        messageRole.textContent = button.dataset.messageRole;
        messageSubject.textContent = button.dataset.messageSubject;
        messageText.textContent = button.dataset.messageText;
        messageId.value = button.dataset.messageId;

        console.log("Sender:", button.dataset.messageSender);
        console.log("Element:", messageSender);

        openPopup(message);
    });
});