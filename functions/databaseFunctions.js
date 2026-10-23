function getProfilesQuery (role, data, userID) {
    if (role === "teacher") {
        return {
            query: `INSERT INTO teacher_profiles (user_id, salutation, first_name, last_name, school)
                    VALUES (?, ? , ? , ?, ?)`,
            values: [userID, data.salutation, data.firstName, data.lastName, data.school]
        }
    }
    else if (role === "parent") {
        return {
            query: `INSERT INTO parent_profiles (user_id, salutation, first_name, last_name, child_school, reason)
                    VALUES (?, ?, ?, ?, ?, ?)`,
            values: [userID, data.salutation, data.firstName, data.lastName, data.school, data.reason]
        } 
    }
    else if (role === "student") {
        return {
            query: `INSERT into student_profiles (user_id, username, first_name, last_name, school)
                    VALUES (?, ?, ?, ?, ?)`,
            values: [userID, data.username, data.firstName, data.lastName, data.school]

        }
    }
    else {
        return err;
    }
}

module.exports = {
    getProfilesQuery
};