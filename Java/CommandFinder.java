import java.util.*;
import java.util.regex.*;
import java.util.zip.*;
import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.*;

import com.google.gson.*;


public class CommandFinder {
	/* JSON should look roughly like this:
	 * 
	 * {
	 * 	 "Addon_Name": {
	 *     "filename": {
	 *       "cmdName": [
	 *         "argument1",
	 *         "argument2"
	 *       ]
	 *     }
	 *   }
	 * }
	 * 
	 */
	
	
	HashMap<String, HashMap<String, HashMap<String, ArrayList<String>>>> output = new HashMap<>();
	
	static String regexPattern= "\\s*function serverCmd([\\w\\d]+)\\s*\\(([%\\w\\d,\\s]+)*\\)";
	static Pattern regex = Pattern.compile(regexPattern, Pattern.CASE_INSENSITIVE);
	
	Path path;
	ArrayList<String> fileList = new ArrayList<String>();
	
	static Gson json = new GsonBuilder().setPrettyPrinting().create();
	
	
	public CommandFinder(String addonPath) {
		path = Paths.get(addonPath);
		
		try {
		    Files.walkFileTree(path, new SimpleFileVisitor<Path>() {
		    	@Override
		        public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
		    		if (file.toString().endsWith(".zip")) {
		    			fileList.add(file.toString());
		    		}		    		
		            return FileVisitResult.CONTINUE;
		        }
		    });
		}
		catch (IOException e) {
		    System.out.println("Something totally bad just happened: " + e.getMessage());
		}
	}
	
	public void searchFiles() {
		for (String fileName : fileList) {
			try {
				ZipFile zip = new ZipFile(fileName);
				Enumeration<? extends ZipEntry> entries = zip.entries();
				
				String addOnName = fileName.substring(fileName.lastIndexOf("\\") + 1);
				addOnName = addOnName.substring(0, addOnName.length() - 4);
				HashMap<String, HashMap<String, ArrayList<String>>> addOnMap = new HashMap<>();
				output.put(addOnName, addOnMap);
				
				while (entries.hasMoreElements()) {
					try {
						ZipEntry entry = entries.nextElement();
						String entryName = entry.getName();
						if (entryName.endsWith(".cs")) {
							InputStream zipIn = zip.getInputStream(entry);
							BufferedReader reader = new BufferedReader(new InputStreamReader(zipIn, "UTF-8"));
							
							HashMap<String, ArrayList<String>> fileMap = new HashMap<>();
							addOnMap.put(entryName.substring(0, entryName.length() - 3), fileMap);
							
							String line = null;
						    while ((line = reader.readLine()) != null) {
						    	ArrayList<String> argList = new ArrayList<>();
						    	Matcher matcher = regex.matcher(line);
						    	
						    	if (matcher.matches()) {
						    		String cmdName = matcher.group(1);
							    	fileMap.put(cmdName, argList);
							    	
							    	for (String argument : matcher.group(2).split(",")) {
							    		argList.add(argument.trim());
							    	}
						    	}
						    }
							
						    
							reader.close();
							zipIn.close();
						}
					}
					catch (ZipException e) {
						System.out.println("Error with zip entry: " + e.getMessage());
					}
				}
				
				zip.close();
			}
			catch (ZipException e) {
				System.out.format("Error opening zip file %s: %s",
						fileName.substring(fileName.lastIndexOf("\\") + 1),
						e.getMessage());
				System.out.println();
			}
			catch (IOException e) {
				System.out.format("Something bad happened: %s: %s",
						fileName.substring(fileName.lastIndexOf("\\") + 1),
						e.getMessage());
				System.out.println();
			}
		}
	}
	
	public void cleanOutput() {
		for (String addOnName : output.keySet()) {
			HashMap<String, HashMap<String, ArrayList<String>>> addOnMap = output.get(addOnName);
			
			Iterator<String> addOnIter = addOnMap.keySet().iterator();
			while (addOnIter.hasNext()) {
				String fileName = addOnIter.next();
				
				HashMap<String, ArrayList<String>> fileMap = addOnMap.get(fileName);
				
				if (fileMap.isEmpty())
					addOnIter.remove();
			}
		}
		
	}
	
	public void writeJson() {
		try {
			Writer writer = new FileWriter("server_commands.json");
			json.toJson(output, writer);
			writer.close();
		}
		catch (IOException e) {
			System.out.println("Couldn't write the JSON file, for some reason: " + e.getMessage());
			e.printStackTrace();
		}
	}
	
	public static void main(String[] args) {
		double originalTime = System.nanoTime() / 1000000000.0;
		
		CommandFinder cmds = new CommandFinder(System.getProperty("user.dir") + "/Add-Ons");
		cmds.searchFiles();
		cmds.cleanOutput();
		cmds.writeJson();
		
		double newTime = System.nanoTime() / 1000000000.0;
		double difference = newTime - originalTime;
		
		System.out.println("Results can be found in server_commands.json.");
		System.out.println("Time taken: " + difference);
		System.out.print("Press enter to exit.");
		try {
			System.in.read();
		}
		catch (IOException e) {
			System.out.println("For some reason, trying to read input did not work...");
			System.out.println(e.getMessage());
		}
	}
}
