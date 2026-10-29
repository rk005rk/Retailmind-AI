
# RetailMind AI – Intelligent Inventory & Sales Prediction System

**An intelligent retail management platform for inventory, sales insights, and demand prediction.**

[Live Demo](https://retailmind-ai-phi.vercel.app) · [Backend Health](https://retailmind-ai-1tt7.onrender.com/api/health)

---

## 📌 Project Overview


**RetailMind AI -- Intelligent Inventory & Sales Prediction System** is
a final-year group project developed as part of our **B.Tech in Computer
Science Engineering (Artificial Intelligence & Machine Learning)** at
**Brainware University**.

The project aims to provide an intelligent retail management platform
that helps businesses manage their day-to-day operations through a
centralized and user-friendly system. It brings together inventory
management, sales and POS, order management, customer and supplier
management, business analytics, business health monitoring, reporting,
and AI-driven prediction features in a single platform.

The system is designed to provide retailers with meaningful insights
into their business performance, inventory status, sales trends, and
future demand. The project also includes an AI Business Assistant and
prediction-oriented modules to establish a foundation for intelligent
and data-driven decision-making.

Current development focuses on the frontend interface, system
architecture, authentication, database design, and core retail
management modules. Future development will include deeper backend
integration, real-time database operations, machine learning models, AI
integration, and deployment.

> **Project Type:** Final-Year Group Project\
> **Degree:** B.Tech -- Computer Science Engineering (AIML)\
> **University:** Brainware University\
> **Domain:** Artificial Intelligence, Machine Learning & Retail
> Technology

## ✨ Key Features

-   **Dashboard:** Centralized overview of retail business activity.
-   **Inventory Management:** Organize and monitor products and stock
    information.
-   **Sales & POS:** Support sales-related workflows through a
    point-of-sale interface.
-   **Order Management:** Manage order-related information.
-   **Customer Management:** Maintain customer information.
-   **Supplier Management:** Organize supplier information.
-   **Business Analytics:** Visualize business and sales trends using
    charts.
-   **Business Health Monitoring:** Review indicators related to
    business performance.
-   **Reports:** Present retail information in a structured format.
-   **Demand Prediction:** Backend API endpoints provide
    prediction-oriented retail insights.
-   **AI Business Assistant:** A conversational interface intended to
    help users explore business information.
-   **Authentication:** Supabase-based authentication integration.

*Feature availability may vary by module as the project continues to
evolve.*

## 🧰 Technology Stack

  Area                                 Technologies
  ------------------------------------ -----------------------
  Frontend                             HTML, CSS, JavaScript
  Charts & Visualization               Chart.js
  Backend API                          Python, Flask
  Backend Server                       Gunicorn
  Authentication & Database Services   Supabase
  Frontend Hosting                     Vercel
  Backend Hosting                      Render
  Version Control                      Git and GitHub

## 🌐 Live Deployment

-   **Application:** <https://retailmind-ai-phi.vercel.app>
-   **Backend Health Check:**
    <https://retailmind-ai-1tt7.onrender.com/api/health>
-   **GitHub Repository:** <https://github.com/rk005rk/Retailmind-AI>

The backend health endpoint can be used to check whether the deployed
API is responding. On free hosting plans, the first request after a
period of inactivity may take longer while the service wakes up.

## 🗂️ Project Structure

The repository contains the frontend application and a `backend`
directory for the Flask API. The frontend includes page files,
stylesheets, JavaScript modules, shared components, and related assets.

``` text
Retailmind-AI/
├── assets/                 # Images and other static assets (if present)
├── css/                    # Stylesheets
├── js/                     # Frontend JavaScript modules
├── backend/
│   ├── app.py              # Flask API entry point
│   ├── requirements.txt    # Python dependencies
│   └── ...                 # Backend services and modules
├── index.html              # Main entry page (if present)
├── dashboard.html          # Dashboard page
├── analytics.html          # Analytics page
├── customers.html          # Customer management page
├── README.md
└── ...
```

> The exact files may differ as the project develops. Keep this
> structure section aligned with the files in the repository.

## 🚀 Run the Project Locally

### 1. Clone the repository

``` bash
git clone https://github.com/rk005rk/Retailmind-AI.git
cd Retailmind-AI
```

### 2. Start the frontend

Open the project folder in your code editor and run the frontend using a
local static server, such as the **Live Server** extension in Visual
Studio Code. Open the local URL shown by the server.

If the frontend is configured to call the deployed API, it can use the
live backend. For local backend development, update the API base URL in
the relevant JavaScript configuration to point to your local Flask
server.

### 3. Set up the backend (optional)

Open a terminal in the project root and move into the backend folder:

``` bash
cd backend
```

Create and activate a virtual environment:

**Windows PowerShell**

``` powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

``` bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Configure the environment variables required by your backend and
Supabase integration. Use your own project values and do not commit
secrets.

Example `.env` configuration (only include variables actually read by
your backend):

``` env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
FRONTEND_ORIGINS=http://127.0.0.1:5500
```

Run the Flask development server using the entry point supported by your
`app.py` file. For a typical Flask application, this may be:

``` bash
python app.py
```

The deployed service uses Gunicorn with the start command:

``` bash
gunicorn app:app
```

> Do not put a Supabase service-role key or other private credentials in
> frontend JavaScript, public repositories, or committed environment
> files. Use environment variables for server-side secrets.

## 🔌 API Health Check

Once the backend is running, check the health endpoint in your browser
or API client:

``` text
GET /api/health
```

Deployed endpoint:

``` text
https://retailmind-ai-1tt7.onrender.com/api/health
```

The backend also contains prediction-oriented API routes, including
demand, units, and sales prediction endpoints.

## 👥 Team Members

This project was developed collaboratively by:

1.  **Sana Mondal**
2.  **Sanchita Maity**
3.  **Abhra Purkait**
4.  **Rohan Karuri**

## 🎯 Project Objectives

-   Build a centralized retail management platform.
-   Make inventory and sales information easier to access.
-   Present business performance through analytics and reports.
-   Explore AI-assisted retail insights and demand prediction.
-   Establish a foundation for data-driven retail decision-making.

## 🔮 Future Scope

-   Deeper integration between frontend modules and backend services.
-   Expanded real-time database operations.
-   Improved machine learning models for demand and sales forecasting.
-   More capable AI assistance for retail workflows.
-   Additional analytics, reporting, and deployment improvements.

## 🎓 Academic Information

**RetailMind AI – Intelligent Inventory & Sales Prediction System**

- **Project Type:** Final-Year Group Project
- **Degree:** B.Tech – Computer Science Engineering (AIML)
- **University:** Brainware University
- **Domain:** Artificial Intelligence, Machine Learning & Retail Technology

<p align="center">
  Made with 💻 by the RetailMind AI team
</p>

