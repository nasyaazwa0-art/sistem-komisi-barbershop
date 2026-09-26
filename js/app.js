async function loadKapster() {

    const statusElement = document.getElementById("status");
    const tableBody = document.getElementById("kapsterTable");

    statusElement.textContent = "Mengambil data dari Supabase...";

    const { data, error } = await db
        .from("kapster")
        .select("*")
        .order("nama", { ascending: true });

    if (error) {

        console.error("Supabase Error:", error);

        statusElement.textContent =
            "Gagal terhubung ke database.";

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    ${error.message}
                </td>
            </tr>
        `;

        return;
    }

    statusElement.textContent =
        "Database berhasil terhubung.";

    tableBody.innerHTML = "";

    data.forEach((kapster, index) => {

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${kapster.nama}</td>
                <td>${kapster.no_telepon ?? "-"}</td>
                <td>${kapster.status}</td>
            </tr>
        `;

        tableBody.innerHTML += row;
    });
}


loadKapster();