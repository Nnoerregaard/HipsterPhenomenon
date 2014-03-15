/*
GIT TUTORIAL
IF YOU ARE USING WINDOWS THEN USE GIT COMMAND SHELL INSTEAD OF THE STANDARD WINDOWS CMD!

REMEMBER TO PULL BEFORE YOU START WORKING ON ANYTHING!
LINE 1: git add -A: Add everything you have changed to a new package that you can put in your outbox in the next step. -A means all files.
It is easiest to add all files even though you have change one or a few files.
LINE 2: git commit -m "commit message": Adds the package you made in the previous step to your outbox.
It is important because otherwise your code will be overwritten when you conduct pull in the next line 
Remember the "" around the commit message. 
(The message has to be there and it would be nice if you make it informativ telling what you have changed in the commit)
LINJE 3: git pull: Pulls the latest version of the project from GitHub. VERY IMPORTANT if someone changes something while you were working.
Therefore DON'T forget to pull before you push to avoid conflicting versions on github  
LINJE 4: git push: sends your package from your outbox to GitHub so that the central version of the code is updated on the internet
 */

//Run this function when we have loaded the HTML document
$(function() {	
	// Request items from the server. The server expects no request body, so we
	// set it to null
	sendRequest("GET", "rest/shop/items?ID=279", null, function(itemsText) {
		// This code is called when the server has sent its data. It calls the method building the view on the site	
		var items = JSON.parse(itemsText);
		addItemsToTable(items, "279");
	});

	/*
	 * Adds shops to the topbar. When a shop is selected we build a view from the elements in that shop (without the add to cart and buy buttons!)
	 */
	sendRequest("GET", "rest/shop/showShops", null, function(response) {
		response = JSON.parse(response);
		response.forEach(function(shop) {
			$("#shopList").append("<option value="+shop.ID+">" + shop.Name + "</option>");
		});
		$("#shopList").on("change", function() {
			var shopID = this.value;
			sendRequest("GET", "rest/shop/items?ID=" + shopID, null, function(itemsText) {
				// This code is called when the server has sent its data. It calls the method building the view on the site	
				var items = JSON.parse(itemsText);
				addItemsToTable(items, shopID);
			});
		});
	});
	/*
	 * Adds the event handler to the login button. Reads the user name and password field, sends it to the server and logs the user in if the login is right.
	 * Otherwise, it presents the user with an error message
	 */
	$("#loginButton").on("click", function() {
		/*
		 * Encode the text before sending to avoid cross-site scripting and to avoid problems with special characters
		 */
		var username = encodeURIComponent($("#usernameField").val());
		var password = encodeURIComponent($("#passwordField").val());

		var toSend = "username=" + username + "&" + "password=" + password;
		sendRequest("POST", "rest/shop/login", toSend, function(loginResponse) {
			if (loginResponse === "true") {
				customer.loggedIn = true;
				customer.username = username;
				/*
				 * We hide the create customer button and login form when you are successfully logged in
				 */

				$("#usernameField").hide();
				$("#passwordField").hide();
				$("#loginButton").hide();
				$("#createButton").hide();

				$("#feedback").html("You are logged in as " + $("#usernameField").val() + "|");
				$("#totalPrice").html(shoppingCart + " The total price of your purchase is: " + customer.totalPrice);

				sendRequest("GET", "rest/shop/items?ID=279", null, function(itemsText) {
					// This code is called when the server has sent its data. It calls the method building the view on the site	
					var items = JSON.parse(itemsText);
					addItemsToTable(items, "279");
				});
			} else if (loginResponse === "false"){
				customer.loggedIn = false;
				alert("Your login information was wrong. Please try again.");
				resetFields();
			}
			else {
				alert("There was an unknown error. Please check your internet connection and try again. If the problem persists the server might be down");
				//Resets the user name and password fields
				resetFields();
			}
		});
	});
	/*
	 * Adds the eventHandler to the buy button. This is used when you want to buy products on the server
	 */
	$("#buyButton").on("click", function() {
		// Same as above, get the items from the server
		if(customer.loggedIn) {
			var cart = customer.cart; //Copy cart to the variable cart
			/*
			 * We run each product in the cart (saved as objects in an array which is placed within the customer object). For each product we make a sale request to the
			 * server with the user name of the user currently logged in (also saved in the customer object) and the productID and the amount retrieved from the product objects
			 */
			cart.forEach(function(product) {
				var toSend = "username=" + customer.username + "&" + "itemID=" + product.ID + "&" + "saleAmount=" + product.Amount;
				customer.amountSold += product.Amount;
				sendRequest("POST", "rest/shop/sell", toSend, function(saleResponse) {
					if (saleResponse === "true") {
						sendRequest("GET", "rest/shop/items?ID=279", null, function(itemsText) {
						});
						//This else is executed if the purchase did not succeed!
					} else {
						$("#totalPrice").html("Something went wrong");
					}
				});
				//Give location to bought item
				if (loc.lat !== 0 && loc.lng !== 0) {
					var toSendNow = "itemID=" + product.ID + "&lat=" +  loc.lat + "&lng="+loc.lng;
					sendRequest("POST", "rest/shop/location", toSendNow, function(someString) {
						alert(someString);
					});
				}
			});
			// Updates the view after purchase
			sendRequest("GET", "rest/shop/items?ID=279", null, function(itemsText) {
				// This code is called when the server has sent its data. It calls the method building the view on the site	
				var items = JSON.parse(itemsText);
				addItemsToTable(items, "279");
			});
			/*
			 * Do not write in plural if the customer only bought one product
			 */
			if (customer.amountSold == 0) {
				$("#totalPrice").html(shoppingCart +" Please add something to your cart");
			}
			else if(customer.amountSold > 1) {
				$("#totalPrice").html(shoppingCart +" You have succesfully bought the items");
			}
			else {
				$("#totalPrice").html(shoppingCart +" You have succesfully bought the item");
			}
			reset(); //Is executed before the items has actually been sold. It does not matter, however, since we have a copy of the cart in the variable cart
		} else {
			alert("Please log in to buy products");
		}
	});
	/*
	 * Adds the eventHandler to the create customer button. It sends a request to the server to create a new customer
	 */
	$("#createCustomer").on("click", function() {
		/*
		 * Encode the text before sending to avoid cross-site scripting and to avoid problems with special characters
		 */
		var username = encodeURIComponent($("#usernameField").val());
		var password = encodeURIComponent($("#passwordField").val());
		/*
		 * We check whether or not the input is valid in JavaScript to avoid sending unnecessary data to and from the tomcat server and to avoid doing unnecessary work
		 * on the tomcat server. This would especial be a great benefit if our site had a lot of users
		 */
		if ($("#usernameField").val().length >= 2 && $("#usernameField").val().length <= 20 && $("#passwordField").val().length >= 3 && $("#passwordField").val().length <= 20) {
			var toSend = "username=" + username + "&" + "password=" + password;
			sendRequest("POST", "rest/shop/createCustomer", toSend, function(createResponse) {
				if (createResponse === "true") {
					alert("Customer " + $("#usernameField").val() + " created succesfully");
				}
				else {
					alert("Something went wrong. Please check your internet connection and try again. If the error persists the server might be down");

				}
				//Resets the user name and password fields
				resetFields();
			});
		}
		else {
			alert("Invalid input. The username must be between 2 and 20 characters and the password can be between 3 and 20 characters");
			//Resets the user name and password fields
			resetFields();
		}
	});
	
	//Get location when entering the website
	getLocation();
});

/*
 * This is the central object in our JavaScript. It contains all the information we need above the customer. It is used throughout our JavaScript code!
 */
var customer = {
		loggedIn: false,
		amountSold: 0,
		cart: [],
		totalPrice: 0,
		username: ""
};
function reset() {
	customer.cart = [];
	customer.totalPrice = 0;
	customer.amountSold = 0;
}
function resetFields() {
	$("#usernameField").val("");
	$("#passwordField").val("");
}

var shoppingCart = "<img id= \"shoppingCart\"src=http://www.iaatkfoundation.org/v/vspfiles/templates/Adam/images/template/shopping_cart.png />";

/*
 * This function adds the items on our server to our view. It also adds the add to cart button and its event handler!
 */
function addItemsToTable(items, shopID) {
	// Get the table body we we can add items to it
	var container = document.getElementById("productcontainer");
	// Remove all contents of the table body (if any exist)
	container.innerHTML = "<h2>Category</h2>";
	/*
	 * Adds each item on the server 
	 */
	items.forEach(function(item){
		var frame = document.createElement("div");
		frame.setAttribute("class", "productframe");
		frame.setAttribute("draggable", "true");

		//Image
		var img = document.createElement("img");
		img.setAttribute("class", "productimage");
		img.setAttribute("alt", item.itemName);
		img.setAttribute("src", item.itemURL);
		frame.appendChild(img);

		//Item description and description headline
		var text = document.createElement("div");
		text.setAttribute("class","productText");
		var pHeader = document.createElement("h5");
		pHeader.textContent = item.itemName;
		text.appendChild(pHeader);
		var description = document.createElement("div");
		description.innerHTML = item.itemDescription; //We need to use inner HTML because the string contains HTML tags
		text.appendChild(description);
		frame.appendChild(text);

		//Info
		var info = document.createElement("div");
		info.setAttribute("class", "productInfo");

		//Table
		var table = document.createElement("table");

		//Price
		var priceRow = document.createElement("tr");
		var priceLabelCell = document.createElement("td");
		var priceLabel = document.createElement("h6");
		priceLabel.textContent = "Price:";
		priceLabelCell.appendChild(priceLabel);
		priceRow.appendChild(priceLabelCell);

		var priceCell = document.createElement("td");
		var price = document.createElement("h6");
		price.textContent = item.itemPrice;
		priceCell.appendChild(price);
		priceRow.appendChild(priceCell);

		table.appendChild(priceRow);

		//Stock
		var stockRow = document.createElement("tr");
		var stockLabelCell = document.createElement("td");
		var stockLabel = document.createElement("h6");
		stockLabel.textContent = "Stock:";
		stockLabelCell.appendChild(stockLabel);
		stockRow.appendChild(stockLabelCell);

		var stockCell = document.createElement("td");
		var stock = document.createElement("h6");
		stock.textContent = item.itemStock;
		stockCell.appendChild(stock);
		stockRow.appendChild(stockCell);

		table.appendChild(stockRow);

		/*
		 * Only add this part if we are looking at the shop hipsterPhenomenon
		 */

		if (shopID == "279"){
			$("#buyButton").show(); //Shows the buy button if it has been hidden

			//inCart
			var inCartRow = document.createElement("tr");
			var inCartLabelCell = document.createElement("td");
			var inCartLabel = document.createElement("h6");
			inCartLabel.textContent = "In cart:";
			inCartLabelCell.appendChild(inCartLabel);
			inCartRow.appendChild(inCartLabelCell);

			var inCartCell = document.createElement("td");
			var inCart = document.createElement("h6");
			inCart.setAttribute("id", item.itemID + "inCart");
			inCart.textContent = 0;
			inCartCell.appendChild(inCart);
			inCartRow.appendChild(inCartCell);

			table.appendChild(inCartRow);

			//The buy button
			var buttonRow = document.createElement("tr");
			var buttonCell = document.createElement("td");

			var addButton = document.createElement("input");
			addButton.setAttribute("type", "button");
			addButton.setAttribute("value", "Add to cart");


			/*
			 * Hides the add to chart button and displays the out of stock message if there is no more items in stock!
			 */

			if(parseInt(item.itemStock) == 0) {
				addButton.style.visibility = "hidden";
				buttonCell.textContent = "Out of stock";
			}

			/*
			 * An event listener for our drag functionality. We pased on information about itemID, itemPrice and itemStock needed to add the item to the cart. This infomation
			 * can then be read in our drop handler. We add an unique drag handler for each object on the page
			 * Method inspired by http://stackoverflow.com/questions/15839649/pass-object-through-datatransfer
			 */

			frame.addEventListener("dragstart", function(event) {
				var dragInformation = {stock: item.itemStock, ID : item.itemID, price: item.itemPrice};
				JSONDragInformation = JSON.stringify(dragInformation);
				event.dataTransfer.setData("Information", JSONDragInformation);
			});

			/*
			 * This event listener is added for each add to chart button in turn when the view is build
			 */
			addEventListener(addButton, "click", function (){
				addItemToCart(item.itemStock, item.itemID, item.itemPrice);
			});

			//appending the addButton
			buttonCell.appendChild(addButton);
			buttonRow.appendChild(buttonCell);
			table.appendChild(buttonRow);
			

		}
		//Hide the buy button if we are not looking at HipsterPhenomenon!
		else {
			$("#buyButton").hide();
		}

		//last appending in the info div
		info.appendChild(table);
		frame.appendChild(info);

		//last appending
		container.appendChild(frame);
	});
	/*
	 * Only create this view when we are looking at HipsterPhenomenon
	 */
	if (shopID == 279){
		createRecommendationView();
	}
}

/*
 * Creates the recommendation view when the user is logged in
 */

function createRecommendationView() {
	var container = document.getElementById("productcontainer");
	var frame = document.createElement("div");
	frame.setAttribute("class", "suggestionframe");

	//Previous purchases and previous purchases headline
	var button = document.createElement("button");
	var text = document.createElement("div");
	var pHeader = document.createElement("h5");
	pHeader.textContent = "Based on your previous purchases, we suggest";
	text.appendChild(pHeader);
	text.appendChild(button);
	if (customer.loggedIn){
		sendRequest("GET", "rest/shop/purchases", null, function(response) {			
			suggestedItems = JSON.parse(response);
			suggestedItems.forEach(function(item) {
				var suggestedItem = document.createElement("div");
				suggestedItem.setAttribute("class", "suggestItemDiv");
				
				var header = document.createElement("h5");
				header.textContent = item.itemName;
				
				var img = document.createElement("img");
				img.setAttribute("class", "productimage");
				img.setAttribute("alt", item.itemName);
				img.setAttribute("src", item.itemURL);
				
				var addButton = document.createElement("input");
				addButton.setAttribute("type", "button");
				addButton.setAttribute("value", "Add to cart");
				suggestedItem.appendChild(header);
				suggestedItem.appendChild(img);
				suggestedItem.appendChild(addButton);
				
				addEventListener(addButton, "click", function(){
					addItemToCart(item.itemStock, item.itemID, item.itemPrice);
				});
				
				frame.appendChild(suggestedItem);
			});

		});
	}

	//button for geolocation suggestion
	button.style.float = "right";
	button.textContent="Location suggestions";
	addEventListener(button, "click", function() {
		getLocation();
	});

	frame.appendChild(text);
	frame.appendChild(button);
	//text.appendChild(description);
	//description.appendChild(purchaseList);

	//Info
	var info = document.createElement("div");
	info.setAttribute("class", "productInfo");

	frame.appendChild(info);
	container.appendChild(frame);
}

/*
 * Function specifying what happens when an item is added to the cart
 */

function addItemToCart(itemStock, itemID, itemPrice) {
	//Firstly, we conduct a check to see if the user is logged in
	if (customer.loggedIn) {
		if (parseInt(itemStock) > parseInt(document.getElementById(itemID + "inCart").textContent)){
			var wasContained = false; //The object is not yet added to the cart
			/*
			 * We run through the array containing the objects representing the content in the chart
			 */
			for (var i = 0; i < customer.cart.length; i++) {
				var obj = customer.cart[i];
				/*
				 * We check each object in turn if it is contained in the array already. If so, we count the amount of that object one up
				 * and set 'wasContained' to true so we do not add it again
				 */
				if (obj.ID === itemID) {
					obj.Amount += 1;
					wasContained = true;
				}
			}
			/*
			 * If the product was not contained in the array of products in the chart add it to it and set the amount to 1
			 */
			if (!wasContained){
				customer.cart.push( {"ID": itemID, "Amount": 1} ); 
			}
			document.getElementById(itemID + "inCart").textContent++; //Increase the amount in cart viewed to the user
			// document.getElementById(item.itemID + "stock").textContent--;
			customer.totalPrice += parseInt(itemPrice);
			document.getElementById("totalPrice").innerHTML = shoppingCart + " The total price of your purchase is: " + customer.totalPrice;
		}
		else if (typeof addButton == "undefined"){
			alert("This item is out of stock!");
		}
		else {
			addButton.style.visibility="hidden"; //IF you buy too many items the add button disappears
			buttonCell.textContent = "Out of stock";
		}
	}
	else {
		alert("Log in to add products to your shopping cart"); //If nobody is logged in the user is told to log in
	}
}

/*
 * The function that handles our drop event by reading the data collected during drag
 */
function handleDrop(event) {
	$("#totalPrice").css("color", "yellow");
	var information = JSON.parse(event.dataTransfer.getData("Information", JSONDragInformation));
	addItemToCart(information.stock, information.ID, information.price);
}

/*
 * Taken from http://www.w3schools.com/html/html5_draganddrop.asp. Allows us to drop items and changes the text color when you dag over
 * the shopping cart
 */

function dragOver(ev) {
	ev.preventDefault();
	$("#totalPrice").css("color", "green");
}
function dragAway() {
	$("#totalPrice").css("color", "yellow");
}


/*
 * Code for geolocation
 */

var loc = {
		lat: 0,
		lng: 0
};

function getLocation()
{
	if (navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	}
	else{alert("Geolocation is not supported by this browser.");}
}

function showPosition(position)
{
	loc.lat = position.coords.latitude;
	loc.lng = position.coords.longitude;
}

function showError(error)
{
	switch(error.code) 
	{
	case error.PERMISSION_DENIED:
		alert("User denied the request for Geolocation.");
		break;
	case error.POSITION_UNAVAILABLE:
		alert("Location information is unavailable.");
		break;
	case error.TIMEOUT:
		alert("The request to get user location timed out.");
		break;
	case error.UNKNOWN_ERROR:
		alert("An unknown error occurred.");
		break;
	}
}

/////////////////////////////////////////////////////
//Code from slides
/////////////////////////////////////////////////////

/*
 * A function that can add event listeners in any browser
 */
function addEventListener(myNode, eventType, myHandlerFunc) {
	if (myNode.addEventListener)
		myNode.addEventListener(eventType, myHandlerFunc, false);
	else
		myNode.attachEvent("on" + eventType, function(event) {
			myHandlerFunc.call(myNode, event);
		});
}
function sendRequest(httpMethod, url, body, responseHandler) {

	var http;
	if (!XMLHttpRequest)
		http = new ActiveXObject("Microsoft.XMLHTTP");
	else
		http = new XMLHttpRequest();

	http.open(httpMethod, url);
	if (httpMethod == "POST") {
		http.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	}
	http.onreadystatechange = function () {
		if (http.readyState == 4 && http.status == 200) {
			responseHandler(http.responseText);
		}
	};
	http.send(body);
}