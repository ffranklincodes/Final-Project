var express = require("express");
var app = express();

const bcrypt = require("bcrypt");

var session = require("express-session");
var conn = require("./dbConfig");
var bodyParser = require("body-parser");


app.set("view engine", "ejs");
app.use(
    session({
        secret: "yoursecret",
        resave: true,
        saveUninitialized: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/public", express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static("public"));

const databaseFunctions = require("./functions/databaseFunctions");
const { getQuestions, addQuestion } = require("./functions/questionsFunctions");

app.get("/", function (req, res) {
    res.render("home", { currentPage: "Home" });
});

app.get("/login", function (req, res) {
    res.render("login", { currentPage: "Log In" });
});

app.get("/register", function (req, res) {
    res.render("register", { title: "Register", currentPage: "Register" });
});

app.post("/register", function (req, res) {
    console.log("REGISTER ROUTE STARTED");
    let role = req.body.role;
    let email = req.body.email;
    let password = req.body.password1;
    let levels = req.body.levels;

    if (email && password) {
        const query_email = `SELECT * FROM users WHERE email = ? LIMIT 1`;
        conn.query(query_email, [email], async function (err, result) {
            if (err) throw err;
            if (result.length > 0) {
                return res.send("Email is already registered.");
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 12);
                var sql = `INSERT INTO users (email, password, role) VALUES (?, ?, ? )`;

                conn.query(sql, [email, hashedPassword, role], function (err, result) {
                    if (err) throw err;

                    const userID = result.insertId;
                    const { query: profileQuery, values: profileValues } =
                        databaseFunctions.getProfilesQuery(role, req.body, userID);

                    conn.query(profileQuery, profileValues, function (err, result) {
                        if (err) {
                            console.log(err);
                            return res.send("Database error");
                        }

                        if (role == "teacher") {
                            const teacherID = result.insertId;

                            if (!Array.isArray(levels)) {
                                levels = [levels];
                            }

                            let completed = 0;

                            for (let i = 0; i < levels.length; i++) {
                                conn.query(
                                    `INSERT INTO teacher_profiles_year_level (teacher_id, year_level) 
                                    VALUES (?, ?)`,
                                    [teacherID, levels[i]],
                                    function (err, result) {
                                        if (err) {
                                            console.log(err);
                                            return res.send("Error inserting year levels");
                                        }
                                        completed++;
                                        if (completed == levels.length) {
                                            console.log("record inserted");
                                            return res.render("register-success", {
                                                currentPage: "",
                                            });
                                        }
                                    },
                                );
                            }
                        } else {
                            console.log("record inserted");
                            res.render("register-success", { currentPage: "" });
                        }
                    });
                });
            } catch (err) {
                console.log(err);
                res.status(500).send("Something went wrong");
            }
        });
    } else {
        console.log("Error");
        res.send("Valid email and password required");
    }
});

app.post("/auth", function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    if (email) {
        conn.query(
            "SELECT * FROM users WHERE email = ? AND status != ?",
            [email, "archived"],
            async function (error, results) {
                if (error) throw error;

                if (results.length != 1) {
                    console.log("No or multiple users found.");
                    return res.send("Incorrect Email and/or Password!");
                } else {
                    try {
                        const user = results[0];
                        const isMatch = await bcrypt.compare(password, user.password);

                        if (!isMatch) {
                            return res.send("Incorrect email and/or password.");
                        }

                        req.session.loggedin = true;
                        req.session.email = email;
                        req.session.role = results[0].role;
                        req.session.userId = results[0].ID;

                        if (req.session.role == "teacher") {
                            conn.query(
                                `SELECT * from teacher_profiles WHERE user_id = ?`,
                                [req.session.userId],
                                function (err, result) {
                                    if (err) throw err;

                                    if (result.length == 1) {
                                        req.session.teacherId = result[0].ID;
                                        req.session.userName =
                                            result[0].first_name + " " + result[0].last_name;
                                        return res.redirect("/teacher-homepage");
                                    } else {
                                        console.log("multiple teacher IDs found");
                                        res.send(
                                            "Error finding teacher profile. Please contact support.",
                                        );
                                    }
                                },
                            );
                        } else if (req.session.role == "student") {
                            conn.query(
                                `SELECT * from student_profiles WHERE user_id = ?`,
                                [req.session.userId],
                                function (err, result) {
                                    if (err) throw err;

                                    if (result.length == 1) {
                                        req.session.studentId = result[0].ID;
                                        req.session.userName =
                                            result[0].first_name + " " + result[0].last_name;
                                        return res.redirect("/student-homepage");
                                    } else {
                                        console.log("no or multiple student IDs found");
                                        res.send(
                                            "Error finding student profile. Please contact support.",
                                        );
                                    }
                                },
                            );
                        } else if (req.session.role == "admin") {
                            res.redirect("/admin-homepage");
                        } else {
                            res.send("User not recognised. Please contact admin.");
                        }
                    } catch (err) {
                        console.log(err);
                        res.status(500).send("Something went wrong");
                    }
                }
            },
        );
    } else {
        res.send("Please enter correct Email and Password!");
        res.end();
    }
});

app.get("/teacher-homepage", function (req, res) {
    let sql = `SELECT * FROM courses WHERE user_id = ?`;
    conn.query(sql, [req.session.userId], function (err, results) {
        if (err) throw err;
        if (req.session.loggedin) {
            console.log("role--", req.session.role);
            res.render("teacher-homepage", {
                currentPage: "Teacher Home",
                userId: req.session.userId,
                courseData: results,
                userName: req.session.userName,
            });
        } else {
            res.send("Please log in to view this page.");
        }
    });
});

app.get("/external_resources", function (req, res) {
    res.render("external_resources", { currentPage: "External Resources" });
});

app.get("/contact", function (req, res) {
    res.render("contact", { currentPage: "Contact" });
});

app.post("/contact", function (req, res) {
    const {
        role,
        contact_name,
        contact_email,
        contact_city,
        contact_country,
        contact_subject,
        contact_message,
        status,
    } = req.body;

    conn.query(
        `INSERT INTO contact (role, name, email, city, country, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            role,
            contact_name,
            contact_email,
            contact_city,
            contact_country,
            contact_subject,
            contact_message,
            status,
        ],
        function (err, contactResults) {
            if (err) throw err;
            res.send(`
            <script>
                alert("Message successfully sent");
                window.location.href = "/";
            </script>
    `);
        },
    );
});

app.get("/about", function (req, res) {
    res.render("about", { currentPage: "About" });
});

app.get("/register/teacher-form", function (req, res) {
    res.render("partials/teacher-registration", {
        currentPage: "Register",
        emailError: "",
    });
});

app.get("/register/parent-form", function (req, res) {
    res.render("partials/parent-registration");
});

app.get("/register/student-form", function (req, res) {
    res.render("partials/student-registration");
});

app.get("/register-success", function (req, res) {
    res.render("register-success", { currentPage: "Home" });
});

app.get("/teacher-homepage", function (req, res) {
    if (req.session.loggedin) {
        res.render("teacher-homepage", { currentPage: "Teacher Home" });
    } else {
        res.send("Please login to view this page!");
    }
});

app.post("/create-course", function (req, res) {
    if (req.session.loggedin) {
        const sql = `SELECT ID from teacher_profiles WHERE user_id = ?`;

        conn.query(sql, [req.session.userId], function (err, results) {
            if (err) throw err;
            if (results.length == 0) {
                res.send("Teacher Profile not found");
            } else if (results.length > 1) {
                console.log("Multiple teachers found");
                res.send("Error Found. Please contact admin.");
            } else if (results.length == 1) {
                const {
                    course_name,
                    enrollment_code: course_code,
                    level,
                    subject,
                } = req.body;

                const insert_course = `INSERT INTO courses (user_id, teacher_id, course_name, course_code, level, subject) VALUES (?, ?, ?, ?, ?, ?)`;

                conn.query(
                    insert_course,
                    [
                        req.session.userId,
                        results[0].ID,
                        course_name,
                        course_code,
                        level,
                        subject,
                    ],
                    function (err, results) {
                        if (err) throw err;
                        console.log("course inserted");
                        res.redirect("teacher-homepage");
                    },
                );
            }
        });
    } else {
        res.send("Please log in as a teacher to create a course.");
    }
});

app.post("/create-worksheet", function (req, res) {
    if (req.session.loggedin) {
        const { course_id, title, task_type, description, summary } = req.body;

        const insert_task = `INSERT INTO course_tasks (course_id, task_name, task_type, description, summary, status, teacher_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

        conn.query(
            insert_task,
            [
                course_id,
                title,
                task_type,
                description,
                summary,
                "draft",
                req.session.teacherId,
            ],
            function (err, result) {
                if (err) throw err;
                console.log("task details inserted");
                res.redirect(
                    `/teacher-create-task/${course_id}/${result.insertId}/create-worksheet/add-questions`,
                );
            },
        );
    } else {
        res.send("Please log in as a teacher to create worksheets.");
    }
});

app.get(
    "/teacher-create-task/:course_id/:task_id/:currentPage/:currentSubPage",
    function (req, res) {
        let course_id = req.params.course_id;
        let task_id = req.params.task_id;
        let currentPage = req.params.currentPage;
        let currentSubPage = req.params.currentSubPage;

        conn.query(
            `SELECT course_name FROM courses WHERE ID = ?`,
            [course_id],
            function (err, courseResult) {
                if (err) throw err;

                if (courseResult.length == 1) {
                    conn.query(
                        `SELECT * FROM course_tasks WHERE ID = ? AND course_id = ?`,
                        [task_id, course_id],
                        function (err, taskResult) {
                            if (err) throw err;

                            conn.query(
                                `SELECT * FROM task_question WHERE task_id = ?`,
                                [task_id],
                                function (err, taskQuestionsResult) {
                                    if (err) throw err;
                                    res.render("teacher-create-task", {
                                        course_name: courseResult[0].course_name,
                                        questions: taskQuestionsResult,
                                        course_id: course_id,
                                        task_id: task_id,
                                        currentPage: currentPage,
                                        currentSubPage: currentSubPage,
                                        task: taskResult[0],
                                    });
                                },
                            );
                        },
                    );
                } else {
                    console.log("Multiple or no courses found.");
                    res.send("Error loading your course. Please contact support.");
                }
            },
        );
    },
);

app.get("/teacher-class-page/:courseId", function (req, res) {
    if (req.session.loggedin && req.session.role == "teacher") {
        const courseId = req.params.courseId;

        const query_course = `SELECT * FROM courses WHERE ID = ?`;

        conn.query(query_course, [courseId], function (err, courseResults) {
            if (err) throw err;
            if (courseResults.length == 1) {
                conn.query(
                    `SELECT * FROM course_tasks WHERE course_id = ? AND status != ?`,
                    [courseId, "archived"],
                    function (err, courseTasksResults) {
                        if (err) throw err;

                        res.render("teacher-class-page", {
                            courseData: courseResults,
                            taskData: courseTasksResults,
                            currentPage: courseResults[0].course_name,
                        });
                    },
                );
            } else {
                res.send("Error finding your class. Contact support.");
            }
        });
    } else {
        res.send("Please log in as a teacher to view your class.");
    }
});

app.get("/add-a-question", function (req, res) {
    if (req.session.loggedin) {
        const courseId = req.query.course_id;
        const taskId = req.query.task_id || req.query.taskId;

        const strand_query = `SELECT * FROM strands ORDER BY display_order`;

        conn.query(strand_query, function (err, strandResults) {
            if (err) throw err;
            res.render("teacher-add-a-question", {
                courseId,
                taskId,
                strands: strandResults,
                questionOptions: [],
                editing: false,
            });
        });
    } else {
        res.send("Please log in as a teacher to add a question.");
    }
});

app.get("/edit-a-question", function (req, res) {
    const courseId = req.query.course_id;
    const taskId = req.query.task_id || req.query.taskId;
    const questionId = req.query.edit;

    if (questionId) {
        const strand_query = `SELECT * FROM strands ORDER BY display_order`;

        conn.query(strand_query, function (err, strandResults) {
            if (err) throw err;

            conn.query(
                `SELECT * FROM questions WHERE ID = ?`,
                [questionId],
                function (err, questionResult) {
                    if (err) throw err;

                    conn.query(
                        `SELECT * FROM question_options WHERE question_id = ?`,
                        [questionId],
                        function (err, questionOptions) {
                            if (err) throw err;

                            if (questionOptions.length != 0) {
                                return res.render("teacher-edit-a-question", {
                                    courseId,
                                    questionId,
                                    taskId,
                                    strands: strandResults,
                                    questionResult,
                                    questionOptions,
                                    editing: true,
                                });
                            } else {
                                conn.query(
                                    `SELECT * FROM question_answers WHERE question_id = ?`,
                                    [questionId],
                                    function (err, answerResult) {
                                        if (err) throw err;

                                        return res.render("teacher-edit-a-question", {
                                            courseId,
                                            questionId,
                                            taskId,
                                            strands: strandResults,
                                            questionResult,
                                            answerResult,
                                            questionOptions,
                                            editing: true,
                                        });
                                    },
                                );
                            }
                        },
                    );
                },
            );
        });
    } else {
        res.send("Error finding the question.");
    }
});

app.get("/teacher-search-questions", function (req, res) {
    const courseId = req.query.course_id;
    const taskId = req.query.task_id || req.body.task_id;
    var keyword = req.query.keyword || "";
    var strand = req.query.strand || "";
    var page = parseInt(req.query.page) || 1;

    keyword = keyword.trim();
    strand = strand.trim();

    const search = "%" + keyword + "%";
    var limit = 15;
    var offset = (page - 1) * limit;

    var filter_questions = `SELECT questions.* FROM questions LEFT JOIN strands ON strands.ID = questions.strand_id WHERE visibility = ? AND status = ?`;

    var values = ["public", "published"];

    if (strand != "") {
        filter_questions += `AND strand_id = ?`;
        values.push(strand);
    }

    if (keyword != "") {
        filter_questions += `AND stem LIKE ?`;
        values.push(search);
    }

    filter_questions += `ORDER BY ID DESC LIMIT ? OFFSET ?`;

    values.push(limit + 1);
    values.push(offset);

    conn.query(filter_questions, values, function (err, questionResults) {
        if (err) throw err;

        var hasNextPage = questionResults.length > limit;

        if (hasNextPage) {
            questionResults.pop();
        }

        const strand_query = `SELECT * FROM strands ORDER BY display_order`;

        conn.query(strand_query, function (err, strandResults) {
            if (err) throw err;

            res.render("teacher-search-questions", {
                courseId,
                questions: questionResults,
                taskId: taskId,
                page: page,
                hasNextPage,
                strands: strandResults,
                currentPage: "Search Questions",
            });
        });
    });
});

app.post("/add-questions-task", function (req, res) {
    const { course_id: courseId, task_id: taskId } = req.body;
    let { question_ids: questionIds } = req.body;

    addQuestion(
        req,
        res,
        conn,
        courseId,
        taskId,
        questionIds,
        req.session.userId,
    );
});

app.post("/remove-task-questions", function (req, res) {
    let { question_ids: questionIds } = req.body;
    const { course_id: courseId, task_id: taskId } = req.body;

    if (!Array.isArray(questionIds)) {
        questionIds = [questionIds];
    }

    let completed = 0;

    questionIds.forEach(function (questionId) {
        conn.query(
            `DELETE FROM task_question WHERE ID = ?`,
            questionId,
            function (err, results) {
                if (err) throw err;

                completed++;

                if (questionIds.length == completed) {
                    console.log("task questions removed successfully");
                    res.redirect(
                        `/teacher-create-task/${courseId}/${taskId}/create-worksheet/add-questions`,
                    );
                }
            },
        );
    });
});

app.post("/question_form", function (req, res) {
    const {
        course_id,
        task_id,
        access,
        description,
        question_type,
        question_content,
        strand,
        year_level,
        points_value,
        question_id,
        status,
    } = req.body;
    const { options, correct_answer, option_ids } = req.body;

    if (req.session.loggedin) {
        let question_details = `INSERT INTO questions (owner_id, visibility, description, question_type, stem, strand_id, year_level, points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        let question_values = [
            req.session.teacherId,
            access,
            description,
            question_type,
            question_content,
            strand,
            year_level,
            points_value,
            status,
        ];

        if (req.session.role == "admin") {
            question_details = `UPDATE questions SET visibility = ?, description = ?, question_type =?, stem = ?, strand_id = ?, year_level = ?, points = ?, status = ? WHERE ID = ?`;

            question_values = [
                access,
                description,
                question_type,
                question_content,
                strand,
                year_level,
                points_value,
                status,
                question_id,
            ];
        }

        conn.query(
            question_details,
            question_values,
            function (err, QuestionResults) {
                if (err) throw err;

                let savedQuestionId;

                if (req.session.role == "admin") {
                    savedQuestionId = question_id;

                    if (
                        question_type == "Multiple Choice" ||
                        question_type == "True or False"
                    ) {
                        for (let i = 0; i < options.length; i++) {
                            let isCorrect = 0;

                            if (i + 1 == correct_answer) {
                                isCorrect = 1;
                            }

                            conn.query(
                                `UPDATE question_options SET option_text = ?, is_correct = ? WHERE ID = ?`,
                                [options[i], isCorrect, option_ids[i]],
                                function (err, updateOptionsResults) {
                                    if (err) throw err;

                                    if (i + 1 == options.length) {
                                        console.log("question updated successfully");
                                        res.redirect(`/admin-manage-questions`);
                                    }
                                },
                            );
                        }
                    } else if (question_type == "Number") {
                        conn.query(
                            `UPDATE question_answers SET correct_answer = ? WHERE ID = ?`,
                            [options, option_ids[0]],
                            function (err, updateAnswersResults) {
                                if (err) throw err;
                                console.log("question updated successfully");
                                res.redirect(`/admin-manage-questions`);
                            },
                        );
                    }
                } else if (req.session.role == "teacher") {
                    savedQuestionId = QuestionResults.insertId;

                    const insert_task_question = `INSERT INTO task_question (task_id, question_id, task_question_stem, task_question_type, task_strand, task_points, year_level, author_id, copier_id) 
                SELECT ?, ID, stem, question_type, strand_id, points, year_level, owner_id, ? FROM questions WHERE ID = ?
                `;

                    conn.query(
                        insert_task_question,
                        [task_id, req.session.userId, savedQuestionId],
                        function (err, insertTaskResults) {
                            if (err) throw err;

                            let completed = 0;
                            if (
                                question_type == "Multiple Choice" ||
                                question_type == "True or False"
                            ) {
                                for (let i = 0; i < options.length; i++) {
                                    let isCorrect = 0;

                                    if (i + 1 == correct_answer) {
                                        isCorrect = 1;
                                    }

                                    conn.query(
                                        `INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)`,
                                        [savedQuestionId, options[i], isCorrect],
                                        function (err, insertOptionsResults) {
                                            if (err) throw err;

                                            let optionId = insertOptionsResults.insertId;

                                            conn.query(
                                                `INSERT INTO task_question_options (task_question_id, option_text, is_correct)
                                    SELECT ?, option_text, is_correct FROM question_options WHERE ID = ?`,
                                                [insertTaskResults.insertId, optionId],
                                                function (err, results) {
                                                    if (err) throw err;

                                                    completed++;

                                                    if (completed == options.length) {
                                                        console.log("question added successfully");
                                                        res.redirect(
                                                            `/teacher-create-task/${course_id}/${task_id}/create-worksheet/add-questions`,
                                                        );
                                                    }
                                                },
                                            );
                                        },
                                    );
                                }
                            } else if (question_type == "Number") {
                                conn.query(
                                    `INSERT INTO question_answers (question_id, correct_answer) VALUES (?, ?)`,
                                    [savedQuestionId, options],
                                    function (err, insertAnswersResults) {
                                        if (err) throw err;

                                        let answerId = insertAnswersResults.insertId;

                                        conn.query(
                                            `INSERT INTO task_question_answers (task_question_id, task_correct_answer)
                                    SELECT ?, correct_answer FROM question_answers WHERE ID = ?`,
                                            [insertTaskResults.insertId, answerId],
                                            function (err, results) {
                                                if (err) throw err;

                                                console.log("question added successfully");
                                                res.redirect(
                                                    `/teacher-create-task/${course_id}/${task_id}/create-worksheet/add-questions`,
                                                );
                                            },
                                        );
                                    },
                                );
                            }
                        },
                    );
                }
            },
        );
    } else {
        res.send("Please log in to continue editing the question.");
    }
});

app.post("/update-task-status", function (req, res) {
    if (req.session.loggedin && req.session.role == "teacher") {
        const { status, task_id, course_id } = req.body;

        conn.query(
            `UPDATE course_tasks SET status = ? WHERE ID = ? AND course_id = ?`,
            [status, task_id, course_id],
            function (err, results) {
                if (err) throw err;

                res.redirect(`/teacher-class-page/${course_id}`);
            },
        );
    } else {
        res.send("Please log in as a teacher to view this page.");
    }
});

app.get("/worksheet_preview/:course_id/:task_id", function (req, res) {
    if (!req.session.loggedin) {
        return res.send("Please log in to preview tasks");
    }

    const course_id = req.params.course_id;
    const task_id = req.params.task_id;

    const check_access = `SELECT course_tasks.ID FROM course_tasks JOIN courses ON course_tasks.course_id = courses.ID
    WHERE course_tasks.ID = ? AND course_tasks.course_id = ? AND courses.teacher_id = ?`;

    conn.query(
        check_access,
        [task_id, course_id, req.session.teacherId],
        function (err, accessResults) {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }

            if (accessResults.length === 0) {
                return res.status(403).send("You do not have access to this task");
            }

            const get_questions = `SELECT questions.* FROM questions JOIN task_question ON questions.ID = task_question.question_id WHERE task_question.task_id = ?`;

            conn.query(get_questions, [task_id], function (err, questionsResults) {
                if (err) throw err;

                let completed = 0;

                if (questionsResults.length === 0) {
                    return res.render("teacher-worksheet-preview", {
                        questions: questionsResults,
                        currentPage: "Preview",
                    });
                }

                req.session.correctAnswers = req.session.correctAnswers || {};
                req.session.correctAnswers[task_id] = {};

                questionsResults.forEach(function (question) {
                    if (
                        question.question_type == "Multiple Choice" ||
                        question.question_type == "True or False"
                    ) {
                        const get_options = `SELECT ID, option_text, is_correct FROM question_options WHERE question_id = ?`;

                        conn.query(
                            get_options,
                            [question.ID],
                            function (err, optionsResults) {
                                if (err) {
                                    console.log(err);
                                    return res
                                        .status(500)
                                        .send("Database error - cannot retrieve question options");
                                }

                                question.options = optionsResults;

                                optionsResults.forEach(function (option) {
                                    if (option.is_correct == 1) {
                                        req.session.correctAnswers[task_id][question.ID] =
                                            option.ID;
                                    }
                                });

                                completed++;

                                if (completed === questionsResults.length) {
                                    res.render("teacher-worksheet-preview", {
                                        questions: questionsResults,
                                        task_id: task_id,
                                        currentPage: "Preview",
                                    });
                                }
                            },
                        );
                    } else if (question.question_type == "Number") {
                        const get_answer = `SELECT correct_answer FROM question_answers WHERE question_id = ?`;

                        conn.query(
                            get_answer,
                            [question.ID],
                            function (err, answerResults) {
                                req.session.correctAnswers[task_id][question.ID] =
                                    answerResults[0].correct_answer;

                                completed++;

                                if (completed === questionsResults.length) {
                                    res.render("teacher-worksheet-preview", {
                                        questions: questionsResults,
                                        task_id: task_id,
                                        currentPage: "Preview",
                                    });
                                }
                            },
                        );
                    }
                });
            });
        },
    );
});

app.get(
    "/question_preview/:course_id/:task_id/:question_id/:page",
    function (req, res) {
        if (!req.session.loggedin) {
            return res.send("Please log in to preview tasks");
        }

        const courseId = req.params.course_id;
        const taskId = req.params.task_id;
        const questionId = req.params.question_id;
        const page = req.params.page;

        const check_access = `SELECT course_tasks.ID FROM course_tasks JOIN courses ON course_tasks.course_id = courses.ID
    WHERE course_tasks.ID = ? AND course_tasks.course_id = ? AND courses.teacher_id = ?`;

        conn.query(
            check_access,
            [taskId, courseId, req.session.teacherId],
            function (err, accessResults) {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database error");
                }

                if (accessResults.length === 0) {
                    return res.status(403).send("You do not have access to this task");
                }

                let get_questions;
                let get_options;
                let get_answer;
                let task = "";
                const question_type = "question_type";
                let tableSource = "questions";

                if (page == "search_page") {
                    get_questions = `SELECT * FROM questions WHERE ID = ?`;
                    get_options = `SELECT ID, option_text, is_correct FROM question_options WHERE question_id = ?`;
                    get_answer = `SELECT correct_answer FROM question_answers WHERE question_id = ?`;
                } else if (page == "task_page") {
                    get_questions = `SELECT * FROM task_question WHERE ID = ?`;
                    get_options = `SELECT ID, option_text, is_correct FROM task_question_options WHERE task_question_id = ?`;
                    get_answer = `SELECT task_correct_answer FROM task_question_answers WHERE task_question_id = ?`;
                    task = "task_";
                    tableSource = "task_question";
                }

                conn.query(get_questions, [questionId], function (err, questionResult) {
                    if (err) throw err;

                    if (questionResult.length === 0) {
                        return res.render("teacher-question-preview", {
                            question,
                            currentPage: "Preview",
                        });
                    }

                    const question = questionResult[0];
                    let correctAnswer;

                    if (
                        question[task + question_type] == "Multiple Choice" ||
                        question[task + question_type] == "True or False"
                    ) {
                        conn.query(
                            get_options,
                            [question.ID],
                            function (err, optionsResult) {
                                if (err) {
                                    console.log(err);
                                    return res
                                        .status(500)
                                        .send("Database error - cannot retrieve question options");
                                }

                                question.options = optionsResult;

                                optionsResult.forEach(function (option) {
                                    if (option.is_correct == 1) {
                                        correctAnswer = option.ID;
                                    }
                                });

                                res.render("teacher-question-preview", {
                                    question,
                                    task_id: taskId,
                                    options: optionsResult,
                                    correctAnswer,
                                    tableSource,
                                    currentPage: "Preview",
                                });
                            },
                        );
                    } else if (question[task + question_type] == "Number") {
                        conn.query(get_answer, [question.ID], function (err, answerResult) {
                            if (err) throw err;

                            if (page == "search_page") {
                                correctAnswer = answerResult[0].correct_answer;
                            } else if (page == "task_page") {
                                correctAnswer = answerResult[0].task_correct_answer;
                            }

                            res.render("teacher-question-preview", {
                                question,
                                task_id: taskId,
                                correctAnswer,
                                tableSource,
                                currentPage: "Preview",
                            });
                        });
                    }
                });
            },
        );
    },
);

app.post("/check-answer", function (req, res) {
    const { taskId, questionId, option } = req.body;

    const correctAnswer = req.session.correctAnswers[taskId][questionId];

    if (Number(option) === Number(correctAnswer)) {
        res.send("Correct");
    } else {
        res.send("Incorrect");
    }
});

// STUDENT RELATED get and post

app.get("/student-homepage", function (req, res) {
    if (req.session.loggedin && req.session.role == "student") {
        console.log("role--", req.session.role);

        conn.query(
            `SELECT * FROM student_profiles WHERE user_id = ?`,
            [req.session.userId],
            function (err, studentResults) {
                if (err) throw err;

                if (studentResults.length != 1) {
                    console.log("Multiple or no students found");
                    return res.send("Database error. Please contact support");
                } else {
                    req.session.studentId = studentResults[0].ID;

                    conn.query(
                        `SELECT course_members.*, courses.* FROM course_members JOIN courses ON course_members.course_id = courses.ID WHERE student_id = ?`,
                        [req.session.studentId],
                        function (err, courseResults) {
                            if (err) throw error;

                            req.session.studentCourses = courseResults;

                            res.render("student-homepage", {
                                currentPage: "Student Home",
                                userId: req.session.userId,
                                courses: courseResults,
                                student: studentResults,
                            });
                        },
                    );
                }
            },
        );
    } else {
        res.send("Please log in to view this page.");
    }
});

app.post("/join-course", function (req, res) {
    if (req.session.loggedin && req.session.role == "student") {
        const { course_id, course_code } = req.body;

        const query_courses = `SELECT * FROM courses WHERE ID = ? AND course_code = ?`;

        conn.query(
            query_courses,
            [course_id, course_code],
            function (err, courseResults) {
                if (err) throw err;

                if (courseResults.length == 0) {
                    console.log("No course found");
                    return res.send("No course found. Please check Course ID and Join Code.");
                } else if (courseResults.length > 1) {
                    console.log("Multiple courses found");
                } else if (courseResults.length == 1) {
                    conn.query(
                        `SELECT * FROM course_members WHERE student_id = ? AND course_id = ?`,
                        [req.session.studentId, course_id],
                        function (err, courseCheckResults) {
                            if (err) throw err;

                            if (courseCheckResults.length != 0) {
                                return res.send("You have already joined this course.");
                            } else {
                                conn.query(
                                    `INSERT INTO course_members (student_id, course_id) VALUES (?, ?)`,
                                    [req.session.studentId, course_id],
                                    function (err, results) {
                                        if (err) throw err;

                                        console.log("Student added to course_members successfully");
                                        res.redirect("/student-homepage");
                                    },
                                );
                            }
                        },
                    );
                }
            },
        );
    }
});

app.get("/student-class-page/:courseId", function (req, res) {
    const courseId = req.params.courseId;
    if (req.session.loggedin && req.session.role == "student") {
        conn.query(
            `SELECT course_name FROM courses WHERE ID = ?`,
            [courseId],
            function (err, courseResult) {
                if (err) throw err;

                req.session.currentCourse = courseResult[0];

                const query_student_tasks = `SELECT * FROM course_tasks WHERE course_id = ? AND status = ?`;

                conn.query(
                    query_student_tasks,
                    [courseId, "published"],
                    function (err, studentTaskResults) {
                        if (err) throw err;

                        res.render("student-class-page", {
                            student_tasks: studentTaskResults,
                            courseId: courseId,
                            courses: req.session.studentCourses,
                            course: courseResult,
                            currentPage: "Student Class",
                        });
                    },
                );
            },
        );
    }
});

app.get("/student-task/:courseId/:taskId", function (req, res) {
    const courseId = req.params.courseId;
    const taskId = req.params.taskId;

    conn.query(
        `SELECT task_name FROM course_tasks WHERE ID = ?`,
        [taskId, "published"],
        function (err, taskResult) {
            if (err) throw err;

            getQuestions(req, res, conn, courseId, taskId, taskResult[0]);
        },
    );
});

//admin-related gets and posts

app.get("/admin-homepage", function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {
        res.render("admin-homepage", {
            currentPage: "Admin Home",
            userName: req.session.userName,
        });
    } else {
        console.log("Admin log in required");
        res.send("Please log in as admin to view this page.");
    }
});

app.get("/admin-manage-users", function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {
        const listUsers = `SELECT u.ID, u.email, u.status, u.role, COALESCE(t.first_name, s.first_name) AS first_name, COALESCE (t.last_name, s.last_name) AS last_name, COALESCE(t.school, s.school) AS school FROM users u 
        LEFT JOIN teacher_profiles t ON u.ID = t.user_id
        LEFT JOIN student_profiles s ON u.ID = s.user_id`;

        conn.query(listUsers, function (err, usersResults) {
            if (err) throw err;

            res.render("admin-manage-users", {
                currentPage: "Manage Users",
                users: usersResults,
            });
        });
    } else {
        res.send("Please log in as an admin.");
    }
});

app.post("/update-users", function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {
        const action = req.body.action;

        if (action == "status") {
            let { user_ids: userIds, status } = req.body;

            if (!Array.isArray(userIds)) {
                userIds = [userIds];
            }

            const allowedStatus = ["archived", "active", "inactive"];

            if (!allowedStatus.includes(status)) {
                return res.send("Invalid status");
            }

            const update_status_query = `UPDATE users SET status = ? WHERE ID = ?`;
            let completed = 0;

            userIds.forEach(function (userId) {
                conn.query(
                    update_status_query,
                    [status, userId],
                    function (err, results) {
                        if (err) throw err;
                        completed++;

                        if (completed == userIds.length) {
                            console.log("user(s) status updated");
                            res.redirect("/admin-manage-users");
                        }
                    },
                );
            });
        } else if (action == "details") {
            const { user_id, email, first_name, last_name, school, role, status } =
                req.body;

            const update_user_info_sql = `UPDATE users SET email = ?, role = ?, status =?  WHERE ID = ?`;
            conn.query(
                update_user_info_sql,
                [email, role, status, user_id],
                function (err, result) {
                    if (err) throw err;

                    conn.query(
                        `UPDATE ${role}_profiles SET first_name = ?, last_name = ?, school = ? WHERE user_id = ?`,
                        [first_name, last_name, role, user_id],
                        function (err, result) {
                            if (err) throw err;
                            console.log("user details successfully updated");
                            res.send(`
                        <script>
                            alert("User details have been updated.");
                            window.location.href = "/admin-manage-users";
                        </script>
                    `);
                        },
                    );
                },
            );
        }
    } else {
        res.send("Please log in as an admin.");
    }
});

app.get("/admin-manage-questions", function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {
        var page = parseInt(req.query.page) || 1;
        var limit = 15;
        var offset = (page - 1) * limit;

        const get_question_details = `SELECT * FROM questions ORDER BY ID DESC LIMIT ? OFFSET ?`;

        conn.query(
            get_question_details,
            [limit + 1, offset],
            function (err, questionsResults) {
                if (err) throw err;

                var hasNextPage = questionsResults.length > limit;

                if (hasNextPage) {
                    questionsResults.pop();
                }

                let completed = 0;

                questionsResults.forEach(function (question) {
                    const strand_name_sql = `SELECT strand_name FROM strands WHERE ID = ?`;

                    conn.query(
                        strand_name_sql,
                        [question.strand_id],
                        function (err, strandResults) {
                            if (err) throw err;
                            if (strandResults.length > 0) {
                                question.strand = strandResults[0].strand_name;
                            } else {
                                question.strand = "No strand";
                            }

                            conn.query(
                                `SELECT first_name, last_name FROM teacher_profiles WHERE ID = ?`,
                                [question.owner_id],
                                function (err, authorResults) {
                                    if (err) throw err;

                                    completed++;
                                    question.author =
                                        authorResults[0].first_name +
                                        " " +
                                        authorResults[0].last_name;

                                    if (completed == questionsResults.length) {
                                        res.render("admin-manage-questions", {
                                            currentPage: "Manage Questions",
                                            questions: questionsResults,
                                            hasNextPage,
                                            page,
                                        });
                                    }
                                },
                            );
                        },
                    );
                });
            },
        );
    } else {
        res.send("Please log in as an admin to view this page.");
    }
});

app.post("/update-questions", function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {
        const { status, question_id } = req.body;

        const update_question_status = `UPDATE questions SET status = ? WHERE ID = ?`;

        conn.query(
            update_question_status,
            [status, question_id],
            function (err, result) {
                if (err) throw err;
                res.redirect("/admin-manage-questions");
            },
        );
    }
});

app.get("/admin-manage-messages", function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {
        var unread = 0;
        var in_progress = 0;
        var resolved = 0;

        conn.query(`SELECT status FROM contact`, function (err, statusResults) {
            statusResults.forEach(function (status) {
                if (status.status == "unread") {
                    unread++;
                } else if (status.status == "in_progress") {
                    in_progress++;
                } else if (status.status == "resolved") {
                    resolved++;
                }
            });

            
            const messages_sql = `SELECT *, DATE_FORMAT(date_submitted, '%d %b %y') AS formatted_date from contact LIMIT ? OFFSET ?`;

            var page = parseInt(req.query.page) || 1;
            var limit = 5;
            var offset = (page - 1) * limit;

            conn.query(
                messages_sql,
                [limit + 1, offset],
                function (err, messagesResults) {
                    if (err) throw err;

                    var hasNextPage = messagesResults.length > limit;

                    if (hasNextPage) {
                        messagesResults.pop();
                    }

                    res.render("admin-manage-messages", {
                        currentPage: "Manage Messages",
                        messages: messagesResults,
                        page,
                        hasNextPage,
                        unread,
                        in_progress,
                        resolved
                    });
                },
            );
        });
    } else {
        res.send("Please log in as an admin to view messages");
    }
});

app.post('/update-message-status', function (req, res) {
    if (req.session.loggedin && req.session.role == "admin") {

        const {status, message_id: ID} = req.body;

        conn.query(`UPDATE contact SET status = ? WHERE ID = ?`, [status, ID], function (err, result) {
            if (err) throw err;

            console.log(`Message status updated to ${status}`);
            res.redirect('/admin-manage-messages');
        });
    } else {
        res.send ("Please log in as an admin to manage messages status.");
    }
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.listen(3000);
console.log("Web app is running in port 3000");