// ============================================
// LOGIN ADMIN
// ============================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const password =
            document.getElementById(
                "password"
            ).value;


        const message =
            document.getElementById(
                "loginMessage"
            );


        const button =
            document.querySelector(
                ".login-button"
            );


        try {

            button.disabled =
                true;

            button.textContent =
                "Memproses...";

            message.textContent =
                "";


            const {
                data,
                error
            } =
                await window.db.auth
                    .signInWithPassword({
                        email: email,
                        password: password
                    });


            if (error) {

                throw error;

            }


            console.log(
                "LOGIN BERHASIL:",
                data
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            message.textContent =
                "Login gagal: " +
                error.message;


        } finally {

            button.disabled =
                false;

            button.textContent =
                "Login";

        }

    }
);