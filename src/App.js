import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "c5423838ad7a449c9e48d90088944c10"; // o'zingning APP_ID
const TOKEN = null; // App Certificate o'chirilgan bo'lsa null ishlaydi
const CHANNEL = "test";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function App() {
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState([]);

  const joinChannel = async () => {
    try {
      // Kanalga ulanish
      await client.join(APP_ID, CHANNEL, TOKEN, null);

      // Mikrofon va Kamera track
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const camTrack = await AgoraRTC.createCameraVideoTrack();

      setLocalTracks([micTrack, camTrack]);

      // Publish qilish
      await client.publish([micTrack, camTrack]);

      // Local video chiqarish
      camTrack.play("local-player");

      setJoined(true);

      console.log("✅ Kanalga qo‘shildingiz!");
    } catch (err) {
      console.error("❌ Xatolik:", err);
    }
  };

  const leaveChannel = async () => {
    localTracks.forEach(track => {
      track.stop();
      track.close();
    });

    await client.leave();
    setJoined(false);
    document.getElementById("remote-playerlist").innerHTML = "";
    console.log("❌ Kanalni tark etdingiz!");
  };

  useEffect(() => {
    // Yangi user qo‘shilganda
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video") {
        // Har bir user uchun div yaratamiz
        const remotePlayer = document.createElement("div");
        remotePlayer.id = `user-${user.uid}`;
        remotePlayer.style.width = "300px";
        remotePlayer.style.height = "200px";
        remotePlayer.style.background = "#000";
        remotePlayer.style.margin = "5px";

        document.getElementById("remote-playerlist").append(remotePlayer);

        user.videoTrack.play(remotePlayer);
      }

      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    // User chiqib ketganda divni o‘chirish
    client.on("user-unpublished", (user) => {
      const player = document.getElementById(`user-${user.uid}`);
      if (player) player.remove();
    });

    client.on("user-left", (user) => {
      const player = document.getElementById(`user-${user.uid}`);
      if (player) player.remove();
    });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Agora Video Call (React)</h2>

      {!joined ? (
        <button onClick={joinChannel}>Join Channel</button>
      ) : (
        <button onClick={leaveChannel}>Leave Channel</button>
      )}

      {/* Local video */}
      <div
        id="local-player"
        style={{
          width: "300px",
          height: "200px",
          backgroundColor: "#000",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      ></div>

      <h3>Remote Users</h3>
      <div
        id="remote-playerlist"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px",
        }}
      ></div>
    </div>
  );
}

export default App;
