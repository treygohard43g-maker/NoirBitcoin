import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(auth.app);

/* =========================================================
   NOIRBITCOIN ADMIN
========================================================= */

const ADMIN_UID = "5jLniALGV6NvdsLSK43wON8upVj1";

/* =========================================================
   ELEMENTS
========================================================= */

const loginActivityBody =
    document.getElementById("loginActivityBody");

const totalLogins =
    document.getElementById("totalLogins");

const todayLogins =
    document.getElementById("todayLogins");

const countryCount =
    document.getElementById("countryCount");

const refreshButton =
    document.getElementById("refreshLoginActivity");


/* =========================================================
   ADMIN ACCESS
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("login.html");

        return;
    }

    if (user.uid !== ADMIN_UID) {

        alert("Access denied.");

        window.location.replace("dashboard.html");

        return;
    }

    await loadLoginActivity();

});


/* =========================================================
   LOAD LOGIN ACTIVITY
========================================================= */

async function loadLoginActivity() {

    if (!loginActivityBody) return;

    loginActivityBody.innerHTML = `
        <tr>
            <td colspan="4" class="login-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading login activity...
            </td>
        </tr>
    `;

    try {

        const loginQuery = query(
            collection(db, "loginActivity"),
            orderBy("loginTime", "desc"),
            limit(100)
        );

        const snapshot =
            await getDocs(loginQuery);

        totalLogins.textContent =
            snapshot.size;

        let todayCount = 0;

        const countries = new Set();

        loginActivityBody.innerHTML = "";

        if (snapshot.empty) {

            loginActivityBody.innerHTML = `
                <tr>
                    <td colspan="4" class="login-empty">
                        No login activity recorded yet.
                    </td>
                </tr>
            `;

            todayLogins.textContent = "0";
            countryCount.textContent = "0";

            return;
        }


        const now = new Date();

        snapshot.forEach((docSnapshot) => {

            const data =
                docSnapshot.data();

            const email =
                data.email || "Unknown";

            const country =
                data.country || "Unknown";

            const region =
                data.region || "";

            const city =
                data.city || "";

            const ipAddress =
                data.ipAddress || "Unavailable";

            const loginTimestamp =
                data.loginTime;

            let loginDate = null;

            if (loginTimestamp?.toDate) {

                loginDate =
                    loginTimestamp.toDate();

            }


            if (country !== "Unknown") {

                countries.add(country);

            }


            if (loginDate) {

                if (
                    loginDate.getDate() === now.getDate() &&
                    loginDate.getMonth() === now.getMonth() &&
                    loginDate.getFullYear() === now.getFullYear()
                ) {

                    todayCount++;

                }

            }


            const formattedTime =
                loginDate
                    ? loginDate.toLocaleString()
                    : "Unknown";


            const location =
                [city, region, country]
                    .filter(Boolean)
                    .join(", ");


            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>

                    <div class="login-user">

                        <strong>
                            ${escapeHtml(email)}
                        </strong>

                    </div>

                </td>

                <td>
                    ${escapeHtml(formattedTime)}
                </td>

                <td>

                    <span class="ip-address">
                        ${escapeHtml(ipAddress)}
                    </span>

                </td>

                <td>

                    <div class="login-location">

                        <strong>
                            ${escapeHtml(city || "Unknown")}
                        </strong>

                        <small>
                            ${escapeHtml(
                                [region, country]
                                .filter(Boolean)
                                .join(", ")
                            )}
                        </small>

                    </div>

                </td>

            `;

            loginActivityBody.appendChild(row);

        });


        todayLogins.textContent =
            todayCount;

        countryCount.textContent =
            countries.size;


    } catch (error) {

        console.error(
            "Failed to load login activity:",
            error
        );

        loginActivityBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="login-error">

                    Unable to load login activity.

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   REFRESH
========================================================= */

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadLoginActivity
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await auth.signOut();

                localStorage.removeItem("loggedIn");
                localStorage.removeItem("firebaseUser");
                localStorage.removeItem("noirUser");

                window.location.replace(
                    "login.html"
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}