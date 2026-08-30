export function buildFfmpegReelArgs(audio = false): string[] {
  const args = ["-loop", "1", "-i", "frame.png"];
  if (audio) args.push("-i", "audio.mp3");
  args.push(
    "-t", "5",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0008,1.08)':d=150:s=1080x1920:fps=30",
    "-r", "30", "-pix_fmt", "yuv420p",
  );
  if (audio) args.push("-c:a", "aac", "-shortest");
  args.push("-movflags", "+faststart", "reel.mp4");
  return args;
}
