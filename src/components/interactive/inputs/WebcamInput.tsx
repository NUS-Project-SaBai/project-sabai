import { useToggle } from "@/lib/hooks/useToggle";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/interactive/Button/Button";

const videoConstraints = {
  width: 720,
  height: 720,
  facingMode: "environment",
};

export function WebcamInput({
  imageDetails,
  setImageDetails,
  cameraIsOpenCallback,
  size = 250,
}: {
  imageDetails: string | null;
  setImageDetails: (picture: string | null) => void;
  cameraIsOpenCallback?: (isOpen: boolean) => void;
  size?: number;
}) {
  const [cameraIsOpen, toggleCameraOpen, setCameraIsOpen] = useToggle(true);

  const webcamRef = useRef<Webcam>(null);
  const webcamCapture = useCallback(() => {
    const imgSrc = webcamRef?.current?.getScreenshot() || null;
    setImageDetails(imgSrc);
  }, [setImageDetails]);

  useEffect(() => {
    // close camera if image is already available (either photo just taken, or
    // photo is already available when you open registration modal)
    if (imageDetails) setCameraIsOpen(false);
    // open camera automatically if there is no image
    else setCameraIsOpen(true);
  }, [imageDetails, setCameraIsOpen]);

  useEffect(() => {
    if (cameraIsOpenCallback) cameraIsOpenCallback(cameraIsOpen);
  }, [cameraIsOpen, cameraIsOpenCallback]);

  return (
    <div className="flex flex-col items-center">
      <label className="block text-sm font-medium">
        Photo<span className="text-red-500">*</span>
      </label>
      {!cameraIsOpen && (
        <div
          className="relative flex items-center justify-center bg-gray-400 w-full aspect-square"
          style={{ maxWidth: size }}
        >
          {imageDetails != null && (
            <Image src={imageDetails} alt="" fill={true} unoptimized={true} />
          )}
        </div>
      )}

      {cameraIsOpen && (
        <div
          className="flex flex-col items-center justify-center space-y-2 w-full"
          style={{ maxWidth: size }}
        >
          <Webcam
            audio={false}
            width="100%"
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            videoConstraints={videoConstraints}
            id="webcam"
          />
          <Button title="Capture" colour="emerald" onClick={webcamCapture} />
        </div>
      )}
      <div className="mt-2 flex items-center justify-center">
        {!cameraIsOpen ? (
          imageDetails == null ? (
            <Button
              colour="emerald"
              title="Take Photo"
              onClick={toggleCameraOpen}
            />
          ) : (
            <Button
              colour="red"
              title="Retake Photo"
              onClick={() => {
                toggleCameraOpen();
                setImageDetails(null);
              }}
            />
          )
        ) : (
          // don't show cancel button when there is no image captured yet
          imageDetails != null && (
            <Button colour="red" title="Cancel" onClick={toggleCameraOpen} />
          )
        )}
      </div>
    </div>
  );
}
