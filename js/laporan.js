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
// FORMAT TANGGAL
// ============================================

function formatTanggal(tanggal) {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(tanggal));
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================
// DEFAULT TANGGAL
// ============================================

function setDefaultDate() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");


    document.getElementById(
        "tanggalMulai"
    ).value = `${year}-${month}-01`;


    document.getElementById(
        "tanggalAkhir"
    ).value = `${year}-${month}-${day}`;
}


// ============================================
// TANGGAL AKHIR + 1 HARI
// ============================================

function getNextDate(dateString) {

    const date = new Date(
        `${dateString}T00:00:00+07:00`
    );

    date.setUTCDate(
        date.getUTCDate() + 1
    );

    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getUTCDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ============================================
// LOAD LAPORAN
// ============================================

async function loadLaporan() {

    const message =
        document.getElementById("message");

    const kapsterTable =
        document.getElementById(
            "laporanKapsterTable"
        );

    const detailTable =
        document.getElementById(
            "detailLaporanTable"
        );


    try {

        message.textContent =
            "Mengambil data laporan...";


        kapsterTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Loading...
                </td>
            </tr>
        `;


        detailTable.innerHTML = `
            <tr>
                <td colspan="8">
                    Loading...
                </td>
            </tr>
        `;


        // ========================================
        // CEK SUPABASE
        // ========================================

        if (!window.db) {

            throw new Error(
                "Supabase belum terhubung."
            );

        }


        // ========================================
        // AMBIL FILTER TANGGAL
        // ========================================

        const tanggalMulai =
            document.getElementById(
                "tanggalMulai"
            ).value;


        const tanggalAkhir =
            document.getElementById(
                "tanggalAkhir"
            ).value;


        if (!tanggalMulai || !tanggalAkhir) {

            throw new Error(
                "Tanggal mulai dan tanggal akhir wajib diisi."
            );

        }


        if (tanggalMulai > tanggalAkhir) {

            throw new Error(
                "Tanggal mulai tidak boleh lebih besar dari tanggal akhir."
            );

        }


        // ========================================
        // RANGE WIB
        // ========================================

        const startISO =
            `${tanggalMulai}T00:00:00+07:00`;


        const nextDate =
            getNextDate(tanggalAkhir);


        const endISO =
            `${nextDate}T00:00:00+07:00`;


        console.log(
            "START:",
            startISO
        );


        console.log(
            "END:",
            endISO
        );


        // ========================================
        // 1. AMBIL TRANSAKSI
        // ========================================

        const transaksiResult =
            await window.db
                .from("transaksi")
                .select(`
                    id,
                    nomor_transaksi,
                    tanggal,
                    nama_pelanggan,
                    metode_pembayaran,
                    total
                `)
                .gte(
                    "tanggal",
                    startISO
                )
                .lt(
                    "tanggal",
                    endISO
                )
                .order(
                    "tanggal",
                    {
                        ascending: false
                    }
                );


        if (transaksiResult.error) {

            throw transaksiResult.error;

        }


        const transaksiData =
            transaksiResult.data || [];


        console.log(
            "TRANSAKSI:",
            transaksiData
        );


        // ========================================
        // RESET JIKA KOSONG
        // ========================================

        if (transaksiData.length === 0) {

            document.getElementById(
                "jumlahTransaksi"
            ).textContent = "0";


            document.getElementById(
                "totalPenjualan"
            ).textContent =
                formatRupiah(0);


            document.getElementById(
                "totalKomisi"
            ).textContent =
                formatRupiah(0);


            kapsterTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Tidak ada transaksi
                        pada periode ${tanggalMulai}
                        sampai ${tanggalAkhir}.
                    </td>
                </tr>
            `;


            detailTable.innerHTML = `
                <tr>
                    <td colspan="8">
                        Tidak ada rincian transaksi.
                    </td>
                </tr>
            `;


            message.textContent =
                "Laporan berhasil dimuat, tetapi tidak ada transaksi pada periode tersebut.";


            return;
        }


        // ========================================
        // 2. AMBIL DETAIL TRANSAKSI
        // ========================================

        const transaksiIds =
            transaksiData.map(
                transaksi => transaksi.id
            );


        const detailResult =
            await window.db
                .from("detail_transaksi")
                .select(`
                    id,
                    transaksi_id,
                    layanan_id,
                    kapster_id,
                    qty,
                    harga_satuan,
                    persentase_komisi,
                    subtotal,
                    nilai_komisi
                `)
                .in(
                    "transaksi_id",
                    transaksiIds
                );


        if (detailResult.error) {

            throw detailResult.error;

        }


        const detailData =
            detailResult.data || [];


        console.log(
            "DETAIL:",
            detailData
        );


        // ========================================
        // 3. AMBIL DATA KAPSTER
        // ========================================

        const kapsterIds = [
            ...new Set(
                detailData
                    .map(
                        detail =>
                            detail.kapster_id
                    )
                    .filter(Boolean)
            )
        ];


        let kapsterData = [];


        if (kapsterIds.length > 0) {

            const kapsterResult =
                await window.db
                    .from("kapster")
                    .select(`
                        id,
                        nama
                    `)
                    .in(
                        "id",
                        kapsterIds
                    );


            if (kapsterResult.error) {

                throw kapsterResult.error;

            }


            kapsterData =
                kapsterResult.data || [];
        }


        // ========================================
        // 4. AMBIL DATA LAYANAN
        // ========================================

        const layananIds = [
            ...new Set(
                detailData
                    .map(
                        detail =>
                            detail.layanan_id
                    )
                    .filter(Boolean)
            )
        ];


        let layananData = [];


        if (layananIds.length > 0) {

            const layananResult =
                await window.db
                    .from("layanan")
                    .select(`
                        id,
                        nama_layanan
                    `)
                    .in(
                        "id",
                        layananIds
                    );


            if (layananResult.error) {

                throw layananResult.error;

            }


            layananData =
                layananResult.data || [];
        }


        // ========================================
        // BUAT MAP KAPSTER
        // ========================================

        const kapsterMapData =
            new Map();


        kapsterData.forEach(
            kapster => {

                kapsterMapData.set(
                    kapster.id,
                    kapster.nama
                );

            }
        );


        // ========================================
        // BUAT MAP LAYANAN
        // ========================================

        const layananMapData =
            new Map();


        layananData.forEach(
            layanan => {

                layananMapData.set(
                    layanan.id,
                    layanan.nama_layanan
                );

            }
        );


        // ========================================
        // SUMMARY UMUM
        // ========================================

        let totalPenjualan = 0;

        let totalKomisi = 0;


        transaksiData.forEach(
            transaksi => {

                totalPenjualan +=
                    Number(
                        transaksi.total
                    ) || 0;

            }
        );


        detailData.forEach(
            detail => {

                totalKomisi +=
                    Number(
                        detail.nilai_komisi
                    ) || 0;

            }
        );


        document.getElementById(
            "jumlahTransaksi"
        ).textContent =
            transaksiData.length;


        document.getElementById(
            "totalPenjualan"
        ).textContent =
            formatRupiah(
                totalPenjualan
            );


        document.getElementById(
            "totalKomisi"
        ).textContent =
            formatRupiah(
                totalKomisi
            );


        // ========================================
        // AGREGASI PER KAPSTER
        // ========================================

        const laporanKapster =
            new Map();


        detailData.forEach(
            detail => {

                const kapsterId =
                    detail.kapster_id;


                const namaKapster =
                    kapsterMapData.get(
                        kapsterId
                    ) || "Kapster tidak ditemukan";


                if (!laporanKapster.has(
                    kapsterId
                )) {

                    laporanKapster.set(
                        kapsterId,
                        {
                            nama:
                                namaKapster,

                            transaksi:
                                new Set(),

                            totalPenjualan:
                                0,

                            totalKomisi:
                                0
                        }
                    );

                }


                const item =
                    laporanKapster.get(
                        kapsterId
                    );


                item.transaksi.add(
                    detail.transaksi_id
                );


                item.totalPenjualan +=
                    Number(
                        detail.subtotal
                    ) || 0;


                item.totalKomisi +=
                    Number(
                        detail.nilai_komisi
                    ) || 0;

            }
        );


        // ========================================
        // TAMPILKAN PER KAPSTER
        // ========================================

        const laporanArray =
            Array.from(
                laporanKapster.values()
            );


        laporanArray.sort(
            (a, b) =>
                a.nama.localeCompare(
                    b.nama
                )
        );


        kapsterTable.innerHTML = "";


        if (laporanArray.length === 0) {

            kapsterTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Belum ada data komisi kapster.
                    </td>
                </tr>
            `;

        } else {

            laporanArray.forEach(
                (item, index) => {

                    kapsterTable.innerHTML += `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHtml(
                                    item.nama
                                )}
                            </td>

                            <td>
                                ${item.transaksi.size}
                            </td>

                            <td>
                                ${formatRupiah(
                                    item.totalPenjualan
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    item.totalKomisi
                                )}
                            </td>

                        </tr>
                    `;

                }
            );

        }


        // ========================================
        // TAMPILKAN DETAIL
        // ========================================

        detailTable.innerHTML = "";


        if (detailData.length === 0) {

            detailTable.innerHTML = `
                <tr>
                    <td colspan="8">
                        Tidak ada detail transaksi.
                    </td>
                </tr>
            `;

        } else {

            // Buat map transaksi
            const transaksiMap =
                new Map();


            transaksiData.forEach(
                transaksi => {

                    transaksiMap.set(
                        transaksi.id,
                        transaksi
                    );

                }
            );


            detailData.forEach(
                detail => {

                    const transaksi =
                        transaksiMap.get(
                            detail.transaksi_id
                        );


                    if (!transaksi) {
                        return;
                    }


                    const namaKapster =
                        kapsterMapData.get(
                            detail.kapster_id
                        ) || "-";


                    const namaLayanan =
                        layananMapData.get(
                            detail.layanan_id
                        ) || "-";


                    detailTable.innerHTML += `
                        <tr>

                            <td>
                                ${formatTanggal(
                                    transaksi.tanggal
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    transaksi.nomor_transaksi
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    transaksi.nama_pelanggan || "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    namaLayanan
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    namaKapster
                                )}
                            </td>

                            <td>
                                ${detail.qty}
                            </td>

                            <td>
                                ${formatRupiah(
                                    detail.subtotal
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    detail.nilai_komisi
                                )}
                            </td>

                        </tr>
                    `;

                }
            );

        }


        // ========================================
        // SELESAI
        // ========================================

        message.textContent =
            `Laporan berhasil dimuat untuk periode ${tanggalMulai} sampai ${tanggalAkhir}.`;


    } catch (error) {

        console.error(
            "ERROR LAPORAN:",
            error
        );


        message.textContent =
            "Gagal mengambil laporan: " +
            (
                error.message ||
                error
            );


        kapsterTable.innerHTML = `
            <tr>
                <td colspan="5">

                    <strong>
                        Gagal mengambil laporan.
                    </strong>

                    <br><br>

                    ${escapeHtml(
                        error.message || error
                    )}

                </td>
            </tr>
        `;


        detailTable.innerHTML = `
            <tr>
                <td colspan="8">
                    Data laporan tidak dapat dimuat.
                </td>
            </tr>
        `;

    }
}


// ============================================
// FILTER BUTTON
// ============================================

document
    .getElementById("filterButton")
    .addEventListener(
        "click",
        loadLaporan
    );

// ============================================
// CEK STATUS LAPORAN SEBELUM EKSPOR
// ============================================

async function pastikanLaporanSiap() {
    // Muat ulang berdasarkan periode yang dipilih.
    await loadLaporan();

    const pesan = document
        .getElementById("message")
        .textContent;

    if (!pesan.includes("Laporan berhasil dimuat")) {
        alert(
            "Laporan belum berhasil dimuat. " +
            "Periksa pesan kesalahan pada halaman."
        );

        return false;
    }

    return true;
}


// ============================================
// KONVERSI RUPIAH MENJADI ANGKA
// ============================================

function rupiahKeAngkaCSV(nilai) {
    const angka = String(nilai ?? "")
        .replace(/[^\d-]/g, "");

    return angka === "" ? 0 : Number(angka);
}


// ============================================
// AMBIL ISI TABEL LAPORAN
// ============================================

function ambilBarisTabelCSV(idTabel) {
    const tbody = document.getElementById(idTabel);
    const table = tbody.closest("table");

    const headers = Array.from(
        table.querySelectorAll("thead th")
    ).map(th => th.innerText.trim());

    const hasil = [headers];

    tbody.querySelectorAll("tr").forEach(tr => {
        const cells = Array.from(
            tr.querySelectorAll("td")
        ).map(td =>
            td.innerText
                .replace(/\s+/g, " ")
                .trim()
        );

        if (cells.length === 0) {
            return;
        }

        const converted = cells.map((value, index) => {
            const header = (
                headers[index] || ""
            ).toLowerCase();

            const isMoneyColumn =
                header.includes("penjualan") ||
                header.includes("komisi") ||
                header === "subtotal";

            if (isMoneyColumn && /\d/.test(value)) {
                return rupiahKeAngkaCSV(value);
            }

            return value;
        });

        hasil.push(converted);
    });

    return hasil;
}


// ============================================
// PENGAMAN NILAI CSV
// ============================================

function escapeNilaiCSV(nilai) {
    let teks = String(nilai ?? "");

    // Mencegah teks yang berpotensi menjadi rumus
    // dijalankan ketika CSV dibuka di spreadsheet.
    if (/^[\t\r ]*[=+\-@]/.test(teks)) {
        teks = "'" + teks;
    }

    return '"' + teks.replace(/"/g, '""') + '"';
}


// ============================================
// EKSPOR LAPORAN KOMISI KE CSV
// ============================================

async function eksporLaporanCSV() {
    const siap = await pastikanLaporanSiap();

    if (!siap) {
        return;
    }

    const tanggalMulai = document
        .getElementById("tanggalMulai")
        .value;

    const tanggalAkhir = document
        .getElementById("tanggalAkhir")
        .value;

    const jumlahTransaksi = Number(
        document
            .getElementById("jumlahTransaksi")
            .textContent
    ) || 0;

    const totalPenjualan = rupiahKeAngkaCSV(
        document
            .getElementById("totalPenjualan")
            .textContent
    );

    const totalKomisi = rupiahKeAngkaCSV(
        document
            .getElementById("totalKomisi")
            .textContent
    );

    const barisCSV = [
        ["SISTEM INFORMASI AKUNTANSI BARBERSHOP"],
        ["LAPORAN KOMISI KAPSTER"],
        [
            "Periode",
            tanggalMulai,
            "sampai",
            tanggalAkhir
        ],
        [],

        ["RINGKASAN UMUM"],
        ["Jumlah Transaksi", jumlahTransaksi],
        ["Total Penjualan (Rp)", totalPenjualan],
        ["Total Komisi (Rp)", totalKomisi],
        [],

        ["RINGKASAN KOMISI PER KAPSTER"],

        ...ambilBarisTabelCSV(
            "laporanKapsterTable"
        ),

        [],

        ["RINCIAN TRANSAKSI"],

        ...ambilBarisTabelCSV(
            "detailLaporanTable"
        )
    ];

    const isiCSV =
        "\uFEFF" +
        barisCSV
            .map(baris =>
                baris
                    .map(escapeNilaiCSV)
                    .join(",")
            )
            .join("\r\n");

    const file = new Blob(
        [isiCSV],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;

    link.download =
        `laporan-komisi-${tanggalMulai}-sampai-${tanggalAkhir}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


// ============================================
// CETAK LAPORAN ATAU SIMPAN KE PDF
// ============================================

async function cetakLaporanPDF() {
    const siap = await pastikanLaporanSiap();

    if (!siap) {
        return;
    }

    const tanggalMulai = document
        .getElementById("tanggalMulai")
        .value;

    const tanggalAkhir = document
        .getElementById("tanggalAkhir")
        .value;

    document.getElementById(
        "printPeriod"
    ).textContent =
        `Periode laporan: ${tanggalMulai} sampai ${tanggalAkhir}`;

    window.print();
}


// ============================================
// HUBUNGKAN TOMBOL
// ============================================

document.getElementById(
    "exportCsvButton"
).onclick = eksporLaporanCSV;

document.getElementById(
    "printReportButton"
).onclick = cetakLaporanPDF;

// ============================================
// INITIALIZE
// ============================================

setDefaultDate();

loadLaporan();