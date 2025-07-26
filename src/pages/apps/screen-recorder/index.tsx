import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/AppLayout';
import { 
  Video, 
  Square, 
  Circle, 
  Settings,
  Download,
  Play,
  Pause,
  Monitor,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

interface RecordingSettings {
  quality: string;
  fps: string;
  audioEnabled: boolean;
  micEnabled: boolean;
  format: string;
}

export default function ScreenRecorderPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [settings, setSettings] = useState<RecordingSettings>({
    quality: '1080p',
    fps: '30',
    audioEnabled: true,
    micEnabled: false,
    format: 'webm'
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: settings.quality === '4k' ? 3840 : settings.quality === '1080p' ? 1920 : 1280,
          height: settings.quality === '4k' ? 2160 : settings.quality === '1080p' ? 1080 : 720,
          frameRate: parseInt(settings.fps)
        },
        audio: settings.audioEnabled
      });

      let finalStream = displayStream;

      // Add microphone if enabled
      if (settings.micEnabled) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Mix audio streams (simplified - in production you'd want proper audio mixing)
          const audioTracks = [...displayStream.getAudioTracks(), ...audioStream.getAudioTracks()];
          
          // Create new stream with video + both audio sources
          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...audioTracks
          ]);
        } catch (err) {
          console.warn('Could not access microphone:', err);
        }
      }

      const recorder = new MediaRecorder(finalStream, {
        mimeType: `video/${settings.format}`,
        videoBitsPerSecond: settings.quality === '4k' ? 8000000 : settings.quality === '1080p' ? 4000000 : 2000000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
        finalStream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to start recording. Please make sure you grant screen sharing permissions.');
    }
  }, [settings]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [mediaRecorder]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder) {
      if (isPaused) {
        mediaRecorder.resume();
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorder.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  }, [mediaRecorder, isPaused]);

  const downloadRecording = useCallback(() => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: `video/${settings.format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${settings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Reset
      setRecordedChunks([]);
      setRecordingTime(0);
    }
  }, [recordedChunks, settings.format]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout
      title="Screen Recorder"
      description="Record your screen with native performance"
      icon={Video}
      backTo="/?section=apps"
    >
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
            
            {/* Recording Controls */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    isRecording ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium">
                      {isRecording ? (isPaused ? 'PAUSED' : 'RECORDING') : 'READY'}
                    </span>
                  </div>
                  
                  {isRecording && (
                    <div className="text-2xl font-mono font-bold">
                      {formatTime(recordingTime)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                      <Circle className="h-4 w-4 mr-2 fill-current" />
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={pauseRecording}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={stopRecording}
                        className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Settings Row */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>Quality: {settings.quality}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>{settings.fps} FPS</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  {settings.audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span>System Audio: {settings.audioEnabled ? 'On' : 'Off'}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  {settings.micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <span>Microphone: {settings.micEnabled ? 'On' : 'Off'}</span>
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Recording Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <Select value={settings.quality} onValueChange={(value) => setSettings(prev => ({ ...prev, quality: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Frame Rate</label>
                  <Select value={settings.fps} onValueChange={(value) => setSettings(prev => ({ ...prev, fps: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 FPS</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="60">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <Select value={settings.format} onValueChange={(value) => setSettings(prev => ({ ...prev, format: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="mp4">MP4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium">Audio Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.audioEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, audioEnabled: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      System Audio
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.micEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, micEnabled: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      Microphone
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Download Recording */}
            {recordedChunks.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Recording Complete</h3>
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatTime(recordingTime)} • Format: {settings.format.toUpperCase()}
                    </p>
                  </div>
                  <Button onClick={downloadRecording} className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download Recording
                  </Button>
                </div>
              </Card>
            )}

            {/* Usage Tips */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">Tips for Better Recordings</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Close unnecessary apps to improve performance</li>
                <li>• Use 30 FPS for tutorials, 60 FPS for smooth motion content</li>
                <li>• Enable microphone to add narration to your recordings</li>
                <li>• Test your recording settings with a short sample first</li>
                <li>• Higher quality settings require more system resources</li>
              </ul>
            </Card>
          </div>
        </div>
    </AppLayout>
  );
}
