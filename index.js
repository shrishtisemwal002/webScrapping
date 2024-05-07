//puppeteer library for extracting data
import puppeteer from 'puppeteer'

//dotenv library to store login credentials
import dotEnv from 'dotenv';

//xlsx library to convert the array into excel sheet
import * as XLSX from 'xlsx';

//specifying the path of env file
dotEnv.config({path:"./config.env"})

//function to launch the puppeteer library and to login to linkedin dynamically and extract data
const getData = async () => {  
  try {
    
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 50
    });

    //creating a new page 
    const page = await browser.newPage();
  
    await page.goto("https://www.linkedin.com/login",{
      args: [
        '--incognito',
      ],
    });
    // setting the size of viewport
    await page.setViewport({
      width: 1400,
      height: 1200,
    });
  
    // wait for the selector to appear in the DOM
    await page.waitForSelector('form.login__form');
  
    //for intentional delays in the process
    await new Promise(resolve => setTimeout(resolve, 2000));

    //extracting username and password from env file
    const username = process.env.USER;
    const password = process.env.PASSWORD;

    //dynamically loging in linkedin
    await page.type('#username', username);
    await page.type('#password', password);
  
     //for intentional delays in the process
    await new Promise(resolve => setTimeout(resolve, 2000));
  
    //clicking the login button
    await page.click("button[type=submit]");
  
    //wait for the page to navigate
    await page.waitForNavigation();
  
    //simulate typing into the search input field
    await page.type('input.search-global-typeahead__input', 'education');
    await page.keyboard.press('Enter');
  
    //wait for the page to navigate
    await page.waitForNavigation();
  
     //for intentional delays in the process
    await new Promise(resolve => setTimeout(resolve, 2000));
  
    //searching for the button in the navigation bar of linkedin
    await page.waitForSelector('#search-reusables__filters-bar');
    let navBar = await page.$('#search-reusables__filters-bar');
    let buttons = await navBar.$$('button');
  
    //traversing through all the buttons and clicking on the companies button
    for (const button of buttons) {
      let innerText = await page.evaluate(val => val.textContent.trim(), button);
      if (innerText === "Companies") {
        await button.click();
        break;
      }
    }
  
    let i = 0; //a variable is declared to click on multiple filters
    let btnContainer;
    let button;
  
    // calling filterTabs function to search for the filters and select the specified options
    await filterTabs("#searchFilter_companyHqGeo", 'input[placeholder="Add a location"]', "india");
    await page.waitForNavigation();
    await filterTabs("#searchFilter_industryCompanyVertical", 'input[placeholder="Add an industry"]', "Higher Education");
    await page.waitForNavigation();
    await filterTabs('#searchFilter_companySize', '#companySize-D', "");
  
// an asynchronous function is created to seeach for the filters ans select the specified option
    async function filterTabs(id, tag, text) {

      await page.waitForSelector(id);
      let filter = await page.$(id);

      await new Promise(resolve => setTimeout(resolve, 2000));

      //to click on the filter drop down
      await filter.click();
    
      if (id !== '#searchFilter_companySize') {

        const inputs = await page.$(tag);
        await inputs.type(text)
    
        await page.evaluate(() => {
          return new Promise(resolve => {
            setTimeout(resolve, 2000);
          });
        });
    
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
    
        await page.waitForSelector(".reusable-search-filters-buttons");
        btnContainer = await page.$$(".reusable-search-filters-buttons");
        button = await btnContainer[i++].$$('button');

         //for intentional delays in the process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        //clicking on the show reults button
        await button[1].click();
    
      } else {
        await page.waitForSelector(tag);
    
        let employeeSize = await page.$(tag);

        await new Promise(resolve => setTimeout(resolve, 2000));
        await employeeSize.click();
    
        await page.waitForSelector(".reusable-search-filters-buttons");
        btnContainer = await page.$$(".reusable-search-filters-buttons");
        button = await btnContainer[i++].$$('button');
  
        await new Promise(resolve => setTimeout(resolve, 2000));
    
        await button[1].click();
      }
    }

      let count = 2; // counter for getting the data of multiple pages
      let storeData = []; // an array is created to store the data objects

      while (count > 0) {
        await getDataFromLists();
        console.log(storeData);
        console.log(storeData.length);
        count--;

      }
      //function to traverse all the lists and get data from the about page of each tab
      async function getDataFromLists() {

        //waiting for the container containing all the lists(list of companies)
        await page.waitForSelector(".reusable-search__entity-result-list");
        let resultLists = await page.$$(".reusable-search__entity-result-list");

        //getting the links of all the lists
        await page.waitForSelector('span span a');

        //accessing all the anchor tags present in one page
        let lists = await resultLists[0].$$("span span a");

        //iterating through each company link  
        for (const list of lists) {

          //accessing the href link of each anchor tag one by one.
          let link = await page.evaluate(list => list.getAttribute('href'), list);

           //for intentional delays in the process
          await new Promise(resolve => setTimeout(resolve, 2000));

          //creating a new page for each link
          const aboutPage = await browser.newPage();
          
          await aboutPage.goto(`${link}/about/`);
          await aboutPage.setViewport({
            width: 1400,
            height: 1200,
          });
    
          //accessing the required information
          let dataTag = await aboutPage.$$('dt');
    
          let dataArray = ['Website', 'Company size', 'Headquarters'];

          //object to store the data of each comapny link 
          let listData = {};
          
          //for getting the name of the company
          let companyNameHeading = await aboutPage.$('h1');

          if(companyNameHeading){
            let companyName = await companyNameHeading.evaluate(element => element.innerText);
            listData["Company Name"] = companyName;
          }
          
          //iterating over all the dt tags and storing only the required ones 
          for (const data of dataTag) {
    
            let dataText = await aboutPage.evaluate(dataText => dataText.innerText.trim(), data);

            //to store only the specified information
            if (dataArray.includes(dataText)) {
              
              let dataValue = await aboutPage.evaluate(element => {
                const sibling = element.nextElementSibling;
                return sibling ? sibling.textContent.trim() : '';
              }, data)
    
              listData[dataText] = dataValue;
            }
          }

          storeData.push(listData);

          await new Promise(resolve => setTimeout(resolve, 2000));
          //closing the page after extracting the required information
          aboutPage.close();
        }

        //waiting for the next button selector to load in the DOM and clicking on it to reach to the next page
        await page.waitForSelector('button[aria-label="Next"]');
        let nextButton = await page.$('button[aria-label="Next"]');
    
        await nextButton.click();
        await page.waitForNavigation();
      }
    
      console.log(storeData);
      console.log(storeData.length);

      //converting the object into excel sheet
      jsToExcel(storeData);

  }catch(error) {
    console.error("error occured",error);
  } 
}

getData();

//function to store the data in excel sheet
function jsToExcel(storeData) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(storeData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, "data.xlsx");
}


