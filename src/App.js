import React, { useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export default function App() {
  const [joined, setJoined] = useState(false);
  const [localTrack, setLocalTrack] = useState(null);

  const APP_ID = "c5423838ad7a449c9e48d90088944c10"; // agora.io dashboarddan olingan
  const TOKEN = null; // test uchun null qo'yishingiz mumkin
  const CHANNEL = "test-channel";

  const joinChannel = async () => {
    await client.join(APP_ID, CHANNEL, TOKEN, null);

    const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
    setLocalTrack(micTrack);

    await client.publish([micTrack]);
    setJoined(true);

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio") {
        const remoteTrack = user.audioTrack;
        remoteTrack.play();
      }
    });
  };

  const leaveChannel = async () => {
    if (localTrack) {
      localTrack.close();
    }
    await client.leave();
    setJoined(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Agora Voice Chat</h2>
      {joined ? (
        <button onClick={leaveChannel}>Leave</button>
      ) : (
        <button onClick={joinChannel}>Join</button>
      )}
    </div>
  );
}
