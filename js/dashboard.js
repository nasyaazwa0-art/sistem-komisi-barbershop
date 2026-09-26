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
// GET TANGGAL BULAN BERJALAN
// ============================================

function getCurrentMonthRange() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const nextMonth =
        new Date(
            year,
            now.getMonth() + 1,
            1
        );

    const nextYear =
        nextMonth.getFullYear();

    const nextMonthNumber =
        String(
            nextMonth.getMonth() + 1
        ).padStart(2, "0");


    return {

        start:
            `${year}-${month}-01T00:00:00+07:00`,

        end:
            `${nextYear}-${nextMonthNumber}-01T00:00:00+07:00`

    };
}


// ============================================
// LOAD DASHBOARD
// ============================================

async function loadDashboard() {

    const message =
        document.getElementById(
            "dashboardMessage"
        );


    const table =
        document.getElementById(
            "dashboardKapsterTable"
        );


    try {

        if (!window.db) {

            throw new Error(
                "Supabase belum terhubung."
            );

        }


        message.textContent =
            "Mengambil data dashboard...";


        const {
            start,
            end
        } =
            getCurrentMonthRange();


        // ====================================
        // AMBIL TRANSAKSI BULAN BERJALAN
        // ====================================

        const transaksiResult =
            await window.db
                .from("transaksi")
                .select(`
                    id,
                    total,
                    tanggal
                `)
                .gte(
                    "tanggal",
                    start
                )
                .lt(
                    "tanggal",
                    end
                );


        if (transaksiResult.error) {

            throw transaksiResult.error;

        }


        const transaksiData =
            transaksiResult.data || [];


        // ====================================
        // TOTAL TRANSAKSI
        // ====================================

        let totalPenjualan =
            0;


        transaksiData.forEach(
            function (transaksi) {

                totalPenjualan +=
                    Number(
                        transaksi.total
                    ) || 0;

            }
        );


        // ====================================
        // DETAIL TRANSAKSI
        // ====================================

        let detailData = [];


        if (transaksiData.length > 0) {

            const transaksiIds =
                transaksiData.map(
                    transaksi =>
                        transaksi.id
                );


            const detailResult =
                await window.db
                    .from("detail_transaksi")
                    .select(`
                        id,
                        transaksi_id,
                        kapster_id,
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


            detailData =
                detailResult.data || [];

        }


        // ====================================
        // TOTAL KOMISI
        // ====================================

        let totalKomisi =
            0;


        detailData.forEach(
            function (detail) {

                totalKomisi +=
                    Number(
                        detail.nilai_komisi
                    ) || 0;

            }
        );


        // ====================================
        // SUMMARY
        // ====================================

        document.getElementById(
            "dashboardJumlahTransaksi"
        ).textContent =
            transaksiData.length;


        document.getElementById(
            "dashboardTotalPenjualan"
        ).textContent =
            formatRupiah(
                totalPenjualan
            );


        document.getElementById(
            "dashboardTotalKomisi"
        ).textContent =
            formatRupiah(
                totalKomisi
            );


        // ====================================
        // AMBIL KAPSTER
        // ====================================

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
        // AGREGASI KAPSTER
        // ====================================

        const laporanKapster =
            new Map();


        detailData.forEach(
            function (detail) {

                const id =
                    detail.kapster_id;


                const nama =
                    kapsterMap.get(id) ||
                    "Kapster Tidak Ditemukan";


                if (!laporanKapster.has(id)) {

                    laporanKapster.set(
                        id,
                        {
                            nama:
                                nama,

                            penjualan:
                                0,

                            komisi:
                                0
                        }
                    );

                }


                const item =
                    laporanKapster.get(id);


                item.penjualan +=
                    Number(
                        detail.subtotal
                    ) || 0;


                item.komisi +=
                    Number(
                        detail.nilai_komisi
                    ) || 0;

            }
        );


        // ====================================
        // TAMPILKAN KAPSTER
        // ====================================

        const kapsterArray =
            Array.from(
                laporanKapster.values()
            );


        kapsterArray.sort(
            function (a, b) {

                return (
                    b.komisi -
                    a.komisi
                );

            }
        );


        table.innerHTML =
            "";


        if (kapsterArray.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">
                        Belum ada transaksi bulan ini.
                    </td>
                </tr>
            `;

        } else {

            kapsterArray.forEach(
                function (item, index) {

                    table.innerHTML += `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${item.nama}
                            </td>

                            <td>
                                ${formatRupiah(
                                    item.penjualan
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    item.komisi
                                )}
                            </td>

                        </tr>
                    `;

                }
            );

        }


        message.textContent =
            "Dashboard berhasil dimuat.";


    } catch (error) {

        console.error(
            "ERROR DASHBOARD:",
            error
        );


        message.textContent =
            "Gagal memuat dashboard: " +
            (
                error.message ||
                error
            );


        table.innerHTML = `
            <tr>
                <td colspan="4">
                    Gagal mengambil data.
                    <br><br>
                    ${error.message || error}
                </td>
            </tr>
        `;

    }

}


// ============================================
// JALANKAN
// ============================================

loadDashboard();