import * as main from "./main.js";
import "./sw-nav.js";
import "./sw-footer.js";
import "./sw-documentationGuy.js";


window.onload = () => {

	//if not on index.html go to it
	if (!window.location.href.match('index.html')) 
	{
		console.log("going to index");
		window.location = window.location + 'index.html'
	}

	//if it does match load it
	if (window.location.href.match('index.html')) 
	{
		console.log("window.onload called");
		main.init();
	}

	/*
	//method to reload on first load
	if(!window.location.hash) {
        //setting window location
        window.location = window.location + 'index.html/' + '#loaded';
        //using reload() method to reload web page
        window.location.reload();
    }
	*/
}

