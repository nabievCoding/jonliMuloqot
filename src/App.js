import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "c5423838ad7a449c9e48d90088944c10"; // Sizning App ID
const TOKEN = null; // test uchun null, production uchun token kerak
const CHANNEL = "test-channel";

const App = () => {
  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [joined, setJoined] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoContainerRef = useRef(null);

  useEffect(() => {
    const initClient = async () => {
      const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(rtcClient);

      rtcClient.on("user-published", async (user, mediaType) => {
        await rtcClient.subscribe(user, mediaType);
        
        if (mediaType === "video") {
          const remoteVideoTrack = user.videoTrack;
          setRemoteUsers(prevUsers => ({
            ...prevUsers,
            [user.uid]: { ...prevUsers[user.uid], videoTrack: remoteVideoTrack }
          }));
          
          // Create a container for the remote video
          const remoteVideoContainer = document.createElement("div");
          remoteVideoContainer.className = "remote-video-container";
          remoteVideoContainer.id = `remote-video-${user.uid}`;
          
          const videoElement = document.createElement("div");
          videoElement.className = "remote-video";
          
          const uidElement = document.createElement("div");
          uidElement.className = "remote-uid";
          uidElement.textContent = `User ${user.uid}`;
          
          remoteVideoContainer.appendChild(videoElement);
          remoteVideoContainer.appendChild(uidElement);
          remoteVideoContainerRef.current.appendChild(remoteVideoContainer);
          
          remoteVideoTrack.play(videoElement);
        }
        
        if (mediaType === "audio") {
          const remoteAudioTrack = user.audioTrack;
          setRemoteUsers(prevUsers => ({
            ...prevUsers,
            [user.uid]: { ...prevUsers[user.uid], audioTrack: remoteAudioTrack }
          }));
          remoteAudioTrack.play();
        }
      });

      rtcClient.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers(prevUsers => {
            const newUsers = { ...prevUsers };
            if (newUsers[user.uid]) {
              delete newUsers[user.uid].videoTrack;
            }
            return newUsers;
          });
          
          // Remove the video container
          const videoContainer = document.getElementById(`remote-video-${user.uid}`);
          if (videoContainer) {
            remoteVideoContainerRef.current.removeChild(videoContainer);
          }
        }
        
        if (mediaType === "audio") {
          setRemoteUsers(prevUsers => {
            const newUsers = { ...prevUsers };
            if (newUsers[user.uid]) {
              delete newUsers[user.uid].audioTrack;
            }
            return newUsers;
          });
        }
      });

      rtcClient.on("user-left", (user) => {
        setRemoteUsers(prevUsers => {
          const newUsers = { ...prevUsers };
          delete newUsers[user.uid];
          return newUsers;
        });
        
        // Remove the video container
        const videoContainer = document.getElementById(`remote-video-${user.uid}`);
        if (videoContainer) {
          remoteVideoContainerRef.current.removeChild(videoContainer);
        }
      });
    };

    initClient();

    return () => {
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (client) {
        client.leave();
      }
    };
  }, []);

  const joinChannel = async () => {
    if (!client) return;

    try {
      await client.join(APP_ID, CHANNEL, TOKEN, null);
      
      // Create and publish audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([audioTrack]);
      setLocalAudioTrack(audioTrack);
      
      // Create and publish video track
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      await client.publish([videoTrack]);
      setLocalVideoTrack(videoTrack);
      
      // Play local video track
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }
      
      setJoined(true);
    } catch (error) {
      console.error("Failed to join channel:", error);
    }
  };

  const leaveChannel = async () => {
    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    
    await client.leave();
    setRemoteUsers({});
    setJoined(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  };

  const toggleAudio = async () => {
    if (!localAudioTrack) return;
    
    if (isAudioMuted) {
      await localAudioTrack.setEnabled(true);
    } else {
      await localAudioTrack.setEnabled(false);
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = async () => {
    if (!localVideoTrack) return;
    
    if (isVideoMuted) {
      await localVideoTrack.setEnabled(true);
    } else {
      await localVideoTrack.setEnabled(false);
    }
    setIsVideoMuted(!isVideoMuted);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎥 Live Video & Voice Chat (React Web)</h1>

      {!joined ? (
        <button style={styles.joinButton} onClick={joinChannel}>
          🚀 Join Channel
        </button>
      ) : (
        <div style={styles.chatContainer}>
          <div style={styles.videoContainer}>
            <div style={styles.localVideoContainer}>
              <div 
                ref={localVideoRef} 
                style={{
                  ...styles.videoElement,
                  border: isVideoMuted ? '3px solid red' : '3px solid green'
                }}
              >
                {isVideoMuted && (
                  <div style={styles.videoMutedOverlay}>
                    <span style={styles.mutedText}>Video O'chirilgan</span>
                  </div>
                )}
              </div>
              <div style={styles.videoLabel}>
                👤 Siz ({isAudioMuted ? "Ovozsiz" : "Ovozli"})
              </div>
            </div>
            
            <div 
              ref={remoteVideoContainerRef} 
              style={styles.remoteVideosContainer}
            >
              {/* Remote videos will be inserted here by Agora */}
            </div>
          </div>
          
          <div style={styles.controls}>
            <button onClick={toggleAudio} style={isAudioMuted ? styles.mutedButton : styles.controlButton}>
              {isAudioMuted ? "🔇 Unmute" : "🎤 Mute"}
            </button>
            <button onClick={toggleVideo} style={isVideoMuted ? styles.mutedButton : styles.controlButton}>
              {isVideoMuted ? "📹 Start Video" : "📹 Stop Video"}
            </button>
            <button onClick={leaveChannel} style={styles.leaveButton}>
              ❌ Leave
            </button>
          </div>
          
          <div style={styles.participantsInfo}>
            <p>✅ Ulandingiz: {CHANNEL}</p>
            <p>👥 Qatnashchilar soni: {Object.keys(remoteUsers).length + 1}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#16213a",
    color: "white",
    minHeight: "100vh",
    padding: "20px",
  },
  title: { 
    fontSize: "28px", 
    marginBottom: "20px", 
    textAlign: "center",
    fontWeight: "600",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)"
  },
  joinButton: {
    backgroundColor: "#533483",
    padding: "15px 25px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    display: "block",
    margin: "50px auto",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  },
  chatContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  videoContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "20px",
    justifyContent: "center",
  },
  localVideoContainer: {
    position: "relative",
    width: "300px",
    height: "225px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
  },
  videoElement: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0f3460",
    borderRadius: "12px",
    objectFit: "cover",
  },
  videoMutedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
  },
  mutedText: {
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
  },
  videoLabel: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "14px",
  },
  remoteVideosContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
  },
  controls: { 
    display: "flex", 
    gap: "15px", 
    justifyContent: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  controlButton: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#533483",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    minWidth: "140px",
  },
  mutedButton: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    minWidth: "140px",
  },
  leaveButton: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    minWidth: "140px",
  },
  participantsInfo: {
    textAlign: "center",
    backgroundColor: "#0f3460",
    padding: "15px",
    borderRadius: "10px",
    marginTop: "20px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
  }
};

// Add hover effects
const addHoverEffects = `
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0,0,0,0.3);
  }
  
  .remote-video-container {
    position: relative;
    width: 300px;
    height: 225px;
    border-radius: 12px;
    overflow: hidden;
    background-color: #0f3460;
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
  
  .remote-video {
    width: 100%;
    height: 100%;
  }
  
  .remote-uid {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background-color: rgba(0,0,0,0.6);
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 14px;
  }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = addHoverEffects;
document.head.appendChild(styleSheet);

export default App;
