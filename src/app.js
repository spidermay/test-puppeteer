// ------------------------------------------------------------------
// -------> @@ DESCRIPTION ------------------------------------------
// ------------------------------------------------------------------
/**
 * This is an example for puppetter functions, take ramdom task list
 * of a certain page, and emptied in another page
 * I decide use express in case it is required to obtain the result 
 * through a rest api, for that reason I also use the cors, otherwise 
 * it would be raised simply with the puppeteer library and the main 
 * method, likewise the credential parameters can be sent by get or 
 * simply declared in environment variables in .env file, start with
 * npm start, or node app.js
 * @author @spidermay
 */

// ------------------------------------------------------------------
// -------> @@ REQUIRES ---------------------------------------------
// ------------------------------------------------------------------
const cors = require("cors");
const express = require("express");
const puppeteer = require("puppeteer");

// ------------------------------------------------------------------
// -------> @@ INITIALIZATION THE SERVER IF NEEDS -------------------
// ------------------------------------------------------------------
const app = express();

// ------------------------------------------------------------------
// -------> @@ MIDLEWEARES IF NEEDS ---------------------------------
// ------------------------------------------------------------------
// app.use(morgan("dev"));

// ------------------------------------------------------------------
// -------> @@ SETTINGS ---------------------------------------------
// ------------------------------------------------------------------
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
app.use(cors({
    "origin": "*",
    "preflightContinue": false,
    "optionsSuccessStatus": 200,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "allowedHeaders": ["Content-Type", "Authorization", "Accept", "x-reset-token", "x-invite-token", "x-api-key", "x-www-form-urlencoded"],
}));

// ------------------------------------------------------------------
// -------> @@ ENVIROMENT -------------------------------------------
// ------------------------------------------------------------------
const dotenv = require("dotenv");
const result = dotenv.config();

if (result.error) {
    throw result.error;
}

const { parsed: envs } = result;
module.exports = envs;

// ------------------------------------------------------------------
// -------> @@ GLOBALS ----------------------------------------------
// ------------------------------------------------------------------
app.set("PORT", process.env.PORT || 3000);
app.set("production", process.env.PRODUCTION || 0);

// ------------------------------------------------------------------
// -------> @@ CONTROLLERS ------------------------------------------
// ------------------------------------------------------------------
/**
 * Add random list
 * @param {*} request
 * @param {*} response
 */
 const addRandomTask = async (request, response) => {
    let email = process.env.EMAIL || "";
    let password = process.env.PASSWORD || "";

    console.log(request);
    if(request != undefined){
        email = request.query.email;
        password = request.query.password;
    }  

    try {
        // Create the broeser
        const browser = await puppeteer.launch({
            headless:false,
            args: ["--window-size=800,1024", "--window-position=800,0"]
        });
        
        // Create the page or tab in the browser
        const page = await browser.newPage();
        
        // Go at url for scraping random tasks
        await page.goto("https://randomtodolistgenerator.herokuapp.com/library", { waitUntil:["load", "domcontentloaded", "networkidle0", "networkidle2"] });
        
        // Wait for elements
        await page.waitForSelector('.taskCard');
        
        // Get the task list and return this list
        let list_task = await page.evaluate(() => {
            let list_task = [];
            let list_title = Array.from(document.querySelectorAll(".taskCard > .card-body > .task-title > div"));
            let list_subtitle = Array.from(document.querySelectorAll(".taskCard > .card-body > .card-subtitle p"));
            let list_description = Array.from(document.querySelectorAll(".taskCard > .card-body > .card-text"));
            
            let node_title = list_title.map(element => { return element.innerHTML; });
            let node_description = list_description.map(element => { return element.innerHTML; });
            let node_subtitle = list_description.map(element => { return element.innerHTML; });
    
            for(let key in node_title){
                list_task.push({ title:node_title[key], subtitle:node_subtitle[key], description:node_description[key], category:"[{}]" });
            }
    
            return list_task;
        });
        
        // Testing list_task
        // console.log(list_task);

        // Open todist https://todoist.com/es
        await page.goto("https://todoist.com/users/showlogin", { waitUntil:["load", "domcontentloaded", "networkidle0", "networkidle2"] });

        // Login in todist
        await page.type("[name=email]", email);
        await page.type("[name=password]", password);
        await page.click("button.sel_login");
        await page.waitForSelector('button.plus_add_button');
        // await page.waitFor(10000 + Math.floor(Math.random() * 5000)); //!important: this method is deprecated but is better 
        await sleep(1 + Math.floor(Math.random() * 7));

        // Create task for task
        if(list_task.length > 0){
            for(let row of list_task){
                // console.log("TRY_INSERT");               
                // console.log(row);               
                await sleep(Math.floor(Math.random() * 3));
                await page.click("#quick_add_task_holder");
                await sleep(Math.floor(Math.random() * 3));
                
                let exist_element = await page.$('public-DraftEditorPlaceholder-root:not([readonly])');
                let is_exist = exist_element !== null;
                console.log("EXIST_ELEMENT_?", is_exist);
                
                if(exist_element !== null){
                    // console.log("TRY_FOR_FIRST");   
                    await page.type(".public-DraftEditorPlaceholder-root", row.title);
                } else {
                    // console.log("TRY_FOR_NEXT");       
                    await page.type(".public-DraftStyleDefault-block", row.title);
                }

                await page.type(".task_editor__description_field", row.description);
                await sleep(Math.floor(Math.random() * 3));

                await page.click("button.reactist_button");
                await sleep(2 + Math.floor(Math.random() * 5));
            }
        }

        if(response){
            await browser.close();
            response.send({ data:list_task });
        }
   } catch (error) {
       console.log("LEVEL", "addRandomTask");
       console.log("ERROR", error);
   }
}

function sleep(time) {
    time = time * 1000;
    return new Promise(resolve => setTimeout(resolve, time));
}

// ------------------------------------------------------------------
// -------> @@ ROUTES -----------------------------------------------
// ------------------------------------------------------------------
app.get("/start", addRandomTask);

// ------------------------------------------------------------------
// -------> @@ START APP AND SERVER ---------------------------------
// ------------------------------------------------------------------
addRandomTask();

async function main(){
    await app.listen(app.get("PORT")); 
    console.log("APP_IS_RUNNING_ON_PORT", app.get("PORT"));
}

main();