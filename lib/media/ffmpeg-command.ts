export function buildFfmpegReelArgs(audio = false): string[] {
  const args = ["-loop", "1", "-i", "frame.png"];
  if (audio) args.push("-i", "audio.mp3");
  args.push(
    "-t", "10",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0004,1.12)':d=300:s=1080x1920:fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=9.65:d=0.35",
    "-r", "30", "-frames:v", "300", "-pix_fmt", "yuv420p",
  );
  if (audio) args.push("-c:a", "aac", "-af", "apad");
  args.push("-movflags", "+faststart", "reel.mp4");
  return args;
}
