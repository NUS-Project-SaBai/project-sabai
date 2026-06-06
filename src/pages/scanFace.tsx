import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import Manual from "@/components/Manual";
import MatchingPatients from "@/components/scanFace/MatchingPatients";
import RegistrationPage from "@/components/scanFace/RegistrationPage";
import { useState } from "react";

enum Mode {
  REGISTERING = "registering",
  MANUAL = "manual",
  MATCHING = "matching",
  BLANK = "",
}

function ScanFacePage() {
  const [, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(Mode.MATCHING); //should be mode.matching by default

  function handlePictureCapture(picture: string | null) {
    setImgDetails(picture);
    console.log("new pic!");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Scan Face</h1>
        <div className="flex flex-col space-y-2">
          <WebcamInput
            imageDetails={imgDetails}
            setImageDetails={handlePictureCapture}
            cameraIsOpenCallback={(isOpen) => setCameraIsOpen(isOpen)}
            width={500}
            height={500}
          />
        </div>

        {mode === Mode.REGISTERING && imgDetails && (
          <RegistrationPage
            imgDetails={imgDetails}
            setImgDetails={setImgDetails}
          />
        )}

        {mode === Mode.MATCHING && imgDetails && (
          <MatchingPatients key={imgDetails} imgDetails={imgDetails} />
        )}

        {mode === Mode.MANUAL && imgDetails && <Manual />}
      </div>
    </div>
  );
}

export default ScanFacePage;
