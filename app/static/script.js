
let userName; // global username is used as session key in retrieving the chat history

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
    
    response = await fetch('http://localhost:80/question/', {
        method: 'POST',
        body: JSON.stringify(
            {
            "question": question,
            "username": "admin",
            }
        ),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    
    const aiMessage = await response.json();
    console.log("response", aiMessage.message);
    

    aiHTML = document.createElement("div");
    aiHTML.className = "received-chats";
    const outgoingMessageTime = new Date();
    aiHTML.innerHTML = '<div class="received-chats-img"><img src="static/assets/ai.png" /></div> <div class="received-msg"><div class="received-msg-inbox"><p class="multi-msg">' + aiMessage.message +'</p><span class="time">' + outgoingMessageTime + '</span></div></div>';
    messagePage.append(aiHTML);
}


// handling login action by sending username and password to backend.
const loginForm = document.getElementById("login");
loginForm.addEventListener("submit", login);
async function login (event){
    event.preventDefault();

    const inputUserName = document.getElementById('username');
    const passWord = document.getElementById('password');

    response = await fetch("http://localhost:80/login/", {
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
    response = await fetch("http://localhost:80/signup/", {
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

