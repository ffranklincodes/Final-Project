function generateEnrollmentKey() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";

    for (let i = 0; i < 6; i++) {
        key += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return key;
}



module.exports = {
    generateEnrollmentKey
};