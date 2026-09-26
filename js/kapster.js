let editMode = false;

// ============================================
// LOAD DATA KAPSTER
// ============================================

async function loadKapster() {
    const tableBody = document.getElementById("kapsterTable");

    // Pastikan elemen tabel ditemukan
    if (!tableBody) {
        console.error("Elemen #kapsterTable tidak ditemukan.");
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="5">Mengambil data...</td>
        </tr>
    `;

    try {
        // Pastikan koneksi Supabase tersedia
        if (!window.db) {
            throw new Error(
                "Supabase belum terhubung. Periksa js/supabase.js."
            );
        }

        const { data, error } = await window.db
            .from("kapster")
            .select("id, nama, no_telepon, status")
            .order("nama", { ascending: true });

        console.log("DATA KAPSTER:", data);
        console.log("ERROR KAPSTER:", error);

        if (error) {
            throw error;
        }

        // Jika tidak ada data
        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Belum ada data kapster di database.
                    </td>
                </tr>
            `;
            return;
        }

        // Kosongkan tabel
        tableBody.innerHTML = "";

        // Tampilkan data
        data.forEach((kapster, index) => {
            const statusText =
                kapster.status === "aktif"
                    ? "Aktif"
                    : "Nonaktif";

            tableBody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>

                    <td>${kapster.nama}</td>

                    <td>${kapster.no_telepon ?? "-"}</td>

                    <td>${statusText}</td>

                    <td>
                        <button
                            type="button"
                            onclick="editKapster('${kapster.id}')"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            onclick="deleteKapster('${kapster.id}', '${escapeHtml(kapster.nama)}')"
                        >
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("GAGAL LOAD KAPSTER:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <strong>Gagal mengambil data.</strong>
                    <br><br>
                    ${error.message || error}
                </td>
            </tr>
        `;
    }
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================
// TAMBAH / EDIT
// ============================================

const kapsterForm = document.getElementById("kapsterForm");

if (kapsterForm) {

    kapsterForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("kapsterId").value;

        const nama =
            document.getElementById("nama").value.trim();

        const noTelepon =
            document.getElementById("noTelepon").value.trim();

        const status =
            document.getElementById("status").value;

        const message =
            document.getElementById("message");

        if (!nama) {
            message.textContent =
                "Nama kapster wajib diisi.";
            return;
        }

        try {

            // ========================================
            // EDIT
            // ========================================

            if (editMode) {

                const { error } = await window.db
                    .from("kapster")
                    .update({
                        nama: nama,
                        no_telepon: noTelepon,
                        status: status
                    })
                    .eq("id", id);

                if (error) {
                    throw error;
                }

                message.textContent =
                    "Data kapster berhasil diubah.";

            }

            // ========================================
            // TAMBAH
            // ========================================

            else {

                const { error } = await window.db
                    .from("kapster")
                    .insert({
                        nama: nama,
                        no_telepon: noTelepon,
                        status: status
                    });

                if (error) {
                    throw error;
                }

                message.textContent =
                    "Kapster berhasil ditambahkan.";
            }

            resetForm();

            await loadKapster();

        } catch (error) {

            console.error("GAGAL SIMPAN:", error);

            message.textContent =
                "Gagal menyimpan data: " +
                (error.message || error);
        }

    });
}


// ============================================
// EDIT KAPSTER
// ============================================

async function editKapster(id) {

    try {

        const { data, error } = await window.db
            .from("kapster")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            throw error;
        }

        editMode = true;

        document.getElementById("kapsterId").value =
            data.id;

        document.getElementById("nama").value =
            data.nama;

        document.getElementById("noTelepon").value =
            data.no_telepon ?? "";

        document.getElementById("status").value =
            data.status;

        document.getElementById("formTitle").textContent =
            "Edit Kapster";

        document.getElementById("cancelButton").style.display =
            "inline-block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (error) {

        console.error("GAGAL EDIT:", error);

        alert(
            "Gagal mengambil data: " +
            (error.message || error)
        );
    }
}


// ============================================
// DELETE KAPSTER
// ============================================

async function deleteKapster(id, nama) {

    const yakin = confirm(
        `Apakah kamu yakin ingin menghapus kapster "${nama}"?`
    );

    if (!yakin) {
        return;
    }

    try {

        const { error } = await window.db
            .from("kapster")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        alert("Data kapster berhasil dihapus.");

        await loadKapster();

    } catch (error) {

        console.error("GAGAL HAPUS:", error);

        alert(
            "Gagal menghapus data: " +
            (error.message || error)
        );
    }
}


// ============================================
// RESET FORM
// ============================================

function resetForm() {

    editMode = false;

    document.getElementById("kapsterForm").reset();

    document.getElementById("kapsterId").value = "";

    document.getElementById("formTitle").textContent =
        "Tambah Kapster";

    document.getElementById("cancelButton").style.display =
        "none";

    document.getElementById("message").textContent =
        "";
}


// ============================================
// JALANKAN
// ============================================

loadKapster();