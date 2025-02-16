import { useEffect, useRef } from "react";
import io from "socket.io-client";

export const useSpeechRecognition = (onSpeechData, micEnabled, meetingEnabled, setMeetingOn) => {
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const micStreamRef = useRef(null);
  const meetingStreamRef = useRef(null);
  const micGainRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000");
    socketRef.current.on("speechData", onSpeechData);
    socketRef.current.on("googleCloudStreamError", (errMsg) => console.error("Speech Stream Error:", errMsg));
    return () => socketRef.current.disconnect();
  }, [onSpeechData]);

  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  const clearAudioGraph = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    micGainRef.current = null;
  };

  const buildAudioGraph = async () => {
    clearAudioGraph();
  
    if (!meetingEnabled && !micEnabled) {
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      meetingStreamRef.current?.getTracks().forEach((track) => track.stop());
      meetingStreamRef.current = null;
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        await audioContextRef.current.close();
      }
      audioContextRef.current = null;
      return;
    }
  
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const context = audioContextRef.current;
    let meetingSource = null;
    let micSource = null;
  
    if (meetingEnabled) {
      if (!meetingStreamRef.current) {
        try {
          meetingStreamRef.current = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          // Listen for when the user stops screen sharing.
          meetingStreamRef.current.getTracks().forEach((track) => {
            track.onended = () => {
              console.log("Screen share ended");
              setMeetingOn(false);
            };
          });
        } catch (err) {
          console.error("Error accessing meeting audio:", err);
        }
      }
      if (meetingStreamRef.current) {
        meetingSource = context.createMediaStreamSource(meetingStreamRef.current);
      }
      if (!micStreamRef.current) {
        try {
          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          console.error("Error accessing microphone:", err);
        }
      }
      if (micStreamRef.current) {
        micSource = context.createMediaStreamSource(micStreamRef.current);
        micGainRef.current = context.createGain();
        micGainRef.current.gain.value = micEnabled ? 1 : 0;
        micSource.connect(micGainRef.current);
      }
    } else if (micEnabled) {
      if (!micStreamRef.current) {
        try {
          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          console.error("Error accessing microphone:", err);
        }
      }
      if (micStreamRef.current) {
        micSource = context.createMediaStreamSource(micStreamRef.current);
        micGainRef.current = context.createGain();
        micGainRef.current.gain.value = micEnabled ? 1 : 0;
        micSource.connect(micGainRef.current);
      }
    }
  
    let outputNode = null;
    if (meetingEnabled && meetingSource && micGainRef.current) {
      const merger = context.createChannelMerger(2);
      meetingSource.connect(merger, 0, 0);
      micGainRef.current.connect(merger, 0, 1);
      outputNode = merger;
    } else if (meetingEnabled && meetingSource) {
      outputNode = meetingSource;
    } else if (!meetingEnabled && micGainRef.current) {
      outputNode = micGainRef.current;
    }
    if (!outputNode) return;
  
    const processor = context.createScriptProcessor(4096, 1, 1);
    outputNode.connect(processor);
    processor.connect(context.destination);
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16Data = float32ToInt16(inputData);
      socketRef.current.emit("sendAudioData", pcm16Data);
    };
  
    processorRef.current = processor;
    socketRef.current.emit("startGoogleCloudStream");
  };
  

  useEffect(() => {
    if (meetingEnabled && micGainRef.current) {
      micGainRef.current.gain.value = micEnabled ? 1 : 0;
    } else {
      buildAudioGraph();
    }
  }, [micEnabled, meetingEnabled]);

  const stopRecording = () => {
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    meetingStreamRef.current?.getTracks().forEach((track) => track.stop());
    meetingStreamRef.current = null;
    clearAudioGraph();
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    socketRef.current.emit("stopGoogleCloudStream");
  };

  return { stopRecording };
};
