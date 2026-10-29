/**
 * RETAILMIND AI - CHART.JS VISUALIZATION SUITE
 * Sales Overview, Demand Forecast, Category Breakdown,
 * and Profit & Cost Trends.
 */

// ============================================================
// SHARED CHART COLORS
// ============================================================

const CHART_COLORS = {
  primary: '#5A1188',
  primaryLight: '#7B2CBF',
  primaryGlow: 'rgba(90, 17, 136, 0.12)',
  accent: '#00D4A0',
  accentGlow: 'rgba(0, 212, 160, 0.18)',
  accentConfidence: 'rgba(0, 212, 160, 0.15)',
  dark: '#111827',
  muted: '#9CA3AF',
  grid: '#F3F4F6'
};

// ============================================================
// GLOBAL CHART DEFAULTS
// ============================================================

if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#6B7280';

  Chart.defaults.plugins.tooltip.backgroundColor = '#111827';
  Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
  Chart.defaults.plugins.tooltip.bodyColor = '#D1D5DB';
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.displayColors = true;
}

// ============================================================
// 1. SALES OVERVIEW CHART
// Supports 7D, 30D, 90D and 1Y
// Uses actual data supplied by dashboard.js
// ============================================================

let salesOverviewInstance = null;

function renderSalesOverviewChart(
  canvasId = 'salesOverviewChart',
  timeframe = '30D',
  chartData = null
) {
  const canvas = document.getElementById(canvasId);

  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  const ctx = canvas.getContext('2d');

  // Use actual dashboard data.
  // Do not display fabricated sales figures.
  const selected =
    chartData &&
      Array.isArray(chartData.labels) &&
      Array.isArray(chartData.revenue) &&
      Array.isArray(chartData.salesCount)
      ? chartData
      : {
        labels: [],
        revenue: [],
        salesCount: []
      };

  // Keep labels and datasets aligned.
  const length = Math.min(
    selected.labels.length,
    selected.revenue.length,
    selected.salesCount.length
  );

  const labels = selected.labels.slice(0, length);

  const revenue = selected.revenue
    .slice(0, length)
    .map(value => Math.max(0, Number(value) || 0));

  const orders = selected.salesCount
    .slice(0, length)
    .map(value => Math.max(0, Number(value) || 0));

  // ----------------------------------------------------------
  // DYNAMIC AXIS SCALING
  // ----------------------------------------------------------

  function getNiceMaximum(value) {
    if (value <= 0) {
      return 1;
    }

    const target = value * 1.15;
    const magnitude = Math.pow(
      10,
      Math.floor(Math.log10(target))
    );

    const fraction = target / magnitude;

    let niceFraction;

    if (fraction <= 1) {
      niceFraction = 1;
    } else if (fraction <= 2) {
      niceFraction = 2;
    } else if (fraction <= 5) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }

    return niceFraction * magnitude;
  }

  const maxRevenue = Math.max(0, ...revenue);
  const maxOrders = Math.max(0, ...orders);

  const revenueAxisMax = getNiceMaximum(maxRevenue);
  const ordersAxisMax = getNiceMaximum(maxOrders);

  // ----------------------------------------------------------
  // CHART GRADIENT
  // ----------------------------------------------------------

  const purpleGradient = ctx.createLinearGradient(
    0,
    0,
    0,
    320
  );

  purpleGradient.addColorStop(
    0,
    'rgba(123, 44, 191, 0.25)'
  );

  purpleGradient.addColorStop(
    1,
    'rgba(123, 44, 191, 0.00)'
  );

  // ----------------------------------------------------------
  // DESTROY PREVIOUS CHART INSTANCE
  // ----------------------------------------------------------

  if (salesOverviewInstance) {
    salesOverviewInstance.destroy();
    salesOverviewInstance = null;
  }

  // ----------------------------------------------------------
  // CREATE SALES OVERVIEW CHART
  // ----------------------------------------------------------

  salesOverviewInstance = new Chart(ctx, {
    type: 'line',

    data: {
      labels: labels,

      datasets: [
        // Revenue
        {
          label: 'Revenue (₹)',
          data: revenue,

          yAxisID: 'y',

          borderColor: CHART_COLORS.primaryLight,
          backgroundColor: purpleGradient,

          borderWidth: 3,
          fill: true,
          tension: 0.25,
          spanGaps: false,

          pointRadius: labels.length > 90 ? 0 : 3,
          pointHoverRadius: 5,

          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: CHART_COLORS.primary,
          pointBorderWidth: 2
        },

        // Orders Count
        {
          label: 'Orders Count',
          data: orders,

          yAxisID: 'y1',

          borderColor: CHART_COLORS.accent,
          backgroundColor: CHART_COLORS.accentGlow,

          borderWidth: 2,
          borderDash: [4, 4],
          fill: false,
          tension: 0,
          spanGaps: false,

          pointRadius: labels.length > 90 ? 0 : 3,
          pointHoverRadius: 5,

          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: CHART_COLORS.accent,
          pointBorderWidth: 2
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {
        // ----------------------------------------------------
        // LEGEND
        // ----------------------------------------------------

        legend: {
          display: true,
          position: 'top',
          align: 'end',

          labels: {
            boxWidth: 10,
            padding: 12,
            usePointStyle: true,

            font: {
              size: 12,
              weight: '600'
            }
          }
        },

        // ----------------------------------------------------
        // TOOLTIP
        // ----------------------------------------------------

        tooltip: {
          callbacks: {
            label(context) {
              const value = Number(context.raw) || 0;

              if (context.dataset.yAxisID === 'y') {
                return (
                  ' Revenue: ₹' +
                  value.toLocaleString('en-IN')
                );
              }

              return (
                ' Orders: ' +
                value.toLocaleString('en-IN')
              );
            }
          }
        }
      },

      // ------------------------------------------------------
      // AXES
      // ------------------------------------------------------

      scales: {
        // Date axis
        x: {
          grid: {
            display: false
          },

          ticks: {
            autoSkip: true,

            maxTicksLimit:
              timeframe === '7D'
                ? 7
                : timeframe === '30D'
                  ? 10
                  : timeframe === '90D'
                    ? 10
                    : 12,

            maxRotation: 0,
            minRotation: 0
          }
        },

        // Revenue axis
        y: {
          type: 'linear',
          display: true,
          position: 'left',

          beginAtZero: true,
          min: 0,
          max: revenueAxisMax,

          grid: {
            color: CHART_COLORS.grid
          },

          ticks: {
            maxTicksLimit: 6,

            callback(value) {
              if (value >= 100000) {
                const lakhValue = value / 100000;

                return (
                  '₹' +
                  (
                    Number.isInteger(lakhValue)
                      ? lakhValue
                      : lakhValue.toFixed(1)
                  ) +
                  'L'
                );
              }

              if (value >= 1000) {
                const thousandValue = value / 1000;

                return (
                  '₹' +
                  (
                    Number.isInteger(thousandValue)
                      ? thousandValue
                      : thousandValue.toFixed(1)
                  ) +
                  'k'
                );
              }

              return '₹' + value;
            }
          }
        },

        // Orders axis
        y1: {
          type: 'linear',
          display: true,
          position: 'right',

          beginAtZero: true,
          min: 0,
          max: ordersAxisMax,

          grid: {
            drawOnChartArea: false
          },

          ticks: {
            maxTicksLimit: 6,
            precision: 0,

            callback(value) {
              return (
                value +
                (value === 1 ? ' order' : ' orders')
              );
            }
          }
        }
      }
    }
  });
}

// ============================================================
// 2. NEXT 7 DAYS DEMAND FORECAST CHART
// ============================================================

let demandForecastInstance = null;

async function renderDemandForecastChart(
  canvasId = "demandForecastChart"
) {
  const canvas = document.getElementById(canvasId);

  if (!canvas || typeof Chart === "undefined") return;

  if (demandForecastInstance) {
    demandForecastInstance.destroy();
    demandForecastInstance = null;
  }

  const parent = canvas.parentElement;
  let status = document.getElementById("demandForecastStatus");

  if (!status && parent) {
    status = document.createElement("p");
    status.id = "demandForecastStatus";
    status.style.cssText =
      "font-size:13px;color:#6B7280;padding:8px 12px;margin:0;";
    parent.insertBefore(status, canvas);
  }

  if (status) {
    status.textContent = "Loading real sales and forecast data…";
  }

  try {
    if (typeof supabaseClient === "undefined") {
      throw new Error("Supabase client is not initialized.");
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    const token = data?.session?.access_token;

    if (!token) {
      throw new Error("Please sign in to view the demand forecast.");
    }

    const response = await fetch(
  "https://retailmind-ai-1tt7.onrender.com/api/predictions/units?days=7",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  }
);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || `Forecast request failed (${response.status}).`
      );
    }

    if (
      !Array.isArray(result.history) ||
      !Array.isArray(result.forecast)
    ) {
      throw new Error("Unexpected forecast API response.");
    }

    const history = result.history;
    const forecast = result.forecast;

    if (!history.length || !forecast.length) {
      throw new Error("Insufficient data to display the forecast.");
    }

    const formatDay = value => {
      const date = new Date(`${value}T12:00:00`);

      return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric"
        });
    };

    // Keep the historical and forecast periods aligned.
    const labels = [
      ...history.map(item => formatDay(item.date)),
      ...forecast.map(item => formatDay(item.date))
    ];

    const actualValues = [
      ...history.map(item => Math.max(0, Number(item.actual_units) || 0)),
      ...forecast.map(() => null)
    ];

    // Connect the forecast to the final historical observation.
    // Connect the forecast line to the last actual observation.
    const lastActual = Math.max(
      0,
      Number(history[history.length - 1].actual_units) || 0
    );

    const forecastValues = [
      ...history.map((item, index) =>
        index === history.length - 1
          ? lastActual
          : null
      ),
      ...forecast.map(item =>
        Math.max(0, Number(item.predicted_units) || 0)
      )
    ];

    demandForecastInstance = new Chart(canvas.getContext("2d"), {
      type: "line",

      data: {
        labels,
        datasets: [
          {
            label: "Historical Units Sold",
            data: actualValues,
            borderColor: "#9CA3AF",
            backgroundColor: "#9CA3AF",
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            spanGaps: false
          },
          {
            label: "Weekday-Aware Forecast (Units)",
            data: forecastValues,
            borderColor: "#00D4A0",
            backgroundColor: "rgba(0, 212, 160, 0.13)",
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "#FFFFFF",
            pointBorderColor: "#00D4A0",
            pointBorderWidth: 2,
            tension: 0.3,
            fill: "origin",
            spanGaps: true
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        // Reserve room for date labels at the bottom.
        layout: {
          padding: {
            bottom: 18
          }
        },

        interaction: {
          mode: "index",
          intersect: false
        },

        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 12,
              font: {
                size: 11,
                weight: "600"
              }
            }
          },

          tooltip: {
            callbacks: {
              label(context) {
                if (context.raw == null) return null;

                return ` ${context.dataset.label}: ${context.raw} units`;
              }
            }
          }
        },

        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 12,
              maxRotation: 0,
              minRotation: 0,
              padding: 8
            }
          },

          y: {
            beginAtZero: true,
            grace: "5%",
            ticks: {
              precision: 0,
              callback: value => `${value} units`
            },
            grid: {
              color: CHART_COLORS.grid
            }
          }
        }
      }
    });

    if (status) {
      status.textContent =
         "Weekday-aware forecast loaded from completed sales data.";
    }

  } catch (error) {
    console.error("Demand forecast chart error:", error);

    if (status) {
      status.textContent =
        error.message || "Unable to load the demand forecast.";
    }
  }
}

// ============================================================
// 3. CATEGORY BREAKDOWN DOUGHNUT CHART
// ============================================================

let categoryDoughnutInstance = null;

function renderCategoryDoughnutChart(
  canvasId = 'categoryDoughnutChart'
) {
  const canvas = document.getElementById(canvasId);

  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  if (categoryDoughnutInstance) {
    categoryDoughnutInstance.destroy();
    categoryDoughnutInstance = null;
  }

  categoryDoughnutInstance = new Chart(
    canvas.getContext('2d'),
    {
      type: 'doughnut',

      data: {
        labels: [
          'Dairy',
          'Groceries',
          'Beverages',
          'Bakery',
          'Personal Care',
          'Oils'
        ],

        datasets: [
          {
            data: [28, 22, 18, 14, 10, 8],

            backgroundColor: [
              '#5A1188',
              '#7B2CBF',
              '#00D4A0',
              '#3B82F6',
              '#F59E0B',
              '#EC4899'
            ],

            borderWidth: 2,
            borderColor: '#FFFFFF'
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'bottom',

            labels: {
              boxWidth: 10,
              usePointStyle: true,

              font: {
                size: 11
              }
            }
          }
        },

        cutout: '72%'
      }
    }
  );
}

// ============================================================
// 4. PROFIT & COST TRENDS BAR CHART
// ============================================================

let profitBarInstance = null;

function renderProfitBarChart(
  canvasId = 'profitBarChart'
) {
  const canvas = document.getElementById(canvasId);

  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  if (profitBarInstance) {
    profitBarInstance.destroy();
    profitBarInstance = null;
  }

  profitBarInstance = new Chart(
    canvas.getContext('2d'),
    {
      type: 'bar',

      data: {
        labels: [
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep'
        ],

        datasets: [
          {
            label: 'Gross Revenue (₹)',

            data: [
              620000,
              690000,
              740000,
              790000,
              810000,
              842650
            ],

            backgroundColor: '#7B2CBF',
            borderRadius: 6
          },

          {
            label: 'Net Profit (₹)',

            data: [
              165000,
              182000,
              194000,
              205000,
              210000,
              218420
            ],

            backgroundColor: '#00D4A0',
            borderRadius: 6
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'top',
            align: 'end',

            labels: {
              usePointStyle: true,

              font: {
                size: 11
              }
            }
          },

          tooltip: {
            callbacks: {
              label: context =>
                ` ${context.dataset.label}: ₹${Number(context.raw).toLocaleString('en-IN')}`
            }
          }
        },

        scales: {
          x: {
            grid: {
              display: false
            }
          },

          y: {
            beginAtZero: true,

            grid: {
              color: CHART_COLORS.grid
            },

            ticks: {
              callback: value =>
                '₹' + (value / 1000) + 'k'
            }
          }
        }
      }
    }
  );
}