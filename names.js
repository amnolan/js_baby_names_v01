// I avoid globals except in cases where frequent fetches
// or when passing variables along between multiple methods creates
// unnecessary dependencies
var names_select = null;
var graph = null;
var meaning = null;
var err_panel = null;
var start_left_pad = null;
var base_url = "YOUR_API_HERE/babynames.php";

function ajax_exception(ajax, exception){
	// certain names don't have any data associated.
	// this may seem redundant but we don't want to arbitrarily display the err_panel when a name has no info
	// we also want to make sure we don't have code that breaks (ajax.request.parameters) may be null so getting the type throws
	// another exception 
	if(exception || ajax.request.parameters){
		// we only want to enter this block if at least one of the above is true
		if(exception){
			err_panel.innerHTML = exception.message;
			apply_err_panel_styles();
		}else if(ajax.request.parameters.type != "meaning"){
			err_panel.innerHTML = ajax.responseText;
			apply_err_panel_styles();
		}
	}
}

function apply_err_panel_styles(){
	// apply styles to the error console
	err_panel.style.width = '50%';
	err_panel.style.marginLeft = 'auto';
	err_panel.style.marginRight = 'auto';
	err_panel.style.marginTop = '1%';
	err_panel.style.padding = '1%';
	err_panel.style.border = '2px solid black';
	err_panel.style.backgroundColor = 'lightcoral';
	err_panel.style.textAlign = 'center';
}

function clear_errors(){
	// each time a request is made we should clear the error panel
	err_panel = document.getElementById('errors');
	err_panel.removeAttribute("style");
	err_panel.innerHTML = "";
}

function read_names(ajax){
	// interpret the names response
	var names_ra = ajax.responseText.split("\n");
	names_select = document.getElementById('babyselect');
	for(var i = 0; i < names_ra.length; i++){
		var name_option = document.createElement('option');
		name_option.value = names_ra[i];
		name_option.text = names_ra[i];
		names_select.add(name_option);
	}
	// set the disabled select to available
	if(names_select.disabled){
		names_select.disabled = false;
	}
}

function read_stats(ajax){
	// grab the response and get the section we're interested in
	var xmlDoc = ajax.responseXML;
	var allNodes = ajax.responseXML['all'];
	// this is a moving number but is used to create dynamic spacing between columns
	start_left_pad = 0;
	for(var i = 1; i < allNodes.length; i++){
		// pad the left by 10
		start_left_pad += 10;
		add_bar(allNodes[i].getAttribute('year'), parseInt(allNodes[i].innerHTML),start_left_pad);
		// offset by 50 to cover the width of a bar graph
		start_left_pad += 50;
	}

}

function add_bar(year,rank,left_pad){
	// calculate height
	var height = parseInt((1000 - rank) * .25);
	var bar = document.createElement('div');
	var year_elem = document.createElement('p');
	// set styles
	year_elem.innerHTML = year;
	year_elem.className = "year";
	year_elem.style.left = left_pad.toString() + "px";
	// add the year to the graph
	graph.appendChild(year_elem);

	// set styles
	bar.className = "ranking";
	bar.style.height = height.toString() + "px";
	bar.style.left = left_pad.toString() + "px";
	// show as red when between 1 and 10 (inclusive)
	if (rank > 0 && rank < 11) {
		bar.className += " popular";
	}
	// finally add the bar to the graph
	graph.appendChild(bar);
	// set the text to the value of rank
	bar.innerHTML = rank;
}

function read_meaning(ajax){
	// interprets the meaning response
	var text = ajax.responseText;
	meaning.innerText = ajax.responseText;
}

// abstract method, can handle any request
function build_request(url, params ,call_back){
	new Ajax.Request(
		url,
		{
			method: "get",
			parameters: params,
			onSuccess: call_back,
			onFailure: ajax_exception,
			onException: ajax_exception
		}
	);
}

function load_list(){
	// loads the list upon load of the page
	// this should only happen once per load
	var list_params = { type: 'list' };
	build_request(base_url, list_params, read_names);
}

function ready(){
	// what to do when page is ready
    names_select = document.getElementById('babyselect');
	names_select.onchange = names_list_listener;
	load_list();
}

function clear_dynamic_fields(){
	// clear graph everytime before displaying a new name data set
	while (graph.firstChild) {
    	graph.removeChild(graph.firstChild);
	}
	meaning = document.getElementById("meaning");
	meaning.innerText = "";
}

function names_list_listener(){
	// prevent exceptions in the first place, you can't request a null value name!
	var new_val = names_select.value;
	// prevents events when switched to "Select"
	if(new_val){
		var rank_name_params = { type: 'rank', name: new_val };
		var meaning_name_params = { type: 'meaning', name: new_val };
		graph = document.getElementById("graph");
		// clear the fields which have been filled
		clear_dynamic_fields();
		clear_errors();
		// where the error message will be injecteds
		build_request(base_url, rank_name_params, read_stats);
		build_request(base_url, meaning_name_params, read_meaning);
	}
}

window.onload = ready;