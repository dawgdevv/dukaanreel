import { describe, expect, it } from "vitest";
import { buildFfmpegReelArgs } from "@/lib/media/ffmpeg-command";

describe("FFmpeg reel command", () => {
  it("renders an eight-second portrait mp4 from one composed image", () => {
    expect(buildFfmpegReelArgs()).toEqual([
      "-loop", "1", "-i", "frame.png", "-t", "8", "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0008,1.08)':d=240:s=1080x1920:fps=30",
      "-r", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "reel.mp4",
    ]);
  });

  it("adds the generated MP3 and ends with the shorter media stream", () => {
    const args = buildFfmpegReelArgs(true);
    expect(args).toContain("audio.mp3");
    expect(args).toContain("aac");
    expect(args).toContain("-shortest");
  });
});
