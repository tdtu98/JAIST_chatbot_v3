
let userName; // global username is used as session key in retrieving the chat history
let chatCount = 0; // global chatCount is used to updated the generated chat of chatbot.

// this function is used to initialize the greeting message and login/signup form.
(function init() {

    const messagePage = document.getElementById('msg-page');
    const aiMessage = "Hello, this is JAIST Chatbot, how can I help you?"

    aiHTML = document.createElement("div");
    aiHTML.className = "received-chats";
    const outgoingMessageTime = new Date();
    aiHTML.innerHTML = '<div class="received-chats-img"><img src="static/assets/ai.png" /></div> <div class="received-msg"><div class="received-msg-inbox"><p class="multi-msg">' + aiMessage  +'</p><span class="time">' + outgoingMessageTime + '</span></div></div>';
    messagePage.append(aiHTML);
    showPopup();

})();

function showPopup() { 
    document.getElementById('popupOverlay').style.visibility = "visible";
}

function logSubmit(event) {
    event.preventDefault();
    handleSendMessageRequest(event);
}   
const form = document.getElementById("form");
form.addEventListener("submit", logSubmit);

// this function is used to send the question to backend and receive the response.
// the question and response UI are added into msg-page here.
async function handleSendMessageRequest(event){

    const textInput = document.getElementById('text-input');
    const question = textInput.value;
    const messagePage = document.getElementById('msg-page');
    const userHtml = document.createElement("div");
    userHtml.className = "outgoing-chats";  
    const receivedMessageTime = Date(event.timeStamp);

    userHtml.innerHTML= '<div class="outgoing-chats-img"><img src="static/assets/user.png" /></div><div class="outgoing-msg"><div class="outgoing-chats-msg"><p class="multi-msg">'+ textInput.value + '</p><span class="time">'+ receivedMessageTime +'</span></div></div>';
    messagePage.append(userHtml);
    textInput.value = "";



    aiHTML = document.createElement("div");
    aiHTML.className = "received-chats";
    const outgoingMessageTime = new Date();
    aiHTML.innerHTML = `<div class="received-chats-img"><img src="static/assets/ai.png" /></div> <div class="received-msg"><div class="received-msg-inbox"><p class="multi-msg" id=chatID${chatCount}> </p><span class="time">` + outgoingMessageTime + '</span></div></div>';
    messagePage.append(aiHTML);
    chatCount += 1;
    
    response = await fetch("http://jaistchatbot.tdt/question/", {
        method: 'POST',
        body: JSON.stringify(
            {
            "question": question,
            "username": userName,
            }
        ),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log("trigger event")
        // Get the readable stream from the response body
        const stream = response.body;
        // Get the reader from the stream
        const reader = stream.getReader();
        // Define a function to read each chunk
        const readChunk = () => {
            // Read a chunk from the reader
            reader.read()
                .then(({
                    value,
                    done
                }) => {
                    // Check if the stream is done
                    if (done) {
                        // Log a message
                        console.log('Stream finished');
                        // Return from the function
                        return;
                    }
                    // Convert the chunk value to a string
                    const chunkString = new TextDecoder().decode(value);
                    // Log the chunk string
                    console.log("value",chunkString);
                    updateAIChat(chunkString)
                    // Read the next chunk
                    readChunk();
                })
                .catch(error => {
                    // Log the error
                    console.error(error);
                });
        };
        // Start reading the first chunk
        readChunk();
    })
    .catch(error => {
        // Log the error
        console.error(error);
    });
}

function updateAIChat(chunk) {
    // Create a new paragraph element for each chunk and append it
    const response = document.getElementById(`chatID${chatCount-1}`);
    const node = document.createTextNode(chunk);
    response.appendChild(node)
}


// handling login action by sending username and password to backend.
const loginForm = document.getElementById("login");
loginForm.addEventListener("submit", login);
async function login (event){
    event.preventDefault();

    const inputUserName = document.getElementById('username');
    const passWord = document.getElementById('password');

    response = await fetch("http://jaistchatbot.tdt/login/", {
        method: 'POST',
        body: JSON.stringify(
            {
            "username": inputUserName.value,
            "password": passWord.value,
            }
        ),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    const jsonResponse = await response.json();

    if (jsonResponse.message == "error"){
        alert("Incorrect username or password !!!")
    }
    else{
        userName = inputUserName.value
        document.getElementById('popupOverlay').style.visibility = "hidden";
    }

}

// handling signup action.
async function signUp(){
    const inputUserName = document.getElementById('username');
    const passWord = document.getElementById('password');
    response = await fetch("http://jaistchatbot.tdt/signup/", {
        method: 'POST',
        body: JSON.stringify(
            {
            "username": inputUserName.value,
            "password": passWord.value,
            }
        ),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    const jsonResponse = await response.json();

    if (jsonResponse.message == "error"){
        alert("Your username was taken, please choose another username !!!")
    }
    else{
        userName = inputUserName.value
        document.getElementById('popupOverlay').style.visibility = "hidden";
    }
}

