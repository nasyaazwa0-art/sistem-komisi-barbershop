// ============================================
// DATA MASTER
// ============================================

let layananData = [];
let kapsterData = [];


// ============================================
// FORMAT RUPIAH
// ============================================

function formatRupiah(angka) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(angka) || 0);

}


// ============================================
// TANGGAL & WAKTU INDONESIA
// ============================================

function getCurrentDateTimeLocal() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    const hour =
        String(now.getHours())
            .padStart(2, "0");

    const minute =
        String(now.getMinutes())
            .padStart(2, "0");


    return `${year}-${month}-${day}T${hour}:${minute}`;
}


// ============================================
// UBAH DATETIME LOCAL KE ISO WIB
// ============================================

function convertToWIBISOString(value) {

    return `${value}:00+07:00`;

}


// ============================================
// NOMOR TRANSAKSI
// ============================================

function generateTransactionNumber() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    const hour =
        String(now.getHours())
            .padStart(2, "0");

    const minute =
        String(now.getMinutes())
            .padStart(2, "0");

    const second =
        String(now.getSeconds())
            .padStart(2, "0");

    const random =
        Math.floor(
            Math.random() * 1000
        )
        .toString()
        .padStart(3, "0");


    return `TRX-${year}${month}${day}-${hour}${minute}${second}-${random}`;
}


// ============================================
// LOAD MASTER DATA
// ============================================

async function loadMasterData() {

    const message =
        document.getElementById("message");


    try {

        if (!window.db) {

            throw new Error(
                "Supabase belum terhubung."
            );

        }


        message.textContent =
            "Memuat data layanan dan kapster...";


        // ----------------------------------------
        // AMBIL LAYANAN
        // ----------------------------------------

        const layananResult =
            await window.db
                .from("layanan")
                .select("*")
                .eq("status", "aktif")
                .order(
                    "nama_layanan",
                    {
                        ascending: true
                    }
                );


        if (layananResult.error) {

            throw new Error(
                "Gagal mengambil layanan: " +
                layananResult.error.message
            );

        }


        layananData =
            layananResult.data || [];


        // ----------------------------------------
        // AMBIL KAPSTER
        // ----------------------------------------

        const kapsterResult =
            await window.db
                .from("kapster")
                .select("*")
                .eq("status", "aktif")
                .order(
                    "nama",
                    {
                        ascending: true
                    }
                );


        if (kapsterResult.error) {

            throw new Error(
                "Gagal mengambil kapster: " +
                kapsterResult.error.message
            );

        }


        kapsterData =
            kapsterResult.data || [];


        console.log(
            "Layanan:",
            layananData
        );


        console.log(
            "Kapster:",
            kapsterData
        );


        if (layananData.length === 0) {

            throw new Error(
                "Belum ada layanan aktif."
            );

        }


        if (kapsterData.length === 0) {

            throw new Error(
                "Belum ada kapster aktif."
            );

        }


        message.textContent =
            "Data layanan dan kapster berhasil dimuat.";

    } catch (error) {

        console.error(
            "ERROR MASTER DATA:",
            error
        );


        message.textContent =
            error.message ||
            error;

    }

}


// ============================================
// TAMBAH BARIS DETAIL
// ============================================

function addDetailRow() {

    const tableBody =
        document.getElementById(
            "detailTable"
        );


    const row =
        document.createElement("tr");


    // ========================================
    // LAYANAN
    // ========================================

    const layananCell =
        document.createElement("td");


    const layananSelect =
        document.createElement("select");


    layananSelect.className =
        "detail-input";


    layananSelect.innerHTML =
        `<option value="">
            -- Pilih Layanan --
        </option>`;


    layananData.forEach(
        function (layanan) {

            layananSelect.innerHTML += `
                <option value="${layanan.id}">
                    ${layanan.nama_layanan}
                </option>
            `;

        }
    );


    layananCell.appendChild(
        layananSelect
    );


    // ========================================
    // KAPSTER
    // ========================================

    const kapsterCell =
        document.createElement("td");


    const kapsterSelect =
        document.createElement("select");


    kapsterSelect.className =
        "detail-input";


    kapsterSelect.innerHTML =
        `<option value="">
            -- Pilih Kapster --
        </option>`;


    kapsterData.forEach(
        function (kapster) {

            kapsterSelect.innerHTML += `
                <option value="${kapster.id}">
                    ${kapster.nama}
                </option>
            `;

        }
    );


    kapsterCell.appendChild(
        kapsterSelect
    );


    // ========================================
    // QTY
    // ========================================

    const qtyCell =
        document.createElement("td");


    const qtyInput =
        document.createElement("input");


    qtyInput.type =
        "number";

    qtyInput.min =
        "1";

    qtyInput.value =
        "1";

    qtyInput.className =
        "detail-number";


    qtyCell.appendChild(
        qtyInput
    );


    // ========================================
    // HARGA
    // ========================================

    const hargaCell =
        document.createElement("td");


    const hargaInput =
        document.createElement("input");


    hargaInput.type =
        "text";

    hargaInput.readOnly =
        true;

    hargaInput.value =
        "Rp0";

    hargaInput.className =
        "detail-input readonly-input";


    hargaCell.appendChild(
        hargaInput
    );


    // ========================================
    // KOMISI
    // ========================================

    const komisiCell =
        document.createElement("td");


    const komisiInput =
        document.createElement("input");


    komisiInput.type =
        "text";

    komisiInput.readOnly =
        true;

    komisiInput.value =
        "0%";

    komisiInput.className =
        "detail-input readonly-input";


    komisiCell.appendChild(
        komisiInput
    );


    // ========================================
    // SUBTOTAL
    // ========================================

    const subtotalCell =
        document.createElement("td");


    const subtotalText =
        document.createElement("span");


    subtotalText.className =
        "subtotal-value";


    subtotalText.dataset.value =
        "0";


    subtotalText.textContent =
        "Rp0";


    subtotalCell.appendChild(
        subtotalText
    );


    // ========================================
    // NILAI KOMISI
    // ========================================

    const komisiNilaiCell =
        document.createElement("td");


    const komisiNilaiText =
        document.createElement("span");


    komisiNilaiText.className =
        "commission-value";


    komisiNilaiText.dataset.value =
        "0";


    komisiNilaiText.textContent =
        "Rp0";


    komisiNilaiCell.appendChild(
        komisiNilaiText
    );


    // ========================================
    // HAPUS
    // ========================================

    const aksiCell =
        document.createElement("td");


    const hapusButton =
        document.createElement("button");


    hapusButton.type =
        "button";

    hapusButton.textContent =
        "Hapus";

    hapusButton.className =
        "remove-button";


    hapusButton.addEventListener(
        "click",
        function () {

            row.remove();

            updateTotals();

        }
    );


    aksiCell.appendChild(
        hapusButton
    );


    // ========================================
    // MASUKKAN KE ROW
    // ========================================

    row.appendChild(
        layananCell
    );

    row.appendChild(
        kapsterCell
    );

    row.appendChild(
        qtyCell
    );

    row.appendChild(
        hargaCell
    );

    row.appendChild(
        komisiCell
    );

    row.appendChild(
        subtotalCell
    );

    row.appendChild(
        komisiNilaiCell
    );

    row.appendChild(
        aksiCell
    );


    tableBody.appendChild(
        row
    );


    // ========================================
    // EVENT LAYANAN
    // ========================================

    layananSelect.addEventListener(
        "change",
        function () {

            updateDetailRow(row);

        }
    );


    // ========================================
    // EVENT QTY
    // ========================================

    qtyInput.addEventListener(
        "input",
        function () {

            updateDetailRow(row);

        }
    );

}


// ============================================
// UPDATE DETAIL
// ============================================

function updateDetailRow(row) {

    const layananSelect =
        row.querySelector(
            "td:nth-child(1) select"
        );


    const qtyInput =
        row.querySelector(
            "td:nth-child(3) input"
        );


    const hargaInput =
        row.querySelector(
            "td:nth-child(4) input"
        );


    const komisiInput =
        row.querySelector(
            "td:nth-child(5) input"
        );


    const subtotalText =
        row.querySelector(
            ".subtotal-value"
        );


    const commissionText =
        row.querySelector(
            ".commission-value"
        );


    const layanan =
        layananData.find(
            function (item) {

                return item.id ===
                    layananSelect.value;

            }
        );


    if (!layanan) {

        hargaInput.value =
            "Rp0";

        komisiInput.value =
            "0%";

        subtotalText.textContent =
            "Rp0";

        subtotalText.dataset.value =
            "0";

        commissionText.textContent =
            "Rp0";

        commissionText.dataset.value =
            "0";

        updateTotals();

        return;

    }


    const qty =
        Math.max(
            1,
            Number(qtyInput.value) || 1
        );


    qtyInput.value =
        qty;


    const harga =
        Number(layanan.harga);


    const persentaseKomisi =
        Number(
            layanan.persentase_komisi
        );


    const subtotal =
        harga * qty;


    const nilaiKomisi =
        subtotal *
        persentaseKomisi /
        100;


    hargaInput.value =
        formatRupiah(harga);


    komisiInput.value =
        `${persentaseKomisi}%`;


    subtotalText.textContent =
        formatRupiah(subtotal);


    subtotalText.dataset.value =
        subtotal;


    commissionText.textContent =
        formatRupiah(nilaiKomisi);


    commissionText.dataset.value =
        nilaiKomisi;


    updateTotals();

}


// ============================================
// TOTAL
// ============================================

function updateTotals() {

    let totalTransaksi =
        0;


    let totalKomisi =
        0;


    document
        .querySelectorAll(".subtotal-value")
        .forEach(
            function (element) {

                totalTransaksi +=
                    Number(
                        element.dataset.value
                    ) || 0;

            }
        );


    document
        .querySelectorAll(".commission-value")
        .forEach(
            function (element) {

                totalKomisi +=
                    Number(
                        element.dataset.value
                    ) || 0;

            }
        );


    document.getElementById(
        "totalTransaksi"
    ).textContent =
        formatRupiah(
            totalTransaksi
        );


    document.getElementById(
        "totalKomisi"
    ).textContent =
        formatRupiah(
            totalKomisi
        );

}


// ============================================
// AMBIL DETAIL
// ============================================

function getDetailRows() {

    const rows =
        document.querySelectorAll(
            "#detailTable tr"
        );


    const details = [];


    rows.forEach(
        function (row, index) {

            const layananSelect =
                row.querySelector(
                    "td:nth-child(1) select"
                );


            const kapsterSelect =
                row.querySelector(
                    "td:nth-child(2) select"
                );


            const qtyInput =
                row.querySelector(
                    "td:nth-child(3) input"
                );


            if (!layananSelect ||
                !kapsterSelect ||
                !qtyInput) {

                return;

            }


            const layananId =
                layananSelect.value;


            const kapsterId =
                kapsterSelect.value;


            const qty =
                Number(
                    qtyInput.value
                );


            // ------------------------------------
            // VALIDASI BARIS
            // ------------------------------------

            if (!layananId) {

                throw new Error(
                    `Baris detail ${index + 1}: layanan belum dipilih.`
                );

            }


            if (!kapsterId) {

                throw new Error(
                    `Baris detail ${index + 1}: kapster belum dipilih.`
                );

            }


            if (!qty || qty < 1) {

                throw new Error(
                    `Baris detail ${index + 1}: quantity tidak valid.`
                );

            }


            const layanan =
                layananData.find(
                    function (item) {

                        return item.id ===
                            layananId;

                    }
                );


            if (!layanan) {

                throw new Error(
                    `Layanan pada baris ${index + 1} tidak ditemukan.`
                );

            }


            const harga =
                Number(
                    layanan.harga
                );


            const persentaseKomisi =
                Number(
                    layanan.persentase_komisi
                );


            const subtotal =
                harga * qty;


            const nilaiKomisi =
                subtotal *
                persentaseKomisi /
                100;


            details.push({

                layanan_id:
                    layananId,

                kapster_id:
                    kapsterId,

                qty:
                    qty,

                harga_satuan:
                    harga,

                persentase_komisi:
                    persentaseKomisi,

                subtotal:
                    subtotal,

                nilai_komisi:
                    nilaiKomisi

            });

        }
    );


    return details;
}


// ============================================
// SIMPAN TRANSAKSI
// ============================================

document
    .getElementById("transaksiForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "message"
                );


            const saveButton =
                document.querySelector(
                    '#transaksiForm button[type="submit"]'
                );


            try {

                saveButton.disabled =
                    true;


                saveButton.textContent =
                    "Menyimpan...";


                message.textContent =
                    "Memproses transaksi...";


                // ====================================
                // AMBIL DETAIL
                // ====================================

                const details =
                    getDetailRows();


                if (details.length === 0) {

                    throw new Error(
                        "Belum ada detail transaksi."
                    );

                }


                // ====================================
                // INFORMASI TRANSAKSI
                // ====================================

                const nomorTransaksi =
                    document.getElementById(
                        "nomorTransaksi"
                    ).value;


                const tanggal =
                    document.getElementById(
                        "tanggal"
                    ).value;


                const namaPelanggan =
                    document.getElementById(
                        "namaPelanggan"
                    ).value.trim();


                const metodePembayaran =
                    document.getElementById(
                        "metodePembayaran"
                    ).value;


                if (!nomorTransaksi) {

                    throw new Error(
                        "Nomor transaksi tidak tersedia."
                    );

                }


                if (!tanggal) {

                    throw new Error(
                        "Tanggal transaksi wajib diisi."
                    );

                }


                // ====================================
                // HITUNG TOTAL
                // ====================================

                const total =
                    details.reduce(
                        function (
                            sum,
                            detail
                        ) {

                            return sum +
                                detail.subtotal;

                        },
                        0
                    );


                // ====================================
                // SIMPAN HEADER TRANSAKSI
                // ====================================

                console.log(
                    "MENYIMPAN TRANSAKSI..."
                );


                const transaksiResult =
                    await window.db
                        .from("transaksi")
                        .insert({

                            nomor_transaksi:
                                nomorTransaksi,

                            tanggal:
                                convertToWIBISOString(
                                    tanggal
                                ),

                            nama_pelanggan:
                                namaPelanggan ||
                                null,

                            metode_pembayaran:
                                metodePembayaran,

                            total:
                                total

                        })
                        .select(
                            "id, nomor_transaksi"
                        )
                        .single();


                console.log(
                    "HASIL TRANSAKSI:",
                    transaksiResult
                );


                if (transaksiResult.error) {

                    throw new Error(
                        "Gagal menyimpan transaksi utama: " +
                        transaksiResult.error.message
                    );

                }


                const transaksi =
                    transaksiResult.data;


                // ====================================
                // SIAPKAN DETAIL
                // ====================================

                const detailInsert =
                    details.map(
                        function (detail) {

                            return {

                                transaksi_id:
                                    transaksi.id,

                                layanan_id:
                                    detail.layanan_id,

                                kapster_id:
                                    detail.kapster_id,

                                qty:
                                    detail.qty,

                                harga_satuan:
                                    detail.harga_satuan,

                                persentase_komisi:
                                    detail.persentase_komisi,

                                subtotal:
                                    detail.subtotal,

                                nilai_komisi:
                                    detail.nilai_komisi

                            };

                        }
                    );


                console.log(
                    "MENYIMPAN DETAIL:",
                    detailInsert
                );


                // ====================================
                // SIMPAN DETAIL
                // ====================================

                const detailResult =
                    await window.db
                        .from("detail_transaksi")
                        .insert(
                            detailInsert
                        );


                console.log(
                    "HASIL DETAIL:",
                    detailResult
                );


                // ====================================
                // DETAIL GAGAL
                // ====================================

                if (detailResult.error) {

                    // Hapus transaksi utama
                    // agar tidak meninggalkan
                    // data transaksi yatim.

                    await window.db
                        .from("transaksi")
                        .delete()
                        .eq(
                            "id",
                            transaksi.id
                        );


                    throw new Error(
                        "Transaksi utama berhasil dibuat, tetapi detail gagal disimpan: " +
                        detailResult.error.message
                    );

                }


                // ====================================
                // HITUNG TOTAL KOMISI
                // ====================================

                const totalKomisi =
                    details.reduce(
                        function (
                            sum,
                            detail
                        ) {

                            return sum +
                                detail.nilaiKomisi;

                        },
                        0
                    );


                // ====================================
                // BERHASIL
                // ====================================

                document.getElementById(
                    "successCard"
                ).style.display =
                    "block";


                document.getElementById(
                    "successMessage"
                ).innerHTML = `

                    Nomor transaksi:
                    <strong>
                        ${nomorTransaksi}
                    </strong>

                    <br><br>

                    Total transaksi:
                    <strong>
                        ${formatRupiah(total)}
                    </strong>

                    <br><br>

                    Total komisi:
                    <strong>
                        ${formatRupiah(totalKomisi)}
                    </strong>

                `;


                message.textContent =
                    "Transaksi berhasil disimpan.";


                // ====================================
                // RESET FORM
                // ====================================

                document.getElementById(
                    "namaPelanggan"
                ).value =
                    "";


                document.getElementById(
                    "metodePembayaran"
                ).value =
                    "cash";


                document.getElementById(
                    "detailTable"
                ).innerHTML =
                    "";


                document.getElementById(
                    "nomorTransaksi"
                ).value =
                    generateTransactionNumber();


                document.getElementById(
                    "tanggal"
                ).value =
                    getCurrentDateTimeLocal();


                updateTotals();


                addDetailRow();

            } catch (error) {

                console.error(
                    "ERROR SIMPAN TRANSAKSI:",
                    error
                );


                message.textContent =
                    "ERROR: " +
                    (
                        error.message ||
                        error
                    );

            } finally {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Simpan Transaksi";

            }

        }
    );


// ============================================
// BUTTON TAMBAH DETAIL
// ============================================

document
    .getElementById("addDetailButton")
    .addEventListener(
        "click",
        function () {

            addDetailRow();

        }
    );


// ============================================
// INITIALIZATION
// ============================================

async function initializeTransactionPage() {

    document.getElementById(
        "nomorTransaksi"
    ).value =
        generateTransactionNumber();


    document.getElementById(
        "tanggal"
    ).value =
        getCurrentDateTimeLocal();


    await loadMasterData();


    if (
        layananData.length > 0 &&
        kapsterData.length > 0
    ) {

        addDetailRow();

    }

}


initializeTransactionPage();