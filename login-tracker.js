import { auth } from "./firebase.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(auth.app);


// ========================================
// NOIRBITCOIN LOGIN TRACKER
// ========================================

export async function recordLoginActivity(user) {

    console.log("LOGIN TRACKER STARTED");

    if (!user) {
        console.error("LOGIN TRACKER: No user provided");
        return;
    }

    console.log("LOGIN TRACKER USER:", user.uid);

    try {

        let ipAddress = "Unavailable";

        // Get public IP
        try {

            const ipResponse =
                await fetch(
                    "https://api.ipify.org?format=json"
                );

            const ipData =
                await ipResponse.json();

            ipAddress =
                ipData.ip || "Unavailable";

        } catch (error) {

            console.warn(
                "Unable to get IP address:",
                error
            );

        }


        let country = "Unknown";
        let region = "";
        let city = "";

        // Get approximate location
        if (ipAddress !== "Unavailable") {

            try {

                const locationResponse =
                    await fetch(
                        `https://ipapi.co/${ipAddress}/json/`
                    );

                const locationData =
                    await locationResponse.json();

                country =
                    locationData.country_name ||
                    "Unknown";

                region =
                    locationData.region ||
                    "";

                city =
                    locationData.city ||
                    "";

            } catch (error) {

                console.warn(
                    "Unable to get login location:",
                    error
                );

            }

        }


        // Save login activity
        await addDoc(
            collection(db, "loginActivity"),
            {

                uid:
                    user.uid,

                email:
                    user.email || "Unknown",

                ipAddress:
                    ipAddress,

                country:
                    country,

                region:
                    region,

                city:
                    city,

                loginTime:
                    serverTimestamp()

            }
        );


        console.log(
            "NoirBitcoin login activity recorded."
        );

    } catch (error) {

        // IMPORTANT:
        // Login tracking must NEVER prevent
        // the customer from logging in.

console.error(
    "LOGIN TRACKER ERROR:",
    error
    );

    alert(
    "LOGIN TRACKER ERROR:\n\n" +
    error.message
    );

  }

}