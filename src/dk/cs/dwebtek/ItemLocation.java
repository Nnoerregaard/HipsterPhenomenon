package dk.cs.dwebtek;

public class ItemLocation {
	private String itemID;
	private int lat;
	private int lng;
	
	public ItemLocation(String itemID, int lat, int lng) {
		this.setItemID(itemID);
		this.setLat(lat);
		this.setLng(lng);
	}

	public String getItemID() {
		return itemID;
	}

	public void setItemID(String itemID) {
		this.itemID = itemID;
	}

	public int getLat() {
		return lat;
	}

	public void setLat(int lat) {
		this.lat = lat;
	}

	public int getLng() {
		return lng;
	}

	public void setLng(int lng) {
		this.lng = lng;
	}
}
