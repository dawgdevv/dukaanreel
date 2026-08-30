import { describe, expect, it } from "vitest";
import { cameraConstraints, requestCameraStream } from "@/lib/media/camera";

describe("camera access", () => {
  it("uses mobile-safe camera constraints", () => {
    expect(cameraConstraints("environment")).toEqual({ video: { facingMode: "environment" }, audio: false });
  });

  it("reports a useful error when camera access is unavailable", async () => {
    await expect(requestCameraStream(undefined, "environment")).rejects.toThrow("Camera is not available");
  });

  it("times out when the browser never resolves the permission request", async () => {
    const mediaDevices = { getUserMedia: () => new Promise<MediaStream>(() => {}) };
    await expect(requestCameraStream(mediaDevices, "environment", 5)).rejects.toThrow("Camera permission timed out");
  });
});
