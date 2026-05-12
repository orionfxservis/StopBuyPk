const DataService = {

    API_URL: "https://script.google.com/macros/s/AKfycbyuf24L5Z5v593h296V9p529istVl1qmK_DZ73KL6xZKK5z0xujwVhoIOBnmfqhMjniLg/exec",

    login: async (data) => {

        try {

            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "login",
                    ...data
                })
            });

            return await res.json();

        } catch (err) {

            console.error(err);

            return {
                success: false,
                message: "Server Error"
            };
        }
    }

};

// ===============================
// LOGIN FUNCTION
// ===============================

async function loginUser() {

    const role = document.getElementById("loginRole").value;

    const username =
        document.getElementById("loginUsername")?.value.trim() || "";

    const companyName =
        document.getElementById("loginCompanyName")?.value.trim() || "";

    const userId =
        document.getElementById("loginUserId")?.value.trim() || "";

    const password =
        document.getElementById("loginPassword")?.value.trim() || "";

    const msg = document.getElementById("loginMessage");

    msg.classList.add("hidden");

    // ===============================
    // VALIDATION
    // ===============================

    // USER
    if (role === "user") {

        if (!userId || !password) {

            showLoginMessage("Please enter User ID & Password");
            return;
        }
    }

    // COMPANY
    else if (role === "company") {

        if (!username || !companyName || !userId || !password) {

            showLoginMessage("Please fill all Company login fields");
            return;
        }
    }

    // ADMIN
    else if (role === "admin") {

        if (!userId || !password) {

            showLoginMessage("Please enter Admin ID & Password");
            return;
        }
    }

    // ===============================
    // LOGIN API CALL
    // ===============================

    const result = await DataService.login({

        role,

        username,
        companyName,
        userId,
        password

    });

    console.log("LOGIN:", result);

    // ===============================
    // SUCCESS
    // ===============================

    if (result.success) {

        localStorage.setItem(
            "user",
            JSON.stringify(result.user)
        );

        // ADMIN REDIRECT
        if (result.user.role === "admin") {

            window.location.href = "admin.html";
        }

        // COMPANY REDIRECT
        else if (result.user.role === "company") {

            window.location.href = "company.html";
        }

        // USER REDIRECT
        else {

            window.location.href = "index.html";
        }

    }

    // ===============================
    // FAILED
    // ===============================

    else {

        showLoginMessage(
            result.message || "Login Failed"
        );
    }
}

// ===============================
// SHOW ERROR MESSAGE
// ===============================

function showLoginMessage(message) {

    const msg = document.getElementById("loginMessage");

    msg.innerText = message;

    msg.classList.remove("hidden");
}

// ===============================
// DEFAULT ROLE
// ===============================

window.selectedRole = "user";

// ===============================
// ROLE SWITCHING
// ===============================

function selectLoginRole(role, el) {

    window.selectedRole = role;

    document.getElementById("loginRole").value = role;

    // TABS
    document.querySelectorAll(".login-role-tab").forEach(t => {

        t.classList.remove(
            "text-emerald-400",
            "border-emerald-400",
            "border-b-2"
        );

        t.classList.add("text-gray-400");
    });

    el.classList.add(
        "text-emerald-400",
        "border-emerald-400",
        "border-b-2"
    );

    el.classList.remove("text-gray-400");

    // INPUTS
    const usernameField =
        document.getElementById("loginUsername");

    const companyField =
        document.getElementById("loginCompanyName");

    const userIdField =
        document.getElementById("loginUserId");

    // RESET
    usernameField.classList.add("hidden");
    companyField.classList.add("hidden");

    usernameField.value = "";
    companyField.value = "";

    // USER
    if (role === "user") {

        userIdField.placeholder = "User ID";
    }

    // COMPANY
    else if (role === "company") {

        usernameField.classList.remove("hidden");

        companyField.classList.remove("hidden");

        userIdField.placeholder = "User ID";
    }

    // ADMIN
    else if (role === "admin") {

        userIdField.placeholder = "Admin ID";
    }

    console.log("ROLE:", role);
}