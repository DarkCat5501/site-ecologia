//base overload  functions
Array.prototype.end = function(){ return this[this.length-1]; }

//base request library
async function request( url, params = {}, method = 'GET' ){
    let options = { method };
    if ( 'GET' === method ) { url += '?' + ( new URLSearchParams( params ) ).toString(); }
    else { options.body = JSON.stringify( params ); }
    return fetch( url, options )
};

const requestRawFetch = ( url, params = {}, method = 'GET' ) => {
    let options = { method };
    if ( 'GET' === method ) { url += '?' + ( new URLSearchParams( params ) ).toString(); }
    else { options.body = JSON.stringify( params ); }
    return fetch( url, options ).then( response => response.text() );
};

function requestRaw( url,params={},method = 'GET',async = true){
    const requester = new XMLHttpRequest();    
    if ( 'GET' === method ) { url += '?' + ( new URLSearchParams( params ) ).toString(); }
    else { options.body = JSON.stringify( params ); }
    requester.open(method, url,async);
	if(async) {
		const output = new Promise((resolve, reject) => {
			requester.onreadystatechange = ({ target:req }) => {
				switch(req.readyState){
					//ignore all of this cases for now
					// 0: /*UNSET*/ //TODO: handle UNSET state
					// 1: /*OPENED*/
					// 2: /*HEADERS_RECEIVED*/
					// 3: /*LOADING*/
					case 4: //DONE
						if(req.status >=400 && req.status <= 599){
							reject();
							return;
						}break;
					default: return;
				}
				resolve(req);
			}
			
		})
		requester.send(params);
		return output;
	}
	requester.send(params);
	return requester;
};

const get = ( url, params ) => request( url, params, 'GET' );
const post = ( url, params ) => request( url, params, 'POST' );
const getRaw = ( url, params, async) => requestRaw( url, params, 'GET',async);
const postRaw = ( url, params, async) => requestRaw( url, params, 'POST',async);

/**
 * requires an external module
 * @param {string} module 
 */
function require(module) {
	let m_data = module.split(".");
	m_data = (m_data.end() ==="js"? m_data.slice(undefined,-1) : m_data).join(".");
	
	const { responseText: data } = requestRaw(`${m_data}.js`,{},"GET",false);
	return eval(`
		const exports = {}
		${data}
		exports;
	`)
}

function getDocumentDelimiter(text){
	const delimiterR = new RegExp(/&<([^>.]*)+>/);
	const result = delimiterR.exec(text);
	if(result) return result[1]
	return false;
}

function getDocumentItemTag(text){
	const delimiterR = new RegExp(/&:([^:.]*)+:(.*)$/);
	const result = delimiterR.exec(text);
	if(result) return { tag: result[1], value: result[2] }
	return false;
}

function detectTag(element, tag){
	/* //const inlineTagMatcher = new RegExp(/<(?<tag>[^>]*)\s(?<attrs>[^>]*)[\/]?>/);
	//const tagMatcher = new RegExp(/<([^>^<]*)\s?([^>^<]*)[^\/]>([^<]*)<\/([^>^<]*)>/);
	//const tagMatcher = new RegExp(/<([a-z]+[0-9]*)\s?([^<>]*)[^\/]?>([^<>]*)*<\/(\1)>?/);
	//const tagMatcher = new RegExp(/<([a-z0-9]*)(\s[^<>]*)?>([^<>]*)*<\/(\1)>/);
	//const tagMatcher = new RegExp(/<([a-z0-9]*)(\s[^<>]*)?>(.*)*<\/(\1)>/); */
	const elementList = []
	if( element.tagName	=== tag ) return [element];
	for(child of Array.from(element.children)){
		const detected = detectTag(child,tag);
		if(detected.length){
			elementList.push(element,...detected)
		}
	}
	return elementList;
}

function appendGoogleDocumentContent(content, sections,tags){
	const text = content.textContent;

	const hasImage = detectTag(content, "IMG");
	if(hasImage.length) {
		content = hasImage[hasImage.length-1]
		content.style = "";
	}

	const tagData = getDocumentItemTag(text);
	const element = content.cloneNode(true);
	if(tagData){
		if(!(tagData.tag in tags)){
			tags[tagData.tag] = [tagData.value];
		} else {
			tags[tagData.tag].push(tagData.value);
		}
		
		const newSection = document.createElement("section");
		newSection.setAttribute("id",`${tagData.tag}-${tags[tagData.tag].length-1}`)
		
		element.textContent = text.replace(/&:([^:.]*)+:/,"")

		newSection.appendChild(element);
		sections.push(newSection);
	} else {
		sections[sections.length-1].appendChild(element);
	}
}

function createShadowDom(){
	const div = document.createElement("div");
	div.attachShadow({ mode: "open"})
	return div;
}

function parseGoogleCssProperties(data){
	const propsMatcher = new RegExp(/([^:]*):([^;]*)[;]?/);
	const cssProperties = data.match(new RegExp(propsMatcher,"g"));
	const propsMap = {};
	cssProperties.forEach(prop => {
		const result = prop.match(propsMatcher);
		propsMap[ result[1] ] = result[2];
	})
	return propsMap;
}

/**
 * @param {string} data 
 */
function parseGoogleStyleSheet(data){
	const classMatcher = new RegExp(/([^{]*){([^}]*)}/);

	const cssClasses = data.match(new RegExp(classMatcher,"g"));
	const cssClassMap = {};
	const cssElementMap = {};

	cssClasses.forEach(cssCls => {
		const result = cssCls.match(classMatcher);
		if(result.length === 3){

			const name = result[1];
			const props = parseGoogleCssProperties(result[2]);
			if(name.startsWith(".")){//is class
				cssClassMap[name] = props;
			} else {
				cssElementMap[name] = props;
			}
			//console.log(cssCls, result[0],result[1])
		} else {
			console.error("invalid class detected:", cssCls)
		}
	})

	return { classes: cssClassMap, elements: cssElementMap };
};

/**
 * 
 * @param {Record<string,string>>} data 
 */
function propsMapToCss(data, ignoreProps){
	const output = [];
	Object.entries(data).forEach(([prop,value]) => {
		if(!ignoreProps.includes(prop)){
			output.push(`\t${prop}:${value}`);
		}
	});
	return output.join(";\n");
}

/**
 * 
 * @param {Record<string,Record<string,string>>} data 
 */
function classMapToCss(data, ignoreProps = []){
	let output = "";
	Object.entries(data).forEach(([cls,props]) => {
		output+=`${cls}{\n${propsMapToCss(props, ignoreProps)}\n}`;
	});

	return output;
}

https://docs.google.com/document/d/15shFR1VnEkFYkt_T7HS9tYhvC5EQ6xufzNHX5hn_L0M/export=html

function appendGoogleDocument(data){
	parser = document.createElement("html")
	parser.innerHTML = data;
	tags = {};
	const content = [document.createElement("div")];
	for(let node of parser.childNodes){
		switch(node.tagName){
			case "HEAD":
				//TODO: clone styles
				for(let header of node.childNodes){
					switch(header.tagName){
						case "STYLE":
							//header.innerHTML.replace(/.*/,"");
							const { classes, elements } = parseGoogleStyleSheet(header.innerHTML);
							const toCss = classMapToCss(classes,["font-family"]);

							//console.log(toCss);
							header.innerHTML = toCss
							content[0].appendChild(header);
							break;
						default: console.log("unwanted header",header.tagName,header)
					}
				}
				break;
			case "BODY":
				for(let body of node.children){
					const text = body.textContent;
					const delim =getDocumentDelimiter(text);
					if(delim !== false){
						if(delim){
							const newDiv = document.createElement("div");
							delim.trim().split(" ").forEach(dm => dm ? newDiv.classList.add(dm): undefined)
							
							content[content.length-1].appendChild(newDiv);
							content.push(newDiv)
						} else if (content.length>1){
							content.pop() //pop current delimiter
						}
						else {
							const error = document.createElement("span")
							error.classList.add("error")
							error.textContent = "final inesperado de delimitador"
							content[content.length-1].appendChild(error);
						}
					} else {
						appendGoogleDocumentContent(body,content,tags)
					}
				}
				break;
		}
	}
	return { tags, content };
}

async function loadGoogleDocument(url){	
	const result = await fetch(url);
	if(result.ok){
		const data = await result.text();
		return appendGoogleDocument(data);
	} else {
		const invalid = document.createElement("div");
		invalid.classList.add("not-found")
		invalid.textContent = "Documento não encontrado"
		contentElement.appendChild(invalid);
	}
	// .then(result => {
	// 	console.log(result)
	// 	result.text().then(data => {
	
	// })
	return null;
}


function handleMenu(element){
	//console.log(element);
	const isOpen = element.getAttribute("open")!==null;

	if(isOpen){
		element.removeAttribute("open")
	} else {
		element.setAttribute("open",'');
	}
}

const link="https://docs.google.com/document/d/15shFR1VnEkFYkt_T7HS9tYhvC5EQ6xufzNHX5hn_L0M/export?format=html"
const mainContent = document.getElementById("content");
loadGoogleDocument(link).then(({tags,content})=>{
	
	//const shadowRoot = createShadowDom();

	//content.forEach(c => shadowRoot.shadowRoot.appendChild(c))
	content.forEach(c => {
		if(!c.id.startsWith("script")) mainContent.appendChild(c)
	})
	//mainContent.appendChild(shadowRoot);
	
	
	const topics_list = document.getElementById("topics");

	if("topic" in tags){
		tags["topic"].forEach( (topic,index) => {
			const topicView = document.createElement("li");
			topicView.innerHTML = `<a href="#topic-${index}">${topic}</a>`;
			topics_list.appendChild(topicView);
		});
	}

	if("script" in tags){
		tags["script"].forEach( (src,index) => {
			const { main } = require(src);
			main();
		});
	}
});