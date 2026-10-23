from flask import Flask, render_template, jsonify, request, Response
import pandas as pd
import os
import io

app = Flask(__name__)

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "all_weekly_excess_deaths.csv"
)


# ============================================================
# LOAD DATASET
# ============================================================

def load_data():

    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(
            "all_weekly_excess_deaths.csv was not found."
        )

    df = pd.read_csv(DATA_FILE)

    # Remove unwanted spaces from column names
    df.columns = df.columns.str.strip()

    # --------------------------------------------------------
    # Convert date
    # --------------------------------------------------------

    if "start_date" in df.columns:
        df["start_date"] = pd.to_datetime(
            df["start_date"],
            dayfirst=True,
            errors="coerce"
        )

    if "end_date" in df.columns:
        df["end_date"] = pd.to_datetime(
            df["end_date"],
            dayfirst=True,
            errors="coerce"
        )

    # --------------------------------------------------------
    # Numeric columns
    # --------------------------------------------------------

    numeric_columns = [
        "population",
        "total_deaths",
        "covid_deaths",
        "expected_deaths",
        "excess_deaths",
        "non_covid_deaths",
        "covid_deaths_per_100k",
        "excess_deaths_per_100k",
        "excess_deaths_pct_change",
        "year",
        "week"
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    return df


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")


# ============================================================
# METADATA
# ============================================================

@app.route("/api/metadata")
def metadata():

    try:

        df = load_data()

        countries = sorted(
            df["country"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

        years = sorted(
            df["year"]
            .dropna()
            .astype(int)
            .unique()
            .tolist()
        )

        return jsonify({
            "success": True,
            "records": int(len(df)),
            "countries": countries,
            "country_count": len(countries),
            "years": years,
            "columns": df.columns.tolist(),
            "missing_values": int(
                df.isnull().sum().sum()
            ),
            "duplicates": int(
                df.duplicated().sum()
            )
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# FILTER DATA
# ============================================================

def filter_data(df):

    country = request.args.get(
        "country",
        "All"
    )

    year = request.args.get(
        "year",
        "All"
    )

    start_date = request.args.get(
        "start_date",
        ""
    )

    end_date = request.args.get(
        "end_date",
        ""
    )

    # --------------------------------------------------------
    # Country filter
    # --------------------------------------------------------

    if (
        country
        and country.lower() != "all"
    ):

        df = df[
            df["country"].astype(str).str.lower()
            == country.lower()
        ]

    # --------------------------------------------------------
    # Year filter
    # --------------------------------------------------------

    if (
        year
        and year.lower() != "all"
    ):

        try:

            selected_year = int(year)

            df = df[
                df["year"] == selected_year
            ]

        except ValueError:
            pass

    # --------------------------------------------------------
    # Start date filter
    # --------------------------------------------------------

    if start_date:

        start = pd.to_datetime(
            start_date,
            errors="coerce"
        )

        if pd.notna(start):

            df = df[
                df["start_date"] >= start
            ]

    # --------------------------------------------------------
    # End date filter
    # --------------------------------------------------------

    if end_date:

        end = pd.to_datetime(
            end_date,
            errors="coerce"
        )

        if pd.notna(end):

            df = df[
                df["start_date"] <= end
            ]

    return df


# ============================================================
# ANALYSIS API
# ============================================================

@app.route("/api/analysis")
def analysis():

    try:

        df = load_data()

        df = filter_data(df)

        if df.empty:

            return jsonify({
                "success": False,
                "error": "No records found for the selected filters."
            }), 404

        # ----------------------------------------------------
        # Numeric calculations
        # ----------------------------------------------------

        total_deaths = df[
            "total_deaths"
        ].sum()

        covid_deaths = df[
            "covid_deaths"
        ].sum()

        expected_deaths = df[
            "expected_deaths"
        ].sum()

        excess_deaths = df[
            "excess_deaths"
        ].sum()

        non_covid_deaths = df[
            "non_covid_deaths"
        ].sum()

        avg_covid_rate = df[
            "covid_deaths_per_100k"
        ].mean()

        avg_excess_rate = df[
            "excess_deaths_per_100k"
        ].mean()

        max_excess = df[
            "excess_deaths"
        ].max()

        min_excess = df[
            "excess_deaths"
        ].min()

        max_covid = df[
            "covid_deaths"
        ].max()

        # Population is normally constant per country
        population = (
            df["population"]
            .dropna()
            .iloc[0]
            if not df["population"].dropna().empty
            else 0
        )

        # ----------------------------------------------------
        # Highest excess-death week
        # ----------------------------------------------------

        max_row = df.loc[
            df["excess_deaths"].idxmax()
        ]

        peak_week = {
            "year": int(max_row["year"])
            if pd.notna(max_row["year"])
            else None,

            "week": int(max_row["week"])
            if pd.notna(max_row["week"])
            else None,

            "date":
                max_row["start_date"].strftime("%d-%m-%Y")
                if pd.notna(max_row["start_date"])
                else "",

            "value": float(
                max_row["excess_deaths"]
            )
        }

        # ----------------------------------------------------
        # Chart data
        # ----------------------------------------------------

        chart_df = df.sort_values(
            ["start_date", "year", "week"]
        )

        labels = []

        for _, row in chart_df.iterrows():

            if pd.notna(row["start_date"]):

                labels.append(
                    row["start_date"].strftime(
                        "%d-%m-%Y"
                    )
                )

            else:

                labels.append(
                    f"{int(row['year'])}-W{int(row['week'])}"
                )

        # ----------------------------------------------------
        # Country information
        # ----------------------------------------------------

        countries_selected = sorted(
            df["country"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

        # ----------------------------------------------------
        # Table records
        # ----------------------------------------------------

        table_data = []

        for _, row in chart_df.iterrows():

            table_data.append({

                "country":
                    str(row["country"]),

                "year":
                    int(row["year"])
                    if pd.notna(row["year"])
                    else None,

                "week":
                    int(row["week"])
                    if pd.notna(row["week"])
                    else None,

                "start_date":
                    row["start_date"].strftime(
                        "%d-%m-%Y"
                    )
                    if pd.notna(row["start_date"])
                    else "",

                "total_deaths":
                    float(row["total_deaths"]),

                "covid_deaths":
                    float(row["covid_deaths"]),

                "expected_deaths":
                    float(row["expected_deaths"]),

                "excess_deaths":
                    float(row["excess_deaths"]),

                "covid_deaths_per_100k":
                    float(
                        row["covid_deaths_per_100k"]
                    ),

                "excess_deaths_per_100k":
                    float(
                        row["excess_deaths_per_100k"]
                    )

            })

        # ----------------------------------------------------
        # JSON response
        # ----------------------------------------------------

        result = {

            "success": True,

            "filters": {

                "countries": countries_selected,

                "record_count":
                    int(len(df))

            },

            "summary": {

                "record_count":
                    int(len(df)),

                "total_deaths":
                    round(float(total_deaths), 2),

                "covid_deaths":
                    round(float(covid_deaths), 2),

                "expected_deaths":
                    round(float(expected_deaths), 2),

                "excess_deaths":
                    round(float(excess_deaths), 2),

                "non_covid_deaths":
                    round(float(non_covid_deaths), 2),

                "avg_covid_rate":
                    round(float(avg_covid_rate), 2),

                "avg_excess_rate":
                    round(float(avg_excess_rate), 2),

                "max_excess":
                    round(float(max_excess), 2),

                "min_excess":
                    round(float(min_excess), 2),

                "max_covid":
                    round(float(max_covid), 2),

                "population":
                    int(population)

            },

            "peak_week":
                peak_week,

            "chart": {

                "labels":
                    labels,

                "observed_deaths":
                    chart_df[
                        "total_deaths"
                    ].fillna(0).tolist(),

                "expected_deaths":
                    chart_df[
                        "expected_deaths"
                    ].fillna(0).tolist(),

                "covid_deaths":
                    chart_df[
                        "covid_deaths"
                    ].fillna(0).tolist(),

                "excess_deaths":
                    chart_df[
                        "excess_deaths"
                    ].fillna(0).tolist(),

                "covid_rate":
                    chart_df[
                        "covid_deaths_per_100k"
                    ].fillna(0).tolist(),

                "excess_rate":
                    chart_df[
                        "excess_deaths_per_100k"
                    ].fillna(0).tolist()

            },

            "table":
                table_data

        }

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# COUNTRY COMPARISON
# ============================================================

@app.route("/api/comparison")
def comparison():

    try:

        df = load_data()

        year = request.args.get(
            "year",
            "All"
        )

        if (
            year
            and year.lower() != "all"
        ):

            df = df[
                df["year"] == int(year)
            ]

        if df.empty:

            return jsonify({
                "success": False,
                "error": "No comparison data found."
            }), 404

        grouped = (
            df.groupby("country")
            .agg(
                total_deaths=(
                    "total_deaths",
                    "sum"
                ),

                covid_deaths=(
                    "covid_deaths",
                    "sum"
                ),

                excess_deaths=(
                    "excess_deaths",
                    "sum"
                ),

                avg_excess_rate=(
                    "excess_deaths_per_100k",
                    "mean"
                ),

                avg_covid_rate=(
                    "covid_deaths_per_100k",
                    "mean"
                )
            )
            .reset_index()
        )

        grouped = grouped.sort_values(
            "avg_excess_rate",
            ascending=False
        )

        records = []

        for _, row in grouped.iterrows():

            records.append({

                "country":
                    str(row["country"]),

                "total_deaths":
                    round(
                        float(
                            row["total_deaths"]
                        ),
                        2
                    ),

                "covid_deaths":
                    round(
                        float(
                            row["covid_deaths"]
                        ),
                        2
                    ),

                "excess_deaths":
                    round(
                        float(
                            row["excess_deaths"]
                        ),
                        2
                    ),

                "avg_excess_rate":
                    round(
                        float(
                            row["avg_excess_rate"]
                        ),
                        2
                    ),

                "avg_covid_rate":
                    round(
                        float(
                            row["avg_covid_rate"]
                        ),
                        2
                    )

            })

        return jsonify({
            "success": True,
            "data": records
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# DOWNLOAD FILTERED DATA
# ============================================================

@app.route("/api/download")
def download():

    try:

        df = load_data()

        df = filter_data(df)

        if df.empty:

            return "No data available.", 404

        output = io.StringIO()

        df.to_csv(
            output,
            index=False
        )

        output.seek(0)

        return Response(

            output.getvalue(),

            mimetype="text/csv",

            headers={
                "Content-Disposition":
                    "attachment; filename=filtered_covid_data.csv"
            }

        )

    except Exception as e:

        return str(e), 500


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("COVID-19 DATA ANALYSIS SYSTEM")
    print("=" * 60)
    print("Dataset:", DATA_FILE)
    print("Open: http://127.0.0.1:5000")
    print("=" * 60)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )