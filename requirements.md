Help me create a simple webapp that will be hosted on my local machine and run through browser. The caveat is I should not need to launch my local server whenever I open the webapp. Clicking that webapp should automatically launch that and start working on the get go. Should I decide to host this somewhere i should be able to package and host it as well, but for now it can just run from my local.

Now here are the requirements.

1. Function: The app helps keep track of inventory levels in pantry. The items can be anything from groceries to supplies known as stock in the app - it should:
A. Allow input of a "stock" and its replenishment levels as highlighted in point 4.
B. Able to perform calculations to show trends over time.
C. Allow categorizations of items and adding/deleting items
D. Support features as listed on the points below.


2. UI: The app should be responsive per the type of device used with a simple minimalistic design following Apple's iOS design language for buttons, Apple health like graphs, and so on. I'll give you the freedom to implement it first and then we can reiterate.
There are three replenishment levels: "Full", "Half", "Refill". By default when an item is entered, its replenishment level is "Full".
2.a. The levels should have the following colors:
2.a.i. Full = #36FFA8
2.a.ii. Half = #FFC554
2.a.iii. Refill = #FF554C

2.b. The UI should be clean with sleek animation between button interactions and slick card deck when scrolling through pages.

2.c. The app should have tabs in the page header with the following properties:
2.c.i. Tabs should look like margin tabs on notebooks; clicking/tapping each tab will provide access to the specific page.
2.c.ii. There are 3 pages: "Home", "Analytics", "Settings"
2.c.iii. Home is the default page available on landing.

3. Elements: 
3.a. Home: Home page contains a basic bento box view of the categories of Stocks and show their cumulative replenishment level at a glance by utilizing a fill gauge filled with their respective fill colors with opacity 50% from their stock levels mentioned on point 2 above. Home page also contains a "+" button on the top right corner that allows "quick add" of items. This "+" is a sticky button that always appears throughout all app journeys.
3.b. Analytics: Analytics page contains a line chart view of stock levels by days with week, day and month view toggles. This should follow apple health line chart look, refer: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQCq7q7qDQLyasamjIy7iBDFcskZFinh7r4g&s
3.c. Settings: Settings page allows for managing items such as: editing names, stock levels and organizing categories. Editing an item will reopen the same fields during "Item Add" for uniformity.

4. User Input: Users can input items by using the "+" from anywhere the app. This has the following fields:
4.a. Name: Name of the item
4.b. Stock level Toggle: This toggle allows for "Exact" or "Basic" entries for the stock levels entry:
4.b.i. Basic: Basic is the default toggle selected when the user starts a new entry. This allows user to choose from the replenishment levels from point 2 above.
4.b.ii. Exact: Exact allows for advanced input where user can select from the following metrics: lb, kg, ml, fl.oz, pieces. Selecting "exact" option also requires the user to input what "Full" replenishment values for each item. For eg: If 20lb of rice is input as "Full" value, the app will perform internal calculations to determine Half and Refill values automatically. Half values will be 50% of the stock level while Refill will be at 10%.
4.c. After adding item, a Save button allows the item to be saved. The submit button will turn from a dark gray: #454745 to Green: #76CE7E to let the user know that the entry is recorded.
4.d. Category: Allow to select from already created category or to add a category. Add a category selection will trigger a field for Name input and a checkmark at the end to add it.

5. Database: Since this requires a constant entry and retrival of data, I will let you chose the best method of data storage and retrieval.

Let me know if you have additional questions; If you are good to go - Start working on it.