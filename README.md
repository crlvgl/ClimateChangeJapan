# Climate Change Impact on Fish Prices in Japan

A short, cross-disciplinary project exploring how ocean temperature changes relate to fish catch and retail prices in Japan. Built in one week during an exchange program between the University of Applied Sciences Düsseldorf and Meisei University Tokyo, by a team of five students from diverse fields.

**Live demo**: open the website from the `website/` folder in a browser to explore interactive graphs and a 3D scene.

## Overview
- **Goal**: Investigate potential links between sea temperature, fish catch, inflation, and consumer prices in Japan.
- **Outputs**: Interactive visualizations (temperature and fish catch graphs), a 3D scene with model assets, and cleaned datasets for reproducible analysis.
- **Tech**: Static web app (HTML/CSS/JS) and lightweight Python scripts for data cleaning and exploration.

## Features
- **Interactive charts**: Visualize sea temperature trends and fish catch data.
- **3D visualization**: A small Three.js scene showcasing a bluefin tuna model.
- **Cleaned datasets**: Curated CSVs for quick loading and analysis.

## Quick Start
- **View the website**:
	- Open [website/index.html](website/index.html) directly in your browser.
	- Graph scripts are in [website/script/graph_temp.js](website/script/graph_temp.js) and [website/script/graph_fish.js](website/script/graph_fish.js). The Three.js scene is in [website/script/threeScene.js](website/script/threeScene.js).
- **Data files**:
	- Website data: [website/data/EstimatedFishPricesByYear.csv](website/data/EstimatedFishPricesByYear.csv)
	- Source datasets: [datasets/](datasets/) includes cleaned and raw CSVs used for analysis.

## Datasets
- [datasets/CleanedFishPrice.csv](datasets/CleanedFishPrice.csv): Cleaned fish price data used in charts/analysis.
- [datasets/ConsumerPrice.csv](datasets/ConsumerPrice.csv): Consumer price indices.
- [datasets/FishPrice.csv](datasets/FishPrice.csv): Raw fish price data pre-cleaning.
- [datasets/JapanInflationRate.csv](datasets/JapanInflationRate.csv): National inflation rates.
- [datasets/seaTempFish.csv](datasets/seaTempFish.csv): Sea temperature aligned with fish-related metrics.
- [website/data/EstimatedFishPricesByYear.csv](website/data/EstimatedFishPricesByYear.csv): Website-ready price estimates by year.

## Project Structure
- [website/](website/): Static site with interactive visualizations and assets.
	- Pages: [website/index.html](website/index.html)
	- Scripts: [website/script/app.js](website/script/app.js), [website/script/graph_fish.js](website/script/graph_fish.js), [website/script/graph_temp.js](website/script/graph_temp.js), [website/script/threeScene.js](website/script/threeScene.js)
	- Styles: [website/style/styles.css](website/style/styles.css)
	- 3D assets: [website/3DModels/bluefin_tuna_gltf/](website/3DModels/bluefin_tuna_gltf/)
	- Data: [website/data/](website/data/)
- [datasets/](datasets/): CSV datasets used for cleaning and visualization.
- [py/](py/): Python scripts for data cleanup and analysis.
	- Utilities: [py/cleanup.py](py/cleanup.py), exploration in [py/analysis.py](py/analysis.py), [py/temp.py](py/temp.py)
- [extras/](extras/): Reference HTML files (e.g., [extras/seaTemp.html](extras/seaTemp.html), [extras/fishCatch.html](extras/fishCatch.html)).

## Development Notes
- The website is static and can be served locally with any HTTP server or opened directly.
- If you work with Python scripts under `py/`, create a virtual environment and install any packages you need for your analysis workflow.

## Credits
This project was created during an exchange program focused on climate change and its impact on Japan, jointly organized by the University of Applied Sciences Düsseldorf and Meisei University Tokyo.