/* 

TO BE UPDATED!!

THIS FILE WAS COPIED OVER FROM OLD REPO TO MOCK FRONTEND WORKFLOW

*/

import { Button } from "@/lib/components/button";
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
  width = 250,
  height = 250,
}: {
  imageDetails: string | null;
  setImageDetails: (picture: string | null) => void;
  cameraIsOpenCallback?: (isOpen: boolean) => void;
  width?: number;
  height?: number;
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
          className="relative flex items-center justify-center bg-gray-400"
          style={{ width, height }}
        >
          {imageDetails != null && (
            <Image src={imageDetails} alt="" fill={true} unoptimized={true} />
          )}
        </div>
      )}

      {cameraIsOpen && (
        <div className="flex flex-col items-center justify-center space-y-2">
          <Webcam
            audio={false}
            width={width}
            height={height}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            videoConstraints={videoConstraints}
          />
          <Button text="Capture" onClick={webcamCapture} colour="green" />
        </div>
      )}
      <div className="mt-2 flex items-center justify-center">
        {!cameraIsOpen ? (
          imageDetails == null ? (
            <Button
              colour="green"
              text="Take Photo"
              onClick={toggleCameraOpen}
            />
          ) : (
            <Button
              colour="orange"
              text="Retake Photo"
              onClick={toggleCameraOpen}
            />
          )
        ) : (
          // don't show cancel button when there is no image captured yet
          imageDetails != null && (
            <Button colour="red" text="Cancel" onClick={toggleCameraOpen} />
          )
        )}
      </div>
    </div>
  );
}
