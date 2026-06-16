import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import Manual from "@/components/Manual";
import MatchingPatients from "@/components/scanFace/MatchingPatients";
import RegistrationPage from "@/components/scanFace/RegistrationPage";
import { useState } from "react";
import { Mode } from "@/types/scan";
import Breadcrumbs from "@/components/Breadcrumbs";

function ScanFacePage() {
  const [, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(Mode.MATCHING);

  function handlePictureCapture(picture: string | null) {
    setImgDetails(picture);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Scan Face", href: "/scan-face" },
        ]}
      />
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
            setMode={setMode}
          />
        )}

        {mode === Mode.MATCHING && imgDetails && (
          <MatchingPatients
            key={imgDetails}
            imgDetails={imgDetails}
            setMode={setMode}
          />
        )}

        {mode === Mode.MANUAL && imgDetails && <Manual />}
      </div>
    </div>
  );
}

export default ScanFacePage;
