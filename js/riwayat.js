// ============================================
// DATA
// ============================================

let semuaTransaksi = [];


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

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(new Date(tanggal));

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
// LOAD TRANSAKSI
// ============================================

async function loadTransaksi() {

    const table =
        document.getElementById(
            "transaksiTable"
        );

    const message =
        document.getElementById(
            "message"
        );


    try {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Mengambil data...
                </td>
            </tr>
        `;


        if (!window.db) {

            throw new Error(
                "Supabase belum terhubung."
            );

        }


        const result =
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
                .order(
                    "tanggal",
                    {
                        ascending: false
                    }
                );


        if (result.error) {

            throw result.error;

        }


        semuaTransaksi =
            result.data || [];


        tampilkanTransaksi(
            semuaTransaksi
        );


        message.textContent =
            `${semuaTransaksi.length} transaksi ditemukan.`;


    } catch (error) {

        console.error(
            "ERROR RIWAYAT:",
            error
        );


        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Gagal mengambil data transaksi.
                    <br><br>
                    ${escapeHtml(
                        error.message || error
                    )}
                </td>
            </tr>
        `;


        message.textContent =
            "Gagal memuat riwayat transaksi.";

    }

}


// ============================================
// TAMPILKAN TRANSAKSI
// ============================================

function tampilkanTransaksi(data) {

    const table =
        document.getElementById(
            "transaksiTable"
        );


    table.innerHTML = "";


    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Tidak ada transaksi.
                </td>
            </tr>
        `;

        return;
    }


    data.forEach(
        function (transaksi, index) {

            table.innerHTML += `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(
                            transaksi.nomor_transaksi
                        )}
                    </td>

                    <td>
                        ${formatTanggal(
                            transaksi.tanggal
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            transaksi.nama_pelanggan ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            transaksi.metode_pembayaran
                        ).toUpperCase()}
                    </td>

                    <td>
                        ${formatRupiah(
                            transaksi.total
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="lihatDetail('${transaksi.id}')"
                        >
                            Detail
                        </button>

                    </td>

                </tr>
            `;

        }
    );

}


// ============================================
// FILTER
// ============================================

function filterTransaksi() {

    const keyword =
        document.getElementById(
            "searchInput"
        ).value
            .trim()
            .toLowerCase();


    const tanggal =
        document.getElementById(
            "filterTanggal"
        ).value;


    const hasil =
        semuaTransaksi.filter(
            function (transaksi) {

                // ----------------------------
                // SEARCH
                // ----------------------------

                const nomor =
                    (
                        transaksi.nomor_transaksi ||
                        ""
                    )
                    .toLowerCase();


                const pelanggan =
                    (
                        transaksi.nama_pelanggan ||
                        ""
                    )
                    .toLowerCase();


                const cocokKeyword =
                    !keyword ||
                    nomor.includes(
                        keyword
                    ) ||
                    pelanggan.includes(
                        keyword
                    );


                // ----------------------------
                // FILTER TANGGAL
                // ----------------------------

                let cocokTanggal =
                    true;


                if (tanggal) {

                    const tanggalTransaksi =
                        new Date(
                            transaksi.tanggal
                        );


                    const year =
                        tanggalTransaksi
                            .getFullYear();


                    const month =
                        String(
                            tanggalTransaksi
                                .getMonth() + 1
                        )
                            .padStart(2, "0");


                    const day =
                        String(
                            tanggalTransaksi
                                .getDate()
                        )
                            .padStart(2, "0");


                    const tanggalFormatted =
                        `${year}-${month}-${day}`;


                    cocokTanggal =
                        tanggalFormatted ===
                        tanggal;

                }


                return (
                    cocokKeyword &&
                    cocokTanggal
                );

            }
        );


    tampilkanTransaksi(
        hasil
    );


    document.getElementById(
        "message"
    ).textContent =
        `${hasil.length} transaksi ditemukan.`;

}


// ============================================
// LIHAT DETAIL
// ============================================

async function lihatDetail(
    transaksiId
) {

    const modal =
        document.getElementById(
            "detailModal"
        );


    const content =
        document.getElementById(
            "detailContent"
        );


    modal.classList.add(
        "show"
    );


    content.innerHTML =
        "Mengambil detail transaksi...";


    try {

        // ====================================
        // HEADER
        // ====================================

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
                .eq(
                    "id",
                    transaksiId
                )
                .single();


        if (transaksiResult.error) {

            throw transaksiResult.error;

        }


        const transaksi =
            transaksiResult.data;


        // ====================================
        // DETAIL
        // ====================================

        const detailResult =
            await window.db
                .from("detail_transaksi")
                .select(`
                    id,
                    layanan_id,
                    kapster_id,
                    qty,
                    harga_satuan,
                    persentase_komisi,
                    subtotal,
                    nilai_komisi
                `)
                .eq(
                    "transaksi_id",
                    transaksiId
                );


        if (detailResult.error) {

            throw detailResult.error;

        }


        const details =
            detailResult.data || [];


        // ====================================
        // AMBIL ID MASTER
        // ====================================

        const layananIds = [
            ...new Set(
                details
                    .map(
                        detail =>
                            detail.layanan_id
                    )
                    .filter(Boolean)
            )
        ];


        const kapsterIds = [
            ...new Set(
                details
                    .map(
                        detail =>
                            detail.kapster_id
                    )
                    .filter(Boolean)
            )
        ];


        // ====================================
        // AMBIL LAYANAN
        // ====================================

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


        // ====================================
        // AMBIL KAPSTER
        // ====================================

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


        // ====================================
        // MAP LAYANAN
        // ====================================

        const layananMap =
            new Map();


        layananData.forEach(
            function (layanan) {

                layananMap.set(
                    layanan.id,
                    layanan.nama_layanan
                );

            }
        );


        // ====================================
        // MAP KAPSTER
        // ====================================

        const kapsterMap =
            new Map();


        kapsterData.forEach(
            function (kapster) {

                kapsterMap.set(
                    kapster.id,
                    kapster.nama
                );

            }
        );


        // ====================================
        // TOTAL KOMISI
        // ====================================

        let totalKomisi =
            0;


        details.forEach(
            function (detail) {

                totalKomisi +=
                    Number(
                        detail.nilai_komisi
                    ) || 0;

            }
        );


        // ====================================
        // BUAT DETAIL HTML
        // ====================================

        let detailRows =
            "";


        details.forEach(
            function (detail) {

                const namaLayanan =
                    layananMap.get(
                        detail.layanan_id
                    ) || "-";


                const namaKapster =
                    kapsterMap.get(
                        detail.kapster_id
                    ) || "-";


                detailRows += `
                    <tr>

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
                                detail.harga_satuan
                            )}
                        </td>

                        <td>
                            ${detail.persentase_komisi}%
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


        // ====================================
        // TAMPILKAN DETAIL
        // ====================================

        content.innerHTML = `

            <div class="transaction-info">

                <div>
                    <strong>
                        Nomor Transaksi
                    </strong>

                    <span>
                        ${escapeHtml(
                            transaksi.nomor_transaksi
                        )}
                    </span>
                </div>


                <div>
                    <strong>
                        Tanggal
                    </strong>

                    <span>
                        ${formatTanggal(
                            transaksi.tanggal
                        )}
                    </span>
                </div>


                <div>
                    <strong>
                        Pelanggan
                    </strong>

                    <span>
                        ${escapeHtml(
                            transaksi.nama_pelanggan ||
                            "-"
                        )}
                    </span>
                </div>


                <div>
                    <strong>
                        Metode Pembayaran
                    </strong>

                    <span>
                        ${escapeHtml(
                            transaksi.metode_pembayaran
                        ).toUpperCase()}
                    </span>
                </div>

            </div>


            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Layanan
                            </th>

                            <th>
                                Kapster
                            </th>

                            <th>
                                Qty
                            </th>

                            <th>
                                Harga
                            </th>

                            <th>
                                Komisi
                            </th>

                            <th>
                                Subtotal
                            </th>

                            <th>
                                Nilai Komisi
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${detailRows}

                    </tbody>

                </table>

            </div>


            <div class="detail-total">

                <div>

                    <strong>
                        Total Transaksi
                    </strong>

                    <span>
                        ${formatRupiah(
                            transaksi.total
                        )}
                    </span>

                </div>


                <div>

                    <strong>
                        Total Komisi
                    </strong>

                    <span>
                        ${formatRupiah(
                            totalKomisi
                        )}
                    </span>

                </div>

            </div>
        `;


    } catch (error) {

        console.error(
            "ERROR DETAIL:",
            error
        );


        content.innerHTML = `
            <p>
                Gagal mengambil detail transaksi.
            </p>

            <p>
                ${escapeHtml(
                    error.message || error
                )}
            </p>
        `;

    }

}


// ============================================
// RESET FILTER
// ============================================

document
    .getElementById(
        "resetFilterButton"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "searchInput"
            ).value = "";


            document.getElementById(
                "filterTanggal"
            ).value = "";


            tampilkanTransaksi(
                semuaTransaksi
            );


            document.getElementById(
                "message"
            ).textContent =
                `${semuaTransaksi.length} transaksi ditemukan.`;

        }
    );


// ============================================
// SEARCH
// ============================================

document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "input",
        filterTransaksi
    );


// ============================================
// FILTER TANGGAL
// ============================================

document
    .getElementById(
        "filterTanggal"
    )
    .addEventListener(
        "change",
        filterTransaksi
    );


// ============================================
// CLOSE MODAL
// ============================================

document
    .getElementById(
        "closeModalButton"
    )
    .addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "detailModal"
                )
                .classList.remove(
                    "show"
                );

        }
    );


// ============================================
// CLOSE KETIKA KLIK LUAR MODAL
// ============================================

document
    .getElementById(
        "detailModal"
    )
    .addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                this
            ) {

                this.classList.remove(
                    "show"
                );

            }

        }
    );


// ============================================
// JALANKAN
// ============================================

loadTransaksi();