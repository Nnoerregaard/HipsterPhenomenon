package dk.cs.dwebtek;

public class ItemLocation {
	private String itemID;
	private double lat;
	private double lng;
	
	public ItemLocation(String itemID, double lat, double lng) {
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

	public double getLat() {
		return lat;
	}

	public void setLat(double lat) {
		this.lat = lat;
	}

	public double getLng() {
		return lng;
	}

	public void setLng(double lng) {
		this.lng = lng;
	}
}
