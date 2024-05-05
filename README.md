# webScrapping

This script is designed to extract data from LinkedIn using Puppeteer, a headless browser automation library for Node.js. It automates the process of logging into LinkedIn, performing a search, applying filters, and scraping company data from the search results.

Installation

To clone the repository
git clone https://github.com/shrishtisemwal002/webScrapping.git

Install dependencies
npm install

To reun the script
node index.js

The script will launch a headless browser, log in to LinkedIn, perform a search for specified keywords, apply filters, and extract company data from the search results. The extracted data will be stored in an Excel file named data.xlsx.

Configuration
Modify the getData function to customize the LinkedIn login credentials, search keywords, and filters according to your requirements.
Adjust the storeData array structure and the data extraction logic inside the getDataFromLists function to extract additional or different information from the LinkedIn pages.