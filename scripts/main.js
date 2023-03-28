
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

function appendGoogleDocumentContent(content, sections,tags){
	const text = content.textContent;
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

function appendGoogleDocument(data){
	parser = document.createElement("html")
	parser.innerHTML = data;
	tags = {};
	const content = [document.createElement("section")];
	for(let node of parser.childNodes){
		switch(node.tagName){
			// case "HEAD":
			// 	//TODO: clone styles
			// 	// for(let header of node.childNodes){
			// 	// 	switch(header.tagName){
			// 	// 		case "STYLE":
			// 	// 			document.head.appendChild(header);
			// 	// 			break;
			// 	// 		default: console.log("unwanted header",header.tagName,header)
			// 	// 	}
			// 	// }
			// 	//find styles	
			// 	break;
			case "BODY":
				for(let body of node.children){
					const text = body.textContent;
					const delim =getDocumentDelimiter(text);
					if(delim !== false){
						if(delim){
							const newDiv = document.createElement("div");
							newDiv.classList.add(delim)
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

async function loadGoogleDocument(url, element){	
	const result = await fetch(url);
	if(result.ok){
		const data = await result.text();
		return appendGoogleDocument(data, element);
		
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
	
	content.forEach(c => mainContent.appendChild(c))
	
	
	const topics_list = document.getElementById("topics");

	if("topic" in tags){
		tags["topic"].forEach( (topic,index) => {
			const topicView = document.createElement("li");
			topicView.innerHTML = `<a href="#topic-${index}">${topic}</a>`;
			topics_list.appendChild(topicView);
		});
	}
});