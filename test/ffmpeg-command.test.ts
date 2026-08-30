import { describe, expect, it } from "vitest";
import { buildFfmpegReelArgs } from "@/lib/media/ffmpeg-command";

describe("FFmpeg reel command", () => {
  it("renders an exactly ten-second portrait mp4 with motion and fade effects", () => {
    expect(buildFfmpegReelArgs()).toEqual([
      "-loop", "1", "-i", "frame.png", "-t", "10", "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0004,1.12)':d=300:s=1080x1920:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=9.65:d=0.35",
      "-r", "30", "-frames:v", "300", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "reel.mp4",
    ]);
  });

  it("adds the generated MP3 and pads silence to the ten-second duration", () => {
    const args = buildFfmpegReelArgs(true);
    expect(args).toContain("audio.mp3");
    expect(args).toContain("aac");
    expect(args).toContain("apad");
    expect(args).not.toContain("-stream_loop");
  });
});
