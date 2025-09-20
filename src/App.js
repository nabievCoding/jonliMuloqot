import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "c5423838ad7a449c9e48d90088944c10"; // Sizning App ID
const TOKEN = null; // test uchun null, production uchun token kerak
const CHANNEL = "test-channel";

const App = () => {
  const [client, setClient] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setClient(rtcClient);

    rtcClient.on("user-published", async (user, mediaType) => {
      await rtcClient.subscribe(user, mediaType);
      if (mediaType === "audio") {
        user.audioTrack.play();
        setRemoteUsers((prev) => [...prev, user.uid]);
      }
    });

    rtcClient.on("user-unpublished", (user) => {
      setRemoteUsers((prev) => prev.filter((uid) => uid !== user.uid));
    });

    return () => {
      if (localTrack) localTrack.close();
      rtcClient.leave();
    };
  }, []);

  const joinChannel = async () => {
    if (!client) return;

    await client.join(APP_ID, CHANNEL, TOKEN, null);

    const track = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish([track]);
    setLocalTrack(track);
    setJoined(true);
  };

  const leaveChannel = async () => {
    if (localTrack) {
      localTrack.stop();
      localTrack.close();
    }
    await client.leave();
    setRemoteUsers([]);
    setJoined(false);
  };

  const toggleMute = async () => {
    if (!localTrack) return;
    if (isMuted) {
      await localTrack.setEnabled(true);
    } else {
      await localTrack.setEnabled(false);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎤 Live Voice Chat (React Web)</h1>

      {!joined ? (
        <button style={styles.joinButton} onClick={joinChannel}>
          🚀 Join Channel
        </button>
      ) : (
        <div style={styles.chatBox}>
          <p>✅ Ulandingiz: {CHANNEL}</p>
          <p>👥 Qatnashchilar soni: {remoteUsers.length + 1}</p>

          <div style={styles.controls}>
            <button onClick={toggleMute} style={styles.controlButton}>
              {isMuted ? "🔇 Unmute" : "🎤 Mute"}
            </button>
            <button onClick={leaveChannel} style={styles.leaveButton}>
              ❌ Leave
            </button>
          </div>

          <ul>
            <li>👤 Siz ({isMuted ? "Muted" : "Speaking"})</li>
            {remoteUsers.map((uid) => (
              <li key={uid}>👥 User {uid}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial",
    backgroundColor: "#16213a",
    color: "white",
    minHeight: "100vh",
    padding: "20px",
  },
  title: { fontSize: "28px", marginBottom: "20px", textAlign: "center" },
  joinButton: {
    backgroundColor: "#533483",
    padding: "15px 25px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    display: "block",
    margin: "0 auto",
  },
  chatBox: {
    backgroundColor: "#0f3460",
    borderRadius: "15px",
    padding: "20px",
    maxWidth: "400px",
    margin: "0 auto",
  },
  controls: { display: "flex", gap: "10px", marginTop: "20px" },
  controlButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#533483",
    color: "white",
    cursor: "pointer",
  },
  leaveButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "white",
    cursor: "pointer",
  },
};

export default App;
