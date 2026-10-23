function getQuestions (req, res, conn, courseId, taskId, task) {
    if (!req.session.loggedin) {
        return res.send ("Please log in to preview tasks");

    }

    const check_access = `SELECT course_members.* FROM course_members JOIN course_tasks ON course_tasks.course_id = course_members.course_id WHERE student_id = ?`;

    conn.query(check_access, [req.session.studentId], function (err, accessResults) {
        
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        if (accessResults.length === 0) {
            return res.status(403).send("You do not have access to this task");
        }

        const get_questions = `SELECT * FROM task_question WHERE task_id = ?`

        conn.query(get_questions, [taskId], function (err, questionsResults) {

            if (err) throw err;

            let completed = 0;

            if (questionsResults.length === 0) {
                return res.render("student-task-page", {questions: questionsResults, course: req.session.currentCourse, course_id: courseId , task: task,  currentPage: "Current Task"});
            }

            req.session.correctAnswers = req.session.correctAnswers || {};
            req.session.correctAnswers[taskId] = {}; 

            questionsResults.forEach(function(question) {

                if (question.task_question_type == "Multiple Choice" || question.task_question_type == "True or False") {
                    const get_options = `SELECT ID, option_text, is_correct FROM task_question_options WHERE task_question_id = ?`;

                    conn.query(get_options, [question.ID], function (err, optionsResults) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send("Database error - cannot retrieve question options");
                        }

                        question.options = optionsResults;

                        optionsResults.forEach(function(option) {
                            if (option.is_correct == 1) {
                                req.session.correctAnswers[taskId][question.ID] = option.ID;
                            }
                        });

                        completed++;

                        if (completed === questionsResults.length) {
                            res.render("student-task-page", {questions: questionsResults, course: req.session.currentCourse , task_id: taskId, course_id: courseId,  task: task, currentPage: "Current Task"});
                        }
                    });
                }

                else if (question.task_question_type == "Number") {
                    const get_answer = `SELECT task_correct_answer FROM task_question_answers WHERE task_question_id = ?`;

                    conn.query(get_answer, [question.ID], function(err, answerResults) {

                        if (err) throw err;

                        req.session.correctAnswers[taskId][question.ID] = answerResults[0].correct_answer;

                        completed++;

                        if (completed === questionsResults.length) {
                            res.render("student-task-page", {questions: questionsResults, course: req.session.currentCourse , task_id: taskId, course_id: courseId, task: task, currentPage: "Current Task"});
                        }
                    });
                }
            });
        });
    });
}

function addQuestion (req, res, conn, courseId, taskId, questionIds, userId) {
    
    const insert_task_question = `INSERT INTO task_question (task_id, question_id, task_question_stem, task_question_type, task_strand, task_points, year_level, author_id, copier_id) 
    SELECT ?, ID, stem, question_type, strand_id, points, year_level, owner_id, ? FROM questions WHERE ID = ?
    `;

    let completedQuestions = 0;

    if (!Array.isArray(questionIds)) {
        questionIds = [questionIds];
    }

    questionIds.forEach(function (questionId) {
        conn.query(insert_task_question, [taskId, userId, questionId], function (err, insertTaskResults) {

            if (err) throw err;
            const taskQuestionId = insertTaskResults.insertId;

            conn.query(`SELECT * FROM question_options WHERE question_id = ?`, [questionId], function (err, optionsResult) {
                if (err) throw err;

                let completedOptions = 0;

                if (optionsResult.length > 0) {

                    optionsResult.forEach(function(option) {
                        conn.query(`INSERT INTO task_question_options (task_question_id, option_text, is_correct) VALUES (?, ?, ?)`, [taskQuestionId,option.option_text, option.is_correct], function (err, insertOptionsResult) {

                            if (err) throw err;
                            completedOptions++;
                            if (completedOptions == optionsResult.length) {
                                completedQuestions++;
                            }

                            if (completedQuestions == questionIds.length) {
                                console.log("task questions and options added successfully")
                                res.redirect(`/teacher-create-task/${courseId}/${taskId}/create-worksheet/add-questions`);
                            }
                        });

                    });

                } else {
                    conn.query(`INSERT INTO task_question_answers (task_question_id, task_correct_answer) SELECT ?, correct_answer FROM question_answers WHERE question_id = ?`, [taskQuestionId, questionId], function (err, insertAnswerResult) {

                        completedQuestions++;

                        if (completedQuestions == questionIds.length) {
                        
                            console.log("task questions and answers added successfully")
                            res.redirect(`/teacher-create-task/${courseId}/${taskId}/create-worksheet/add-questions`);

                        }
                    });
                }

            });
        });
    }); 
}



module.exports = {
    getQuestions,
    addQuestion

}