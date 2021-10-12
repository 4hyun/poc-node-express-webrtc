const socket = io("/")
const videoGrid = document.getElementById("video-grid")
const myPeer = new Peer(undefined, { host: "localhost", port: 3001 })
const peers = {}

// intialize video
const myVideo = document.createElement("video")
myVideo.muted = true

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id)
})

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  console.log("init $myVideo")
  addVideoStream(myVideo, stream)

  socket.on("user-connected", function (userId) {
    // connect to new connected user.
    console.log("user-connected event emitted.")
    connectToNewUser(userId, stream)
  })
})

// handle peer error
myPeer.on("error", (err) => {
  console.log("error")
  throw err
})

// Answer
myPeer.on("call", (call) => {
  console.log("peer on 'call': [start]")
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(
    (stream) => {
      console.log("peer on 'call': myVideo stream ready.")
      peers[call.peer] = call
      call.answer(stream) // Answer the call with an A/V stream.
      call.on("stream", (remoteStream) => {
        // Show stream in some <video> element.
        addPeerScreen(call.peer, remoteStream, videoGrid)
      })
      call.on("close", () => {
        console.log("video.id to remove: ", call.peer)
        removePeerScreen(call.peer)
      })
    },
    (err) => {
      console.error("Failed to get local stream", err)
    }
  )
})

socket.on("user-connected", (userId) => {
  console.log("User connected: ", userId)
})

socket.on("user-disconnected", (userId) => {
  console.log("User disconnected: ", userId)
  if (peers[userId]) {
    console.log(">>DEBUG")
    peers[userId].close()
  }
})

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.muted = true
  video.addEventListener("loadedmetadata", () => {
    video.play()
  })
  videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
  let video
  const call = myPeer.call(userId, stream)
  call.on("stream", (stream) => {
    video = addPeerScreen(call.peer, stream, videoGrid)
  })
  call.on("close", () => {
    console.log("video.id to remove: ", video.id)
    video.remove()
  })
  peers[userId] = call
}

function addPeerScreen(peerId, stream) {
  let peerVideo = document.getElementById(peerId)
  if (!peerVideo) {
    // initialize peer video
    peerVideo = document.createElement("video")
    peerVideo.id = peerId
    // peerVideo.muted = true
    addVideoStream(peerVideo, stream)
  }
  return peerVideo
}

function removePeerScreen(peerId) {
  const peerVideo = document.getElementById(peerId)
  peerVideo.remove()
}
