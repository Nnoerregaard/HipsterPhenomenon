package dk.cs.dwebtek;

import java.util.ArrayList;

public class PurchasedItem implements Comparable<PurchasedItem> {
	private String name;
	private int amount;
	
	public PurchasedItem(String name, int amount){
		this.name = name;
		this.amount = amount;
	}

	@Override
	public int compareTo(PurchasedItem o) {
		// TODO Auto-generated method stub
		if (amount > o.getAmount()){
			return -1;
		}
		else if (amount < o.getAmount()){
			return 1;
		}
		else {
			return 0;
		}
	}
	
	public int getAmount(){
		return amount;
	}
	
	public String getName(){
		return name;
	}
	
	public static ArrayList<String> getNames(ArrayList<PurchasedItem> list){
		ArrayList<String> returnList = new ArrayList<String>();
		for (PurchasedItem item : list){
			returnList.add(item.getName());
		}
		return returnList;
	}
	
	public static boolean containsName(ArrayList<PurchasedItem> array, String name){
		for (PurchasedItem item : array){
			if (item.getName().equals(name)) return true;
		}
		return false;
	}
	
}
