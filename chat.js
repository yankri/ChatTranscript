(function init () {
  // async call to get the conversation transcript from the API endpoint
  async function getConversationTranscript () {
    // in the real world, I'd put this in a config somewhere, but keeping it simple
    const endpoint = 'https://api.myjson.com/bins/18ce70'
    // const endpoint = 'https://api.my'
    let response = await fetch(endpoint)
    let data = await response.json()
    // return just the data portion that we need and not the response code etc.
    return data.data
  }

  // For the dates, I'm making an assumption here that we are using en-US as our locale.
  // Format the conversation date in the format "DayOfWeek, Month Day, Year" ex: "Saturday, September 25, 2019"
  // parameter "conversationDate": a UTC date for when the conversation occurred.
  const formatHeaderDate = (conversationDate) => {
    const headerDate = new Date(conversationDate)
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(headerDate)
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(headerDate)
    return `${dayOfWeek}, ${month} ${headerDate.getUTCDate()}, ${headerDate.getFullYear()}`
  }

  // format the individual message time stamp to be in the format hh:mm with AM/PM, ex: "1:45 PM"
  // parameter "timestamp": a UTC date for when an individual message was sent
  const formatMessageTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp)
    // leveraging built in date formatting because dates are tricky
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(messageDate)
  }

  // generate the html for the transcript
  // parameter "primary user": the username of the first user
  // parmaeter "messages": the array of messages from the transcript
  const createChatTranscriptMarkup = (primaryUser, messages) => {
    // initialize an array to be used later as our return variable
    let transcriptOutput = []

    // loop through the messages and generate the html markup as an array of strings
    for (let message of messages) {
      message.isfocused = message.focused ? 'bubble-focused' : ''

      // choose which template to use based on which user the current message is from
      const template = message.username === primaryUser ? getPrimaryMessageTemplate(message) : getSecondaryMessageTemplate(message)

      // add the generated message template to the output array
      transcriptOutput.push(template)
    }

    return transcriptOutput
  }

  // For formatting reasons, two templates made the most sense. This way we can generate the markup easily for either participant.
  // Primary is portrait on the left, message bubble on the right
  const getPrimaryMessageTemplate = (message) => {
    return `<div class="message-template primary">
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
                </div>`
  }

  // Secondary is portrait on the right, message bubble on the left
  const getSecondaryMessageTemplate = (message) => {
    return `<div class="message-template secondary">
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
        </div>`
  }

  async function initializePage () {
    // make the call to the API endpoint to get the conversation history and set it to the local variable
    // to make it easier to work with the actual data and avoid the other response properties
    let transcript
    try {
      transcript = await getConversationTranscript()
    }
    catch (ex) {
      document.getElementById('transcript').innerHTML = `Your transcript is unavailable. Please try again later. Exception: ${ex}`
      return;
    }

    // creating a reference point for the chat participants so we can decide which message template to use
    // making an assumption here that the chat session was between only two participants
    // Primary user is decided based on who the first message is from.
    let primaryUser = transcript.messages[0].username

    let transcriptOutput = createChatTranscriptMarkup(primaryUser, transcript.messages)

    // set the conversation date in the page header
    document.getElementById('conversationDate').innerHTML = formatHeaderDate(transcript.conversationDate)
    // add the markup to the page
    document.getElementById('transcript').innerHTML = ''.concat(...transcriptOutput)
  }

  initializePage()
}())
