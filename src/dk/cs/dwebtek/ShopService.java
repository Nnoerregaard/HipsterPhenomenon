/*
GIT VEJLEDNING
HVIS DU BRUGER WINDOWS SÅ HUSK AT BRUGE GIT SHELL OG IKKE DEN ALMINDELINGE WINDOWS CMD!

LINJE 1: git add -A: Tilføjer alt det du har ændret til en ny pakke, som du kan ligge i din udbakke i næste linje. -A betyder alle filer.
Det er lettest bare at tilføje alle filer selvom du kun har ændret på en fil!
LINJE 2: git commit -m "commit besked": Tilføjer den pakke du lige har lavet til udbakken. Vigtigt fordi ellers bliver din kode 
overskrevet, når du laver "git pull" i næste linje (husk gåseøjn omkring commit beskeden. Beskeden skal være der, og den må meget gerne være
informativ omkring hvad du har lavet!)
LINJE 3: git pull: trækker den nyeste version af projektet ned fra serveren. MEGET VIGTIGT, så der ikke opstår fejl,
hvis andre retter samtidig med dig!!!
LINJE 4: git push: sender din pakke fra udbakken (fra commit) op til serveren, så den kommer til at ligge oppe på nettet
*/

package dk.cs.dwebtek;

import java.io.IOException;
import java.net.*;
import java.nio.file.Paths;
import java.util.*;

import org.jdom2.*;
import org.jdom2.output.Format;
import org.jdom2.input.SAXBuilder;
import org.jdom2.output.XMLOutputter;
import org.json.*;

import javax.annotation.PostConstruct;
import javax.ws.rs.*;

/*
 * This class is responsible for receiving requests from the JavaScript running on our web page, creating the right XML
 * and sending it to the cloud and receiving the answer back from the cloud again. 
 * All the public methods are directly used by our JavaScript. All the private helper methods are collected at the bottom of the code.
 */
@Path("shop")
public class ShopService{

	private Namespace ns;
	private String schemaPath;
	private XMLOutputter outputter;
	private SAXBuilder b;
	private String shopKey;

	/*
	 * This is the constructor which initializes all the field variables we need. It works as a constructor because it has the PostConstruct annotation
	 */

	@PostConstruct
	public void init(){
		ns = Namespace.getNamespace("http://www.cs.au.dk/dWebTek/2014");
		outputter = new XMLOutputter();
		b = new SAXBuilder();
		shopKey = "E445247AA36C3E7174F5611B";
		schemaPath = "/Users/niklas/Documents/WebShopProjekt/UserPage/WebContent/WEB-INF/cloud.xsd"; //OBS!!!! NOTICE!! HARD-CODED PATH!!
	}

	/*
	 * Method for creating new customers. Is called if the customer wants to create a new account. If something goes wrong or the username/password
	 * does not fulfill the servers requirement false is sent to JavaScript. Then our JavaScript can act accordingly.
	 */  
	@POST
	@Consumes("application/x-www-form-urlencoded")
	@Path("createCustomer")
	public boolean createCustomer(@FormParam("username") String name, @FormParam("password") String password){
		Document d = new Document();
		d.setRootElement(new Element("createCustomer", ns));
		Element root = d.getRootElement();
		root.addContent(new Element("shopKey", ns).setText(shopKey));
		root.addContent(new Element("customerName", ns).setText(name));
		root.addContent(new Element("customerPass", ns).setText(password));
		try {
			HttpURLConnection connection = connect("POST", "createCustomer");
			Validator.validateXML(d, Paths.get(schemaPath, "")); //We validate our XML to make the cloud server happy! :)
			outputter.output(d, connection.getOutputStream());
			if (connection.getResponseCode() == 200) return true;
			else return false;
		} catch (IOException | JDOMException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
	}  
	/*
	 * Is called when we want to sell an item. It returns true if it succeeded and false if it didn't so our JavaScript application can act accordingly
	 */
	@POST
	@Path("sell")
	public boolean sellItems(@FormParam("username") String customerName,
			@FormParam("itemID") String itemID, 
			@FormParam("saleAmount") Integer saleAmount){
		try{
			String test = new String(customerName.getBytes("UTF-8"), "ISO-8859-1");
			System.out.println(test);
			String customerID = getCustomerID(customerName);
			Document d = new Document();
			HttpURLConnection connection = connect("POST", "sellItems");
			d.setRootElement(new Element("sellItems", ns));

			Element rootElement = d.getRootElement();
			rootElement.addContent(new Element("shopKey", ns).setText(shopKey));
			rootElement.addContent(new Element("itemID", ns).setText(itemID));
			rootElement.addContent(new Element("customerID", ns).setText(customerID));
			rootElement.addContent(new Element("saleAmount", ns).setText(saleAmount.toString()));
			Validator.validateXML(d, Paths.get(schemaPath, "")); //We validate our XML to make the cloud server happy! :)
			outputter.output(d, connection.getOutputStream());
			if(connection.getResponseCode() == 200){
				return true;
			}
			else{
				return false;
			}
		} catch (IOException | JDOMException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false; //It, obviously, did not succeed if we encounter an exception
		}

	}    
	/*
	 * Used to log a user in. Returns a string telling whether or not it succeeded
	 */   
	@POST
	@Consumes("application/x-www-form-urlencoded")
	@Path("login")
	public boolean login(@FormParam("username") String name, @FormParam("password") String password){
		Document d = new Document();
		HttpURLConnection connection = connect("POST", "login");
		d.setRootElement(new Element("login", ns));

		Element root = d.getRootElement();
		root.addContent(new Element("customerName", ns).setText(name));
		root.addContent(new Element("customerPass", ns).setText(password));
		try {
			outputter.output(d, connection.getOutputStream());
			Validator.validateXML(d, Paths.get(schemaPath, "")); //We validate our XML to make the cloud server happy! :)
			int responseCode = connection.getResponseCode();
			if (responseCode == 200){
				return true;
			}
			else{
				return false;
			}
		} catch (IOException | JDOMException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
	}

	/*
	 * Takes all the items currently on the sever that are not deleted and returns them as a JSON array turned into a string. The reason
	 * we use a JSON array is that it is easier to work with in JavaScript
	 */  
	@GET
	@Path("items")
	public String returnItems(){
		JSONArray array = new JSONArray();
		for (Element item : getItems()) {
			JSONObject o = new JSONObject();
			o.put("itemID", item.getChildText("itemID", ns));
			o.put("itemName", item.getChildText("itemName", ns));
			o.put("itemPrice", item.getChildText("itemPrice", ns));
			o.put("itemStock", item.getChildText("itemStock", ns));
			o.put("itemURL", item.getChildText("itemURL", ns));
			
			 //Takes item description, transforms it to valid HTML5 and adds it to the JSON array	
			Element description = item.getChild("itemDescription", ns).getChild("document", ns);
			description = transformDocumentTags(description);
			description.setName("p");
			description.setNamespace(Namespace.NO_NAMESPACE);
			Format f = Format.getRawFormat().setOmitEncoding(true);
			XMLOutputter xmlOut = new XMLOutputter(f);
			String outputDescription = xmlOut.outputString(description);
			
			o.put("itemDescription", outputDescription);
			array.put(o);
		}
		return array.toString();
	} 

	/* 
	 * |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
	 * Here the private helper methods start and the public interface of the class ends
	 * |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
	 */

	/*
	 * A private helper method for transforming a user name (which we get from the JavaScript code) into a customerID (which we need for the
	 * sellItems call to the cloud)
	 */
	private String getCustomerID(String username){
		HttpURLConnection connection = connect("GET", "listCustomers");
		try {
			Document d = b.build(connection.getInputStream());
			connection.getResponseCode();
			List<Element> customers = d.getRootElement().getChildren();
			for(Element customer : customers) {
				if(customer.getChildText("customerName", ns).equals(username)) {
					return customer.getChildText("customerID", ns);
				}
			}
		} catch (JDOMException | IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		finally{
			connection.disconnect();
		}	
		return "";
	}

	/*
	 * A private helper method for retrieving all our items from the server minus the ones we have deleted
	 */  
	private List<Element> getItems() {
		List<Element> returnElements = new ArrayList<Element>();
		HttpURLConnection deletedItems = connect("GET", "listDeletedItemIDs?shopID=279");
		HttpURLConnection items = connect("GET", "listItems?shopID=279");
		try {
			Document doc = b.build(items.getInputStream());
			Document deleteDoc = b.build(deletedItems.getInputStream());
			List<Element> elements = doc.getRootElement().getChildren("item", ns);
			List<Element> dElements = deleteDoc.getRootElement().getChildren("itemID", ns);
			int size = dElements.size();
			//The following is done for every single element in over shop
			for(Element e : elements) {
				int count = 0;
				String existingID = e.getChild("itemID", ns).getText();
				/*
				 * We run through the entire list of deleted elements comparing all elements in dElements (deleted elements)
				 * with the elements in the list with all elements. If there is a match count is not equal to size because is it
				 * not incremented exactly dElements.size() times but rather dElements.size() - 1 times. 
				 */
				for(Element el : dElements) {
					if(!existingID.equals(el.getText())) {
						count += 1;
					}
				}
				//Therefore, the element is only added to the return list if there wasn't a match (thus the element is in the total
				//element list but not in the deleted element list, and therefore we want it
				if (size == count) {
					returnElements.add(e);
				}
			}
		} catch (JDOMException | IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		finally {
			deletedItems.disconnect();
			items.disconnect();
		}
		return returnElements;
	}

	/*
	 * A private helper method for establishing a given type of connection to the given cloud URL
	 */
	private HttpURLConnection connect(String type, String targetURL) {
		HttpURLConnection connection = null;
		try {
			URL url = new URL("http://services.brics.dk/java4/cloud/" + targetURL);
			connection = (HttpURLConnection) url.openConnection();
			connection.setRequestMethod(type);
			connection.setDoOutput(true);
			connection.setDoInput(true);
			connection.connect();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}	
		return connection;
	}
	
	/*
	 * This private help method takes a tag and transforms it into valid HTML5 tags
	 */
	private Element transformDocumentTags(Element documentElement){
		for(Element e : documentElement.getChildren()){
			//Only adds the element to the return list, if it's name is ingredient.
			if(e.getName().equals("bold")){
				e.setName("b");
				e.setNamespace(Namespace.NO_NAMESPACE);
			}
			if(e.getName().equals("italics")){
				e.setName("i");
				e.setNamespace(Namespace.NO_NAMESPACE);
			}
			if(e.getName().equals("list")){
				e.setName("ul");
				e.setNamespace(Namespace.NO_NAMESPACE);
			}
			if(e.getName().equals("item")){
				e.setName("li");
				e.setNamespace(Namespace.NO_NAMESPACE);
			}
			//Keeps calling recursively as long as there is more child elements.
			if(!e.getChildren().isEmpty()) transformDocumentTags(e);
		}

		return documentElement; //Returns the HTML5 optimized element
	}
}
