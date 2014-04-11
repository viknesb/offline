/**
 * 
 */
package controller;

import javax.servlet.http.HttpServletResponse;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author viknesb
 *
 */
@RestController 
public class PageController {

	@RequestMapping(value="/available", method=RequestMethod.HEAD)
	public void available() {
	}
	
	@RequestMapping(value="/addMessage", method=RequestMethod.POST)
	public void addMessage(@RequestBody String data, HttpServletResponse response) throws ParseException {
		JSONObject messageObj = (JSONObject)new JSONParser().parse(data);
		System.out.println(messageObj.get("message"));
	}
	
	@RequestMapping(value="/addMessages", method=RequestMethod.POST)
	public void addMessages(@RequestBody String data, HttpServletResponse response) throws ParseException {
		JSONObject messageObj = (JSONObject)new JSONParser().parse(data);
		JSONArray messages = (JSONArray) messageObj.get("messages");
		for(Object item : messages) {
			System.out.println(item.toString());
		}
	}
}
