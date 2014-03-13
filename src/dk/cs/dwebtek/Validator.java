package dk.cs.dwebtek;

	import org.jdom2.Document;
	import org.jdom2.JDOMException;
	import org.jdom2.input.SAXBuilder;
	import org.jdom2.output.XMLOutputter;

	import java.io.*;
	import java.nio.file.Path;
	import java.nio.file.Paths;

	public class Validator {
	    /**
	     * Reads and validates XML input according to a specified XMLSchema.
	     *
	     * @param xmlToReadAndValidate as the XML to read and validate
	     * @param schemaToValidateWith as the XMLSchema to validate with
	     * @return the validated document
	     * @throws org.jdom2.JDOMException       if the XML is invalid XML or if the XML does not conform to
	     *                             the schema
	     * @throws java.io.IOException
	     */
	    @SuppressWarnings("deprecation")
	    public static Document readAndValidateXML(InputStream xmlToReadAndValidate,
	                                              Path schemaToValidateWith) throws JDOMException, IOException {
	        SAXBuilder builder = new SAXBuilder();
	        builder.setValidation(true);
	        builder.setProperty(
	                "http://java.sun.com/xml/jaxp/properties/schemaLanguage",
	                "http://www.w3.org/2001/XMLSchema");
	        builder.setProperty(
	                "http://java.sun.com/xml/jaxp/properties/schemaSource",
	                schemaToValidateWith.toFile());
	        return builder.build(xmlToReadAndValidate);
	    }

	    /**
	     * Reads XML input according to a specified XMLSchema.
	     *
	     * @param xmlToRead as the XML to read
	     * @return the read document
	     * @throws org.jdom2.JDOMException       if the XML is not wellformed XML
	     * @throws java.io.IOException
	     */
	    @SuppressWarnings("deprecation")
	    public static Document readXML(InputStream xmlToRead) throws JDOMException, IOException {
	        SAXBuilder builder = new SAXBuilder();
	        return builder.build(xmlToRead);
	    }

	    /**
	     * @see #readAndValidateXML(java.io.InputStream, java.nio.file.Path)
	     */
	    public static void validateXML(Document document, Path schemaToValidateWith) throws IOException, JDOMException {
	        final ByteArrayOutputStream out = new ByteArrayOutputStream();
	        new XMLOutputter().output(document, out);
	        readAndValidateXML(new ByteArrayInputStream(out.toByteArray()), schemaToValidateWith);
	    }

	    /**
	     * Command line interface for validating an XML file against an XML schema.
	     *
	     * @param args [XML-file (.xml), XML-schema-file (.xsd)]
	     * @throws org.jdom2.JDOMException       if the XML is invalid XML or if the XML does not conform to
	     *                             the schema
	     * @throws java.io.IOException
	     */
	    public static void main(String[] args) throws IOException, JDOMException {
	        if (args.length == 1) {
	            String file = args[0];
	            try {
	                readXML(new FileInputStream(Paths.get(file).toFile()));
	                System.out.printf("%s is wellformed.%n", file);
	            } catch (JDOMException e) {
	                System.out.printf("%s is NOT wellformed.%n", file);
	                System.out.printf("Cause: %s%n", e.getMessage());
	            }
	        } else if (args.length == 2) {
	            String schema = args[0];
	            String file = args[1];
	            try {
	                readAndValidateXML(new FileInputStream(Paths.get(file).toFile()), Paths.get(schema));
	                System.out.printf("%s is valid according to %s.%n", file, schema);
	            } catch (JDOMException e) {
	                System.out.printf("%s is NOT valid according to %s.%n", file, schema);
	                System.out.printf("Cause: %s%n", e.getMessage());
	            } catch (IOException e) {
	                System.err.printf("ERROR: %s%n", e.getMessage());
	            }
	        } else{
	            System.out.println("Expected 1 (wellformedness) or 2 arguments (validation)");
	        }
	    }
	}
