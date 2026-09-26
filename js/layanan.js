let editMode = false;


// ============================================
// FORMAT RUPIAH
// ============================================

function formatRupiah(angka) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(angka);

}


// ============================================
// LOAD DATA LAYANAN
// ============================================

async function loadLayanan() {

    const tableBody =
        document.getElementById("layananTable");


    if (!tableBody) {

        console.error(
            "Elemen #layananTable tidak ditemukan."
        );

        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Mengambil data...
            </td>
        </tr>
    `;


    try {

        if (!window.db) {

            throw new Error(
                "Supabase belum terhubung."
            );

        }


        const { data, error } =
            await window.db
                .from("layanan")
                .select("*")
                .order("nama_layanan", {
                    ascending: true
                });


        console.log(
            "DATA LAYANAN:",
            data
        );

        console.log(
            "ERROR LAYANAN:",
            error
        );


        if (error) {

            throw error;

        }


        if (!data || data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Belum ada data layanan.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        data.forEach((layanan, index) => {

            const statusText =
                layanan.status === "aktif"
                    ? "Aktif"
                    : "Nonaktif";


            tableBody.innerHTML += `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${layanan.nama_layanan}
                    </td>

                    <td>
                        ${formatRupiah(layanan.harga)}
                    </td>

                    <td>
                        ${layanan.persentase_komisi}%
                    </td>

                    <td>
                        ${statusText}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editLayanan('${layanan.id}')"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            onclick="deleteLayanan('${layanan.id}', '${escapeHtml(layanan.nama_layanan)}')"
                        >
                            Hapus
                        </button>

                    </td>

                </tr>
            `;

        });


    } catch (error) {

        console.error(
            "GAGAL LOAD LAYANAN:",
            error
        );


        tableBody.innerHTML = `
            <tr>

                <td colspan="6">

                    <strong>
                        Gagal mengambil data.
                    </strong>

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
// TAMBAH / EDIT LAYANAN
// ============================================

const layananForm =
    document.getElementById("layananForm");


if (layananForm) {

    layananForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const id =
                document.getElementById(
                    "layananId"
                ).value;


            const namaLayanan =
                document.getElementById(
                    "namaLayanan"
                ).value.trim();


            const harga =
                Number(
                    document.getElementById(
                        "harga"
                    ).value
                );


            const persentaseKomisi =
                Number(
                    document.getElementById(
                        "persentaseKomisi"
                    ).value
                );


            const status =
                document.getElementById(
                    "status"
                ).value;


            const message =
                document.getElementById(
                    "message"
                );


            // ====================================
            // VALIDASI
            // ====================================

            if (!namaLayanan) {

                message.textContent =
                    "Nama layanan wajib diisi.";

                return;
            }


            if (harga < 0 || Number.isNaN(harga)) {

                message.textContent =
                    "Harga tidak valid.";

                return;
            }


            if (
                persentaseKomisi < 0 ||
                persentaseKomisi > 100 ||
                Number.isNaN(persentaseKomisi)
            ) {

                message.textContent =
                    "Persentase komisi harus antara 0-100%.";

                return;
            }


            try {

                // ====================================
                // MODE EDIT
                // ====================================

                if (editMode) {

                    const { error } =
                        await window.db
                            .from("layanan")
                            .update({
                                nama_layanan:
                                    namaLayanan,

                                harga:
                                    harga,

                                persentase_komisi:
                                    persentaseKomisi,

                                status:
                                    status
                            })
                            .eq("id", id);


                    if (error) {

                        throw error;

                    }


                    message.textContent =
                        "Data layanan berhasil diubah.";

                }


                // ====================================
                // MODE TAMBAH
                // ====================================

                else {

                    const { error } =
                        await window.db
                            .from("layanan")
                            .insert({
                                nama_layanan:
                                    namaLayanan,

                                harga:
                                    harga,

                                persentase_komisi:
                                    persentaseKomisi,

                                status:
                                    status
                            });


                    if (error) {

                        throw error;

                    }


                    message.textContent =
                        "Layanan berhasil ditambahkan.";

                }


                resetForm();

                await loadLayanan();


            } catch (error) {

                console.error(
                    "GAGAL SIMPAN LAYANAN:",
                    error
                );


                message.textContent =
                    "Gagal menyimpan data: " +
                    (error.message || error);

            }

        }
    );

}



// ============================================
// EDIT LAYANAN
// ============================================

async function editLayanan(id) {

    try {

        const { data, error } =
            await window.db
                .from("layanan")
                .select("*")
                .eq("id", id)
                .single();


        if (error) {

            throw error;

        }


        editMode = true;


        document.getElementById(
            "layananId"
        ).value = data.id;


        document.getElementById(
            "namaLayanan"
        ).value = data.nama_layanan;


        document.getElementById(
            "harga"
        ).value = data.harga;


        document.getElementById(
            "persentaseKomisi"
        ).value =
            data.persentase_komisi;


        document.getElementById(
            "status"
        ).value = data.status;


        document.getElementById(
            "formTitle"
        ).textContent =
            "Edit Layanan";


        document.getElementById(
            "cancelButton"
        ).style.display =
            "inline-block";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "GAGAL EDIT:",
            error
        );


        alert(
            "Gagal mengambil data: " +
            (error.message || error)
        );

    }

}



// ============================================
// DELETE LAYANAN
// ============================================

async function deleteLayanan(id, nama) {

    const yakin =
        confirm(
            `Apakah kamu yakin ingin menghapus layanan "${nama}"?`
        );


    if (!yakin) {

        return;

    }


    try {

        const { error } =
            await window.db
                .from("layanan")
                .delete()
                .eq("id", id);


        if (error) {

            throw error;

        }


        alert(
            "Data layanan berhasil dihapus."
        );


        await loadLayanan();


    } catch (error) {

        console.error(
            "GAGAL HAPUS:",
            error
        );


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


    document.getElementById(
        "layananForm"
    ).reset();


    document.getElementById(
        "layananId"
    ).value = "";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Tambah Layanan";


    document.getElementById(
        "cancelButton"
    ).style.display =
        "none";


    document.getElementById(
        "message"
    ).textContent =
        "";

}



// ============================================
// JALANKAN
// ============================================

loadLayanan();