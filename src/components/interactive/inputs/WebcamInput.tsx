/* 

TO BE UPDATED!!

THIS FILE WAS COPIED OVER FROM OLD REPO TO MOCK FRONTEND WORKFLOW

*/

import { OldButton } from "@/components/interactive/OldButton/OldButton";
import { useToggle } from "@/lib/hooks/useToggle";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import Webcam from "react-webcam";

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
          />
          <OldButton text="Capture" onClick={webcamCapture} colour="green" />
        </div>
      )}
      <div className="mt-2 flex items-center justify-center">
        {!cameraIsOpen ? (
          imageDetails == null ? (
            <OldButton
              colour="green"
              text="Take Photo"
              onClick={toggleCameraOpen}
            />
          ) : (
            <OldButton
              colour="orange"
              text="Retake Photo"
              onClick={() => {
                toggleCameraOpen();
                setImageDetails(null);
              }}
            />
          )
        ) : (
          // don't show cancel button when there is no image captured yet
          imageDetails != null && (
            <OldButton colour="red" text="Cancel" onClick={toggleCameraOpen} />
          )
        )}
      </div>
    </div>
  );
}
