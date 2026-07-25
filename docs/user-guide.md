# PUU Tracker User Guide

Welcome to the **PUU Tracker** User Guide. This document explains how to navigate, manage, and use the PUU Tracker application to store, search, and analyze Indonesian legislation (Peraturan Perundang-Undangan).

---

## 1. Introduction

PUU Tracker is a specialized full-stack web application designed for legal researchers, administrators, and policy analysts. It enables users to:
* **Upload legal documents (PDFs)** and automatically extract their textual content.
* **Deconstruct legislation** into individual articles (Pasal).
* **Compare versions** word-by-word, displaying precise modifications (insertions, deletions, edits) using an advanced, verbatim Longest Common Subsequence (LCS) diff engine.
* **Visualize the evolution** of legislation over time.

---

## 2. Authentication & Roles

Access to PUU Tracker is secured via credential-based login. There are two primary user roles defined in the system:

### VIEWER (Read-Only)
* **Access**: Can access the Dashboard, view Regulation lists, view individual versions, read parsed articles, and run version comparisons.
* **Restrictions**: Cannot upload new PDF files or run administrative seeding tools.

### ADMIN (Full Access)
* **Access**: All VIEWER features, plus the ability to access `/upload` and `/manage` routes.
* **Capabilities**: Upload new PDF legislation files, trigger text extraction & parsing pipelines, set up version relations (amendments), and trigger database re-seeding.

*To log in, navigate to `/login` and enter your registered email and password credentials.*

---

## 3. Dashboard Overview

After logging in, you will be redirected to the **Dashboard** (`/dashboard`). The dashboard serves as the central hub of the application:
1. **Search Bar**: Search regulations by title, type, number, or year. Admins can also use this bar to quickly fetch and import regulations that are not yet stored in the system (e.g. typing "Perpres 82 2018" and initiating an automatic fetch process).
2. **Recent Uploads**: View the latest uploaded regulations and their processing status.
3. **Quick Statistics**: See the total number of regulations, active versions, and parsed articles in the system.

---

## 4. Managing Regulations & Uploads (Admin Flow)

If you have an **ADMIN** role, you can add new legislation to the system:

### Step 1: Open the Upload Page
Navigate to `/upload` using the sidebar or by direct URL.

### Step 2: Upload a PDF File
Drag and drop or select an Indonesian legislation PDF file.
* **Constraints**: Supported format is PDF only. Max size is configured to `10MB` by default.

### Step 3: Populate Metadata
Provide the following information for the uploaded legislation version:
* **Regulation Type**: Select from existing types (e.g., Undang-Undang [UU], Peraturan Pemerintah [PP], Peraturan Presiden [Perpres]).
* **Number**: The official regulation number (e.g., `82`).
* **Year**: The publication/enactment year (e.g., `2018`).
* **Full Title**: The official name of the regulation (e.g., *Perpres No. 82 Tahun 2018 tentang Jaminan Kesehatan*).
* **Effective Date**: The date on which the legislation becomes active.
* **Amends Relation**: If this version amends a previous version, select the old version from the dropdown list. This establishes the lineage for diff analysis.

### Step 4: Submit and Monitor Processing
Click **Upload and Parse**. The app will upload the PDF to MinIO object storage and automatically start a background text extraction pipeline:
1. **Digital Parsing**: The system first attempts to extract digital characters from the PDF using `pdfjs-dist` and `pdf-parse`.
2. **Vision OCR Fallback**: If pages are scanned images (or digital extraction yields no text), the system defensive fallback kicks in to execute page-by-page OCR using the Gemini Vision API.
3. **Article Deconstruction**: The parsed raw text is sent to an LLM-assisted parser to split the text into a clean JSON array of articles (`Pasal` structure).
4. **Diff Analysis**: The engine compares the newly parsed articles with the original version (if an "Amends" relationship was set) and logs the differences.

---

## 4.1. Automatic Regulation Fetching (Admin Flow)

In addition to manual PDF uploads, Admins can utilize the Automatic Regulation Fetcher to query, download, and parse legislation directly from the internet.

### How to Use the Fetcher
1. **Input Search Query**: In the Dashboard's Search Bar, type a query using natural Indonesian regulation shorthand (e.g. `Perpres 82 2018`, `UU 11 2020`, `PP 35 2021`).
2. **Launch Fetch**: If the search doesn't return any local results, click the **Fetch from Internet** button.
3. **Monitor Progress**: The page will display live, streaming progress updates as the fetcher advances through its pipeline:
   - *Memahami input pencarian...* (Parsing query via AI)
   - *Strategi 1: Mencari di database JDIH BPK...* (Searching BPK crawler)
   - *Strategi 4: Mencari di database Pasal.id...* (Failing back to Pasal.id fallback if needed)
   - *Menyimpan ke database...* (Saving version metadata and PDF text content)
   - *AI sedang mengekstrak pasal-pasal...* (Invoking LLM parser to split articles)
4. **Completion**: Upon successful import, the screen automatically updates to present the new regulation details and parsed article list. If the fetch pipeline fails on all 4 strategies, an error message is printed and the Admin is guided to perform a manual PDF upload.

---

## 5. Version Timeline & Legislation Evolution

To view a regulation's history:
1. Search and select a regulation from the dashboard.
2. Open the **Regulation Detail** page (`/regulations/[id]`).
3. You will see a chronological **Timeline of Versions**.
   * For example, *Perpres No. 82 Tahun 2018* may be shown as amended by *Perpres No. 75 Tahun 2019*, which in turn is amended by *Perpres No. 64 Tahun 2020*.
4. Click on any version to see its status:
   * **Active**: The current version is active and fully in effect.
   * **Amended**: The version has been partially modified by a newer version.
   * **Revoked**: The version has been completely replaced or canceled.

---

## 6. Verbatim Comparison UI

The core capability of PUU Tracker is comparing articles word-by-word:

1. Click on the **Compare** button next to an amended version or go to `/compare`.
2. Select the **Base Version** and the **Target Version** you want to compare.
3. Select the specific **Pasal (Article)** you want to examine, or view the overall document changes.
4. The screen will render the **Verbatim Diff**:
   * **Green highlight with underline**: Text that has been added in the new version.
   * **Red highlight with strikethrough**: Text that has been deleted or replaced from the old version.
   * **Plain text**: Text that remains identical between both versions.
5. Review the **AI Notes** provided for each modified article, summarizing the legal implication of the change.
