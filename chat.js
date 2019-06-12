//init variable to hold the data from our API call later on
let transcript = {};
//create a variable for the endpoint so we can easily grab this from a config or update easily later
let endpoint = 'https://api.myjson.com/bins/18ce70';

//async call to get the conversation transcript from the API endpoint
async function getConversationTranscript() {
    let response = await fetch(endpoint);
    let data = await response.json().catch(x => console.log(x));
    //return just the data portion that we need and not the response code etc.
    return data.data;
}

async function initializePage() {
    //make the call to the API endpoint to get the conversation history and set it to the local variable
    //to make it easier to work with the actual data and avoid the other response properties
    transcript = await getConversationTranscript();

    //creating a reference point for the chat participants so we can decide which message template to use
    //making an assumption here that the chat session was between only two participants
    //Primary user is decided based on who the first message is from.
    let primaryUser = transcript.messages[0].username;

    let transcriptOutput = createChatTranscriptMarkup(primaryUser, transcript.messages);

    //set the conversation date in the page header
    document.getElementById("conversationDate").innerHTML = formatHeaderDate(transcript.conversationDate);
    // add the markup to the page
    document.getElementById("transcript").innerHTML = "".concat(...transcriptOutput);
}

//For the dates, I'm making an assumption here that we are using en-US as our locale. 
//Format the conversation date in the format "DayOfWeek, Month Day, Year" ex: "Saturday, September 25, 2019"
//parameter "conversationDate": a UTC date for when the conversation occurred. 
function formatHeaderDate(conversationDate){
    let headerDate = new Date(conversationDate);
    let month = new Intl.DateTimeFormat('en-US', { month: 'long'}).format(headerDate);
    let dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long'}).format(headerDate);
    return `${dayOfWeek}, ${month} ${headerDate.getUTCDate()}, ${headerDate.getFullYear()}`;
}

//format the individual message time stamp to be in the format hh:mm with AM/PM, ex: "1:45 PM"
//parameter "timestamp": a UTC date for when an individual message was sent
function formatMessageTimestamp(timestamp){
    let messageDate = new Date(timestamp);
    //leveraging build in date formatting because dates are tricky
    return new Intl.DateTimeFormat('en-US', {hour: 'numeric', minute: 'numeric'}).format(messageDate)
}

//generate the html for the transcript
//parameter "primary user": the username of the first user
//parmaeter "messages": the array of messages from the transcript
function createChatTranscriptMarkup(primaryUser, messages){
    //initialize an array to be used later as our return variable
    let transcriptOutput = new Array;

    //loop through the messages and generate the html markup as an array of strings
    for (let message of messages) {
        message.isfocused = message.focused ? "bubble-focused" : "";

        //For formatting reasons, two templates made the most sense. This way we can generate the markup easily for either participant.
        //Primary is portrait on the left, message bubble on the right
        let primaryTemplate =  `<div class="message-template primary">
                                <div class="portrait-primary">
                                    <img class="portrait" src="${message.image}" />
                                </div>
                                <div class="bubble bubble-primary ${message.isfocused}">
                                    <div class="dialogue">
                                        ${message.message}
                                    </div>
                                    <div class="bubble-footer">
                                        <div class="username username-primary">${message.username}</div>
                                        <div class="timestamp">${formatMessageTimestamp(message.timestamp)}</div>
                                    </div>
                                </div>
                            </div>`;
        //Secondary is portrait on the right, message bubble on the left
        let secondaryTemplate = `<div class="message-template secondary">
                            <div class="bubble bubble-secondary ${message.isfocused}">
                                <div class="dialogue">
                                    ${message.message}
                                </div>
                                <div class="bubble-footer">
                                    <div class="username username-secondary">${message.username}</div>
                                    <div class="timestamp">${formatMessageTimestamp(message.timestamp)}</div>
                                </div>
                            </div>
                            <div class="portrait-secondary">
                                <img class="portrait" src="${message.image}" />
                            </div>
                            </div>`;

        //choose which template to use based on which user the current message is from
        let template = (message.username === primaryUser) ? primaryTemplate : secondaryTemplate;

        //add the generated message template to the output array
        transcriptOutput.push(template);
    }

    return transcriptOutput;
}

initializePage();