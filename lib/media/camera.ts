type CameraDevice = {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
};

export function cameraConstraints(facingMode: "environment" | "user"): MediaStreamConstraints {
  return { video: { facingMode }, audio: false };
}

export function requestCameraStream(
  mediaDevices: CameraDevice | undefined,
  facingMode: "environment" | "user",
  timeoutMs = 8000,
): Promise<MediaStream> {
  if (!mediaDevices?.getUserMedia) return Promise.reject(new Error("Camera is not available in this browser"));

  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      finished = true;
      reject(new Error("Camera permission timed out. Tap Camera kholo and allow access."));
    }, timeoutMs);

    mediaDevices.getUserMedia(cameraConstraints(facingMode)).then((stream) => {
      if (finished) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      finished = true;
      clearTimeout(timer);
      resolve(stream);
    }).catch((cause: unknown) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const name = cause && typeof cause === "object" && "name" in cause ? String(cause.name) : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        reject(new Error("Camera permission denied. Browser settings se camera allow karo."));
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        reject(new Error("Camera nahi mila. Gallery se photo pick karo."));
      } else {
        reject(new Error("Camera nahi khula. Gallery se photo pick karo."));
      }
    });
  });
}
