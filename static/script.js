// ============================================================
// GLOBAL VARIABLES
// ============================================================

let mainChart = null;
let observedChart = null;
let comparisonChart = null;
let countryComparisonChart = null;

let currentTableData = [];

let currentPage = 1;

const rowsPerPage = 15;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadMetadata();

        setupEvents();

    }
);


// ============================================================
// SETUP EVENTS
// ============================================================

function setupEvents() {

    document
        .getElementById("applyBtn")
        .addEventListener(
            "click",
            loadAnalysis
        );


    document
        .getElementById("resetBtn")
        .addEventListener(
            "click",
            resetFilters
        );


    document
        .getElementById("downloadBtn")
        .addEventListener(
            "click",
            downloadCSV
        );


    document
        .getElementById("sortSelect")
        .addEventListener(
            "change",
            sortTable
        );


    document
        .getElementById("sortOrder")
        .addEventListener(
            "change",
            sortTable
        );


    document
        .getElementById("previousBtn")
        .addEventListener(
            "click",
            previousPage
        );


    document
        .getElementById("nextBtn")
        .addEventListener(
            "click",
            nextPage
        );


    document
        .getElementById("chartType")
        .addEventListener(
            "change",
            loadAnalysis
        );


    document
        .getElementById("metricSelect")
        .addEventListener(
            "change",
            loadAnalysis
        );


    document
        .getElementById("comparisonMetric")
        .addEventListener(
            "change",
            loadCountryComparison
        );

}


// ============================================================
// LOAD METADATA
// ============================================================

async function loadMetadata() {

    try {

        const response =
            await fetch("/api/metadata");

        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error
            );
        }


        // --------------------------------------------
        // Dataset information
        // --------------------------------------------

        document
            .getElementById(
                "datasetRecords"
            )
            .textContent =
            formatNumber(
                data.records
            );


        document
            .getElementById(
                "datasetCountries"
            )
            .textContent =
            data.country_count;


        document
            .getElementById(
                "missingValues"
            )
            .textContent =
            data.missing_values;


        document
            .getElementById(
                "duplicateRows"
            )
            .textContent =
            data.duplicates;


        // --------------------------------------------
        // Country dropdown
        // --------------------------------------------

        const countrySelect =
            document.getElementById(
                "countrySelect"
            );


        countrySelect.innerHTML =
            `<option value="All">
                All Countries
            </option>`;


        data.countries.forEach(
            country => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = country;

                option.textContent = country;

                countrySelect.appendChild(
                    option
                );

            }
        );


        // --------------------------------------------
        // Year dropdown
        // --------------------------------------------

        const yearSelect =
            document.getElementById(
                "yearSelect"
            );


        yearSelect.innerHTML =
            `<option value="All">
                All Years
            </option>`;


        data.years.forEach(
            year => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = year;

                option.textContent = year;

                yearSelect.appendChild(
                    option
                );

            }
        );


        showStatus(
            "Dashboard loaded successfully."
        );


        // Load initial analysis

        await loadAnalysis();

        await loadCountryComparison();

    }

    catch (error) {

        console.error(error);

        showStatus(
            "Error loading dataset: " +
            error.message,
            true
        );

    }

}


// ============================================================
// LOAD ANALYSIS
// ============================================================

async function loadAnalysis() {

    try {

        showStatus(
            "Analyzing selected data..."
        );


        const params =
            getFilterParams();


        const response =
            await fetch(
                "/api/analysis?" +
                params.toString()
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Unable to load analysis."
            );

        }


        updateKPIs(
            data.summary
        );


        updateInsights(
            data.summary,
            data.peak_week
        );


        updateMainChart(
            data.chart
        );


        updateObservedChart(
            data.chart
        );


        updateComparisonChart(
            data.chart
        );


        currentTableData =
            data.table;


        currentPage = 1;


        sortTable();


        showStatus(
            `Analysis completed for ${data.filters.record_count.toLocaleString()} records.`
        );

    }

    catch (error) {

        console.error(error);

        showStatus(
            error.message,
            true
        );

        clearDashboard();

    }

}


// ============================================================
// GET FILTER PARAMETERS
// ============================================================

function getFilterParams() {

    const params =
        new URLSearchParams();


    const country =
        document.getElementById(
            "countrySelect"
        ).value;


    const year =
        document.getElementById(
            "yearSelect"
        ).value;


    const startDate =
        document.getElementById(
            "startDate"
        ).value;


    const endDate =
        document.getElementById(
            "endDate"
        ).value;


    params.set(
        "country",
        country
    );


    params.set(
        "year",
        year
    );


    if (startDate) {

        params.set(
            "start_date",
            startDate
        );

    }


    if (endDate) {

        params.set(
            "end_date",
            endDate
        );

    }


    return params;

}


// ============================================================
// UPDATE KPI CARDS
// ============================================================

function updateKPIs(summary) {

    document.getElementById(
        "recordCount"
    ).textContent =
        formatNumber(
            summary.record_count
        );


    document.getElementById(
        "totalDeaths"
    ).textContent =
        formatNumber(
            summary.total_deaths
        );


    document.getElementById(
        "covidDeaths"
    ).textContent =
        formatNumber(
            summary.covid_deaths
        );


    document.getElementById(
        "excessDeaths"
    ).textContent =
        formatNumber(
            summary.excess_deaths
        );


    document.getElementById(
        "excessRate"
    ).textContent =
        Number(
            summary.avg_excess_rate
        ).toFixed(2);


    document.getElementById(
        "population"
    ).textContent =
        formatNumber(
            summary.population
        );

}


// ============================================================
// UPDATE INSIGHTS
// ============================================================

function updateInsights(
    summary,
    peakWeek
) {

    document.getElementById(
        "avgCovidRate"
    ).textContent =
        Number(
            summary.avg_covid_rate
        ).toFixed(2);


    document.getElementById(
        "avgExcessRate"
    ).textContent =
        Number(
            summary.avg_excess_rate
        ).toFixed(2);


    document.getElementById(
        "maxExcess"
    ).textContent =
        formatNumber(
            summary.max_excess
        );


    document.getElementById(
        "peakWeek"
    ).textContent =
        peakWeek
            ? `${peakWeek.year} - Week ${peakWeek.week}`
            : "-";

}


// ============================================================
// MAIN CHART
// ============================================================

function updateMainChart(chartData) {

    const metric =
        document.getElementById(
            "metricSelect"
        ).value;


    const chartType =
        document.getElementById(
            "chartType"
        ).value;


    let values;
    let label;


    if (metric === "deaths") {

        values =
            chartData.observed_deaths;

        label =
            "Total Deaths";

    }

    else if (metric === "covid") {

        values =
            chartData.covid_deaths;

        label =
            "COVID Deaths";

    }

    else if (metric === "excess") {

        values =
            chartData.excess_deaths;

        label =
            "Excess Deaths";

    }

    else if (metric === "excess_rate") {

        values =
            chartData.excess_rate;

        label =
            "Excess Deaths / 100K";

    }

    else {

        values =
            chartData.covid_rate;

        label =
            "COVID Deaths / 100K";

    }


    document.getElementById(
        "mainChartTitle"
    ).textContent =
        label + " - Weekly Analysis";


    const ctx =
        document.getElementById(
            "mainChart"
        );


    if (mainChart) {

        mainChart.destroy();

    }


    mainChart =
        new Chart(
            ctx,
            {

                type: chartType,

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label: label,

                            data: values,

                            borderWidth: 2,

                            pointRadius:
                                chartType === "line"
                                    ? 1
                                    : 0,

                            tension: 0.25,

                            fill:
                                false

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    plugins: {

                        legend: {

                            display: true

                        },

                        tooltip: {

                            enabled: true

                        }

                    },

                    scales: {

                        x: {

                            ticks: {

                                maxTicksLimit: 15

                            }

                        },

                        y: {

                            beginAtZero: false,

                            title: {

                                display: true,

                                text: label

                            }

                        }

                    }

                }

            }
        );

}


// ============================================================
// OBSERVED VS EXPECTED CHART
// ============================================================

function updateObservedChart(
    chartData
) {

    const ctx =
        document.getElementById(
            "observedChart"
        );


    if (observedChart) {

        observedChart.destroy();

    }


    observedChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label:
                                "Observed Deaths",

                            data:
                                chartData.observed_deaths,

                            borderWidth: 2,

                            pointRadius: 0,

                            tension: 0.25

                        },

                        {

                            label:
                                "Expected Deaths",

                            data:
                                chartData.expected_deaths,

                            borderWidth: 2,

                            pointRadius: 0,

                            borderDash:
                                [6, 5],

                            tension: 0.25

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    scales: {

                        x: {

                            ticks: {

                                maxTicksLimit: 12

                            }

                        }

                    }

                }

            }
        );

}


// ============================================================
// COVID VS EXCESS CHART
// ============================================================

function updateComparisonChart(
    chartData
) {

    const ctx =
        document.getElementById(
            "comparisonChart"
        );


    if (comparisonChart) {

        comparisonChart.destroy();

    }


    comparisonChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels:
                        chartData.labels,

                    datasets: [

                        {

                            label:
                                "COVID Deaths",

                            data:
                                chartData.covid_deaths,

                            borderWidth: 2,

                            pointRadius: 0,

                            tension: 0.25

                        },

                        {

                            label:
                                "Excess Deaths",

                            data:
                                chartData.excess_deaths,

                            borderWidth: 2,

                            pointRadius: 0,

                            tension: 0.25

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    scales: {

                        x: {

                            ticks: {

                                maxTicksLimit: 12

                            }

                        }

                    }

                }

            }
        );

}


// ============================================================
// COUNTRY COMPARISON
// ============================================================

async function loadCountryComparison() {

    try {

        const year =
            document.getElementById(
                "yearSelect"
            ).value;


        const response =
            await fetch(
                "/api/comparison?year=" +
                encodeURIComponent(year)
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error
            );

        }


        const metric =
            document.getElementById(
                "comparisonMetric"
            ).value;


        const records =
            result.data;


        const labels =
            records.map(
                row => row.country
            );


        const values =
            records.map(
                row => row[metric]
            );


        const metricNames = {

            avg_excess_rate:
                "Average Excess Deaths / 100K",

            excess_deaths:
                "Total Excess Deaths",

            covid_deaths:
                "COVID Deaths",

            total_deaths:
                "Total Deaths"

        };


        const ctx =
            document.getElementById(
                "countryComparisonChart"
            );


        if (countryComparisonChart) {

            countryComparisonChart.destroy();

        }


        countryComparisonChart =
            new Chart(
                ctx,
                {

                    type: "bar",

                    data: {

                        labels: labels,

                        datasets: [

                            {

                                label:
                                    metricNames[
                                        metric
                                    ],

                                data: values,

                                borderWidth: 1

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        indexAxis: "y",

                        plugins: {

                            legend: {

                                display: true

                            }

                        },

                        scales: {

                            x: {

                                beginAtZero: true

                            }

                        }

                    }

                }
            );

    }

    catch (error) {

        console.error(
            "Comparison error:",
            error
        );

    }

}


// ============================================================
// TABLE SORTING
// ============================================================

function sortTable() {

    if (!currentTableData.length) {

        renderTable();

        return;

    }


    const sortBy =
        document.getElementById(
            "sortSelect"
        ).value;


    const order =
        document.getElementById(
            "sortOrder"
        ).value;


    currentTableData.sort(
        (a, b) => {

            let valueA;
            let valueB;


            if (sortBy === "date") {

                valueA =
                    new Date(
                        convertDate(a.start_date)
                    );

                valueB =
                    new Date(
                        convertDate(b.start_date)
                    );

            }

            else {

                valueA =
                    Number(
                        a[sortBy]
                    ) || 0;

                valueB =
                    Number(
                        b[sortBy]
                    ) || 0;

            }


            if (order === "asc") {

                return valueA - valueB;

            }

            return valueB - valueA;

        }
    );


    currentPage = 1;

    renderTable();

}


// ============================================================
// CONVERT DD-MM-YYYY TO DATE
// ============================================================

function convertDate(dateString) {

    if (!dateString) {

        return "";

    }


    const parts =
        dateString.split("-");


    if (parts.length !== 3) {

        return dateString;

    }


    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


// ============================================================
// RENDER TABLE
// ============================================================

function renderTable() {

    const table =
        document.getElementById(
            "dataTable"
        );


    table.innerHTML = "";


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                currentTableData.length /
                rowsPerPage
            )
        );


    if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    const start =
        (currentPage - 1) *
        rowsPerPage;


    const end =
        start + rowsPerPage;


    const rows =
        currentTableData.slice(
            start,
            end
        );


    rows.forEach(
        row => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    ${escapeHTML(row.country)}
                </td>

                <td>
                    ${row.year ?? "-"}
                </td>

                <td>
                    ${row.week ?? "-"}
                </td>

                <td>
                    ${escapeHTML(row.start_date)}
                </td>

                <td>
                    ${formatNumber(row.total_deaths)}
                </td>

                <td>
                    ${formatNumber(row.covid_deaths)}
                </td>

                <td>
                    ${formatNumber(row.expected_deaths)}
                </td>

                <td>
                    ${formatNumber(row.excess_deaths)}
                </td>

                <td>
                    ${Number(
                        row.excess_deaths_per_100k
                    ).toFixed(2)}
                </td>

            `;


            table.appendChild(tr);

        }
    );


    document.getElementById(
        "pageNumber"
    ).textContent =
        `Page ${currentPage} of ${totalPages}`;


    document.getElementById(
        "previousBtn"
    ).disabled =
        currentPage <= 1;


    document.getElementById(
        "nextBtn"
    ).disabled =
        currentPage >= totalPages;


    document.getElementById(
        "tableInfo"
    ).textContent =
        `${currentTableData.length.toLocaleString()} records found`;

}


// ============================================================
// PAGINATION
// ============================================================

function previousPage() {

    if (currentPage > 1) {

        currentPage--;

        renderTable();

    }

}


function nextPage() {

    const totalPages =
        Math.ceil(
            currentTableData.length /
            rowsPerPage
        );


    if (currentPage < totalPages) {

        currentPage++;

        renderTable();

    }

}


// ============================================================
// RESET FILTERS
// ============================================================

function resetFilters() {

    document.getElementById(
        "countrySelect"
    ).value = "All";


    document.getElementById(
        "yearSelect"
    ).value = "All";


    document.getElementById(
        "startDate"
    ).value = "";


    document.getElementById(
        "endDate"
    ).value = "";


    document.getElementById(
        "chartType"
    ).value = "line";


    document.getElementById(
        "metricSelect"
    ).value = "deaths";


    currentPage = 1;


    loadAnalysis();

    loadCountryComparison();

}


// ============================================================
// DOWNLOAD FILTERED CSV
// ============================================================

function downloadCSV() {

    const params =
        getFilterParams();


    window.location.href =
        "/api/download?" +
        params.toString();

}


// ============================================================
// STATUS MESSAGE
// ============================================================

function showStatus(
    message,
    error = false
) {

    const status =
        document.getElementById(
            "statusMessage"
        );


    status.textContent =
        message;


    status.classList.toggle(
        "error",
        error
    );

}


// ============================================================
// CLEAR DASHBOARD
// ============================================================

function clearDashboard() {

    const ids = [

        "recordCount",
        "totalDeaths",
        "covidDeaths",
        "excessDeaths",
        "excessRate",
        "population",
        "avgCovidRate",
        "avgExcessRate",
        "maxExcess",
        "peakWeek"

    ];


    ids.forEach(
        id => {

            document.getElementById(
                id
            ).textContent = "-";

        }
    );


    currentTableData = [];

    renderTable();

}


// ============================================================
// NUMBER FORMAT
// ============================================================

function formatNumber(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return "0";

    }


    return Math.round(number)
        .toLocaleString();

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}