# Amazon Catalog Insights

Amazon Catalog Insights is a lightweight, client-side web app that turns the included Amazon product dataset into clear pricing, category, rating, and review insights in the browser.

This project was built as a simple but professional MVP for a GitHub portfolio, with a focus on clarity, responsive UI, accessibility, and clean vanilla JavaScript.

## Screenshots

Add screenshots here as the project evolves:
- Home page overview
- Report generation view
- Mobile responsive layout

## Features
- Load the bundled `data/amazon.csv` catalog automatically
- Choose between catalog overview, category analysis, and customer sentiment views
- Review product count, discounted prices, ratings, discounts, and top categories
- Ask the local catalog assistant about the loaded data
- Enjoy a modern, responsive interface with no backend required

## Technologies used
- HTML5
- CSS3
- Vanilla JavaScript
- No framework or backend dependency

## Project structure
- index.html — app structure and UI sections
- style.css — responsive styling and modern visual design
- script.js — data parsing, report generation, and UI logic
- data/amazon.csv — Amazon product dataset (1,465 products)
- data/sample-data.json — legacy sample financial dataset
- assets/ — space for future icons or images

## Installation

Open the project directly in a browser, or serve it locally with a simple static server:

```bash
cd finance-report-ai
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Usage
1. Open the app in your browser.
2. Review the automatically loaded Amazon product catalog.
3. Select the analysis you want to generate.
4. Ask the assistant about pricing, ratings, discounts, or categories.

## Amazon dataset columns

The dashboard reads `product_id`, `product_name`, `category`, `discounted_price`, `actual_price`, `discount_percentage`, `rating`, `rating_count`, and review metadata from the CSV. It uses the price, discount, rating, rating-count, and category fields in the visual analysis.

## Accessibility and quality improvements
- Clear labels and semantic structure
- Keyboard-friendly interactions
- Stronger error feedback for invalid uploads
- Responsive layout for desktop and mobile screens

## Future improvements
- Add chart visualizations for better storytelling
- Support drag-and-drop file upload
- Add export to PDF or CSV
- Introduce dark mode
